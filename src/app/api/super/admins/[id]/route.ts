import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import { AdminUser, IAdminUser } from '../route'; // Assuming AdminUser model is exported from ../route.ts
import { Role } from '@/models/Role'; // Import Role model

const BCRYPT_SALT_ROUNDS = 10;

// Zod schema for updating an Admin User (all fields optional)
const adminUserUpdateSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  university: z.string().min(1, { message: "University cannot be empty" }).optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
  role: z.string().min(1, {message: "Role cannot be empty"}).optional(), // Allow role updates if necessary
});

interface Params {
  id: string;
}

// Interface for leaned Role document (copied from ../route.ts for now, adjust if needed)
interface IRoleDocument {
  _id: any; // Mongoose _id can be ObjectId or string after .toString()
  name: string;
  email: string;
  password?: string; // Password will be selected out
  role: 'admin' | 'super-admin';
  isActive: boolean;
  requirePasswordChange: boolean;
  failedLoginAttempts: number;
  lastPasswordChange: Date;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/super/admins/[id] - Fetches a single admin user by ID from Role, augments with AdminUser
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    // Attempt to get university from query params, as edit context might be university-specific
    // The frontend edit page should pass this if an admin is linked to multiple universities.
    const universityQuery = searchParams.get('university'); 

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid admin ID format" }, { status: 400 });
    }

    // 1. Fetch the primary admin data from the Role collection using the ID
    const roleAdmin = await Role.findById(id).select("-password").lean<IRoleDocument>();

    if (!roleAdmin) {
      return NextResponse.json({ message: "Admin not found in Role collection" }, { status: 404 });
    }

    // 2. Fetch the corresponding AdminUser link(s) to get university-specific details
    // If university is provided in query, use it to get specific link.
    // Otherwise, you might fetch all links or the first one found if an admin can be in multiple.
    let adminUserLink: IAdminUser | null = null;
    if (universityQuery) {
      adminUserLink = await AdminUser.findOne({ email: roleAdmin.email, university: universityQuery })
        .select("-passwordHash")
        .lean<IAdminUser>();
    } else {
      // If no university in query, try to find any AdminUser link for this email.
      // This part might need refinement based on how you want to handle edits for admins linked to multiple unis.
      adminUserLink = await AdminUser.findOne({ email: roleAdmin.email })
        .select("-passwordHash")
        .lean<IAdminUser>();
    }

    // 3. Combine data for the response
    // The structure should ideally match what the edit form expects.
    // Prioritize details from AdminUser link if available (like status or university-specific name)
    const responseData = {
      _id: roleAdmin._id.toString(),
      id: roleAdmin._id.toString(),
      name: adminUserLink?.name || roleAdmin.name,
      email: roleAdmin.email,
      role: roleAdmin.role, // Main role from Role collection
      // If adminUserLink is found and has university, use it. Fallback if needed, or make it required.
      university: adminUserLink?.university || (universityQuery || 'N/A'), 
      // Status from AdminUser link is preferred as it's university-specific
      status: adminUserLink?.status || (roleAdmin.isActive ? 'Active' : 'Inactive'),
      // Timestamps: decide which are more relevant or combine
      createdAt: adminUserLink?.createdAt || roleAdmin.createdAt,
      updatedAt: adminUserLink?.updatedAt || roleAdmin.updatedAt,
      // Add other fields the edit page might need, e.g., requirePasswordChange from roleAdmin
      requirePasswordChange: roleAdmin.requirePasswordChange,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error fetching admin user ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error fetching admin user", error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/super/admins/[id] - Updates an admin user by ID
// This PATCH will now need to update both Role and AdminUser collections consistently.
export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    await connectToDatabase();
    const { id: roleId } = params; // ID from Role collection
    const body = await request.json();

    if (!roleId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid admin ID format" }, { status: 400 });
    }

    const validation = adminUserUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input for updating admin user", errors: validation.error.format() }, { status: 400 });
    }

    const { 
      name: newName, 
      email: newEmail, // New email if provided
      password: newPassword, 
      university: targetUniversity, // The university context for this update
      status: newStatus,         // New status for the admin AT targetUniversity
      role: newPrimaryRole    // New primary role (admin/super-admin)
    } = validation.data;

    // --- Step 1: Update the Role Document ---
    const roleDoc = await Role.findById(roleId);
    if (!roleDoc) {
      return NextResponse.json({ message: "Admin not found in Role collection" }, { status: 404 });
    }

    const originalEmail = roleDoc.email; // Store original email for AdminUser lookup/update
    let roleNeedsSave = false;

    if (newName && roleDoc.name !== newName) {
      roleDoc.name = newName;
      roleNeedsSave = true;
    }

    if (newEmail && roleDoc.email !== newEmail) {
      const existingRoleWithNewEmail = await Role.findOne({ email: newEmail, _id: { $ne: roleId } });
      if (existingRoleWithNewEmail) {
        return NextResponse.json({ message: "Another user with this email already exists in roles." }, { status: 409 });
      }
      roleDoc.email = newEmail;
      roleNeedsSave = true;
    }

    if (newPrimaryRole && roleDoc.role !== newPrimaryRole) {
      roleDoc.role = newPrimaryRole as ('admin' | 'super-admin');
      roleNeedsSave = true;
    }

    if (newPassword) {
      roleDoc.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      roleDoc.requirePasswordChange = false;
      roleDoc.lastPasswordChange = new Date();
      roleNeedsSave = true;
    }

    // isActive in Role might be a global status, newStatus is university-specific.
    // Decide if newStatus (university specific) should also update roleDoc.isActive (global).
    // For now, let's assume roleDoc.isActive is only changed if a 'status' that implies global deactivation is sent,
    // or handle it separately. Let's say `newStatus` from form primarily targets AdminUser.
    // If you want to update roleDoc.isActive based on newStatus for this specific university:
    // if (newStatus && targetUniversity === roleDoc.universityIfPrimaryUni) { // Hypothetical primary uni field
    //    roleDoc.isActive = newStatus === 'Active';
    //    roleNeedsSave = true;
    // }


    if (roleNeedsSave) {
      roleDoc.updatedAt = new Date();
      await roleDoc.save();
    }

    // --- Step 2: Update or Create AdminUser Link for the targetUniversity ---
    if (targetUniversity) {
      let adminUserLink = await AdminUser.findOne({ 
        email: originalEmail, // Use original email to find the link first
        university: targetUniversity 
      });

      if (adminUserLink) {
        // Link exists, update it
        let adminUserNeedsSave = false;
        if (newName && adminUserLink.name !== newName) { // Sync name
          adminUserLink.name = newName;
          adminUserNeedsSave = true;
        }
        if (newEmail && adminUserLink.email !== newEmail) { // Sync email if it changed
          adminUserLink.email = newEmail;
          adminUserNeedsSave = true;
        }
        if (newStatus && adminUserLink.status !== newStatus) {
          adminUserLink.status = newStatus;
          adminUserNeedsSave = true;
        }
        // Sync role context if needed
        if (newPrimaryRole && adminUserLink.role !== newPrimaryRole) {
          adminUserLink.role = newPrimaryRole; // Assuming AdminUser.role can store 'admin' or 'super-admin'
          adminUserNeedsSave = true;
        }
        if (newPassword && roleDoc.password && adminUserLink.passwordHash !== roleDoc.password) {
          adminUserLink.passwordHash = roleDoc.password; // Sync new password hash
          adminUserNeedsSave = true;
        }

        if (adminUserNeedsSave) {
          await adminUserLink.save();
        }
      } else {
        // Link does NOT exist for this email at targetUniversity. CREATE IT.
        // This makes the university dropdown on the edit form effectively an "associate with this university" action.
        console.warn(`AdminUser link for ${originalEmail} at ${targetUniversity} not found. Creating one.`);
        const newAdminUserLink = new AdminUser({
          name: newName || roleDoc.name,
          email: newEmail || originalEmail, // Use the final email from Role doc
          role: newPrimaryRole || roleDoc.role, // Use final role from Role doc
          university: targetUniversity,
          status: newStatus || 'Pending', // Default to Pending or Active if creating new
          passwordHash: roleDoc.password, // Get current hash from Role doc
          // createdAt, updatedAt will be set by Mongoose timestamps
        });
        await newAdminUserLink.save();
      }
      
      // If email changed, we might need to update OTHER AdminUser links if they existed for the originalEmail
      // This part is complex if an admin can be linked to multiple universities and you change their global email.
      // The logic above updates/creates for the *targetUniversity*.
      // If the email was changed (roleDoc.email is different from originalEmail), 
      // we need to update all *other* AdminUser links from originalEmail to roleDoc.email.
      if (newEmail && originalEmail !== newEmail) {
        await AdminUser.updateMany(
          { email: originalEmail, university: { $ne: targetUniversity } }, // Exclude the one we just handled
          { $set: { email: newEmail, name: newName || roleDoc.name } } // also update name if it changed
        );
      }

    } else {
      // No targetUniversity specified in payload - this case should ideally not happen if form always sends it.
      // If it does, current logic updates all AdminUser links if name/email changed globally.
       if (newEmail && originalEmail !== newEmail) {
        await AdminUser.updateMany({ email: originalEmail }, { $set: { email: newEmail, name: newName || roleDoc.name } });
      } else if (newName) {
        await AdminUser.updateMany({ email: originalEmail }, { $set: { name: newName } });
      }
    }

    // --- Step 3: Re-fetch and Respond (current logic for this is okay) ---
    const updatedRoleAdmin = await Role.findById(roleId).select("-password").lean<IRoleDocument>();
    let finalAdminUserLink: IAdminUser | null = null;
    if (targetUniversity) {
        finalAdminUserLink = await AdminUser.findOne({ email: updatedRoleAdmin!.email, university: targetUniversity }).select("-passwordHash").lean<IAdminUser>();
    } else { // Fallback if somehow targetUniversity wasn't there, try to find any link
        finalAdminUserLink = await AdminUser.findOne({ email: updatedRoleAdmin!.email }).select("-passwordHash").lean<IAdminUser>();
    }

    const responseData = {
      _id: updatedRoleAdmin!._id.toString(),
      id: updatedRoleAdmin!._id.toString(),
      name: finalAdminUserLink?.name || updatedRoleAdmin!.name,
      email: updatedRoleAdmin!.email,
      role: updatedRoleAdmin!.role,
      university: finalAdminUserLink?.university || targetUniversity || 'N/A',
      status: finalAdminUserLink?.status || (updatedRoleAdmin!.isActive ? 'Active' : 'Inactive'),
      createdAt: finalAdminUserLink?.createdAt || updatedRoleAdmin!.createdAt,
      updatedAt: finalAdminUserLink?.updatedAt || updatedRoleAdmin!.updatedAt,
      requirePasswordChange: updatedRoleAdmin!.requirePasswordChange,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error updating admin user ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
     if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error for Admin user update", errors: error.format() }, { status: 400 });
    }
    return NextResponse.json({ message: "Error updating admin user", error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/super/admins/[id] - Deletes an admin user by ID
// This DELETE will now need to delete from both Role and associated AdminUser entries.
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    await connectToDatabase();
    const { id } = params; // This ID is expected to be the Role ID

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid admin ID format" }, { status: 400 });
    }

    // 1. Find the role entry to get the email before deleting
    const roleAdminToDelete = await Role.findById(id).select("email");

    if (!roleAdminToDelete) {
      return NextResponse.json({ message: "Admin user not found in Role collection" }, { status: 404 });
    }

    const adminEmail = roleAdminToDelete.email;

    // 2. Delete from Role collection
    await Role.findByIdAndDelete(id);

    // 3. Delete all associated AdminUser links for that email
    // Consider if you want to delete only for a specific university if context is provided.
    // For a full delete of the admin identity, deleting all links makes sense.
    await AdminUser.deleteMany({ email: adminEmail });

    // Return a success message, and optionally the email of the deleted admin for confirmation
    return NextResponse.json({ message: "Admin user and associated links deleted successfully", deletedAdminEmail: adminEmail }, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error deleting admin user ${params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Error deleting admin user", error: errorMessage }, { status: 500 });
  }
} 