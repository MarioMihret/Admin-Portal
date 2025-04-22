import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { compare } from "bcryptjs";
import { User } from "@/models/User";
import { MongoClient } from "mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Auth attempt with email:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          throw new Error("Invalid credentials");
        }

        let client: MongoClient | null = null;
        
        try {
          console.log("Connecting to database with URI:", process.env.MONGODB_URI);
          client = new MongoClient(process.env.MONGODB_URI!);
          await client.connect();
          console.log("Connected to MongoDB successfully");
          
          const db = client.db();
          console.log("Using database:", db.databaseName);
          
          // First check for admin users in the role collection (matches seed format)
          console.log("Searching for user in role collection");
          const adminUser = await db.collection("role").findOne({ 
            email: credentials.email
          });
          
          // If found in role collection, verify admin privileges
          if (adminUser) {
            console.log("Admin user found in role collection");
            
            if (!adminUser.isActive) {
              console.log("Admin user is inactive");
              throw new Error("User is inactive");
            }
            
            // Verify this is actually an admin or super-admin
            if (adminUser.role !== 'admin' && adminUser.role !== 'super-admin') {
              console.log("User in role collection does not have admin privileges");
              throw new Error("Access denied. Only admin users can log in.");
            }
            
            console.log("Admin user found, checking password");
            const isPasswordValid = await compare(credentials.password, adminUser.password);
            console.log("Password validation result:", isPasswordValid ? "Valid" : "Invalid");
            
            if (!isPasswordValid) {
              console.log("Invalid password");
              // Update failed login attempts
              await db.collection("role").updateOne(
                { _id: adminUser._id },
                { $inc: { failedLoginAttempts: 1 } }
              );
              throw new Error("Invalid password");
            }
            
            console.log("Password valid, resetting failed attempts");
            // Reset failed login attempts on successful login
            await db.collection("role").updateOne(
              { _id: adminUser._id },
              { $set: { failedLoginAttempts: 0 } }
            );
            
            console.log("Admin login successful, returning user data");
            return {
              id: adminUser._id.toString(),
              email: adminUser.email,
              name: adminUser.name,
              role: adminUser.role,
              requirePasswordChange: adminUser.requirePasswordChange,
            };
          }
          
          // If not found in roles collection, look for regular users
          console.log("User not found in role collection, checking user collection");
          const regularUser = await db.collection("user").findOne({ 
            email: credentials.email
          });
          
          console.log("User search result:", regularUser ? "User found" : "User not found");

          if (!regularUser) {
            console.log("No user found");
            throw new Error("No user found");
          }
          
          if (!regularUser.isActive) {
            console.log("User is inactive");
            throw new Error("User is inactive");
          }
          
          // Regular users cannot log in to admin portal
          console.log("Regular user found, but only admins can log in");
          throw new Error("Access denied. Only admin users can log in.");
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        } finally {
          if (client) {
            await client.close();
            console.log("MongoDB connection closed");
          }
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // When signing in
      if (user) {
        token.role = user.role;
        token.requirePasswordChange = user.requirePasswordChange;
      }
      
      // On token refresh, check if password change requirement has updated
      if (trigger === "update" && token.email) {
        try {
          const client = new MongoClient(process.env.MONGODB_URI!);
          await client.connect();
          const db = client.db();
          
          // Check in role collection first (for admins)
          const adminUser = await db.collection("role").findOne({ 
            email: token.email
          });
          
          if (adminUser) {
            // Update token with current value from database
            token.requirePasswordChange = adminUser.requirePasswordChange;
          }
          
          await client.close();
        } catch (error) {
          console.error("Error updating token:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.requirePasswordChange = token.requirePasswordChange as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Check if this is a sign-in callback URL
      if (url.includes('/api/auth/callback') || url.includes('/api/auth/signin')) {
        // On sign-in, we will determine the redirect in middleware based on requirePasswordChange
        return baseUrl;
      }
      
      // For other URLs, maintain them as is
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default to base URL
      return baseUrl;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 