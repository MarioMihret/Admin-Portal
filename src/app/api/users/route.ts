import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Role } from "@/models/Role";

export async function GET(request: Request) {
  try {
    console.log('Connecting to database...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    // Get query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    console.log('Querying with params:', { search, limit, page, skip });
    
    // Create a query object for searching
    const query = search 
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } }
          ]
        } 
      : {};
    
    console.log('Executing query on user collection...');
    
    // Fetch users with pagination
    const users = await User.find(query)
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${users.length} users`);
    
    // Get admin roles from role collection
    if (users.length > 0) {
      // Get all emails to look up in the role collection
      const userEmails = users.map(user => user.email);
      
      // Find all admin roles for these users
      const adminRoles = await Role.find({ 
        email: { $in: userEmails } 
      });
      
      // Map emails to roles for quick lookup
      const emailToRoleMap = new Map();
      adminRoles.forEach(role => {
        emailToRoleMap.set(role.email, role.role);
      });
      
      // Update user roles from the admin roles
      users.forEach(user => {
        const adminRole = emailToRoleMap.get(user.email);
        if (adminRole) {
          user.role = adminRole;
        }
      });
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    console.log('Total users count:', total);
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Connecting to database for creating user...');
    const connection = await connectToDatabase();
    console.log('Database connected:', connection?.db?.databaseName || 'unknown');
    
    const body = await request.json();
    const { name, email, password, role, requirePasswordChange = false } = body;
    console.log('Creating user with email:', email);
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User with email already exists:', email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Determine if password change is required
    // For regular users (role 'user'), never require password change
    const shouldRequirePasswordChange = role === 'user' ? false : requirePasswordChange;
    
    // Create new user
    console.log('Creating new user in database...');
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isActive: true,
      requirePasswordChange: shouldRequirePasswordChange,
      loginHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('User created successfully with ID:', newUser._id);
    
    // Remove password from response
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      requirePasswordChange: newUser.requirePasswordChange,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      loginHistory: newUser.loginHistory || []
    };
    
    return NextResponse.json({ user: userResponse }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}