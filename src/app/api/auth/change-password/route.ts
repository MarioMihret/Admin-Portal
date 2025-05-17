import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { MongoClient } from 'mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    let client: MongoClient | null = null;

    try {
      client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const db = client.db();

      let user;
      let collectionToUpdate; // Variable to store the correct collection name

      // First look for the user in the role collection (for admins)
      user = await db.collection('role').findOne({
        email: session.user.email
      });
      
      if (user) {
        collectionToUpdate = 'role'; // User found in 'role' collection
      } else {
        // If not found in role collection, check user collection
        user = await db.collection('user').findOne({
          email: session.user.email
        });
        if (user) {
          collectionToUpdate = 'user'; // User found in 'user' collection
        }
      }

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      // Verify current password
      const isPasswordValid = await compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, 12);
      
      // Update password and remove password change requirement in the correct collection
      if (!collectionToUpdate) { 
        // Should not happen if user was found, but as a safeguard
        console.error("Error: collectionToUpdate was not set for user:", session.user.email);
        throw new Error("Could not determine user collection for password update.");
      }

      await db.collection(collectionToUpdate).updateOne(
        { _id: user._id }, 
        {
          $set: {
            password: hashedPassword,
            requirePasswordChange: false,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json(
        { message: 'Password updated successfully' },
        { status: 200 }
      );
    } finally {
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { message: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
} 