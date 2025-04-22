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

      // First look for the user in the role collection (for admins)
      let user = await db.collection('role').findOne({
        email: session.user.email
      });
      
      // If not found in role collection, check user collection
      if (!user) {
        user = await db.collection('user').findOne({
          email: session.user.email
        });
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
      
      // Determine which collection to update
      const collectionName = user._id.toString().startsWith('role') ? 'role' : 'user';
      
      // Update password and remove password change requirement
      await db.collection(collectionName).updateOne(
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