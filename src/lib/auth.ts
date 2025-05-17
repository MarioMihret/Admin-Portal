import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { compare } from "bcryptjs";
import { User } from "@/models/User";
import { MongoClient } from "mongodb";
import { ROLES, AppRole } from "@/constants/roles";

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
            if (adminUser.role !== ROLES.ADMIN && adminUser.role !== ROLES.SUPER_ADMIN) {
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
              role: adminUser.role as AppRole,
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
        token.role = user.role as AppRole;
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
        session.user.role = token.role as AppRole;
        session.user.requirePasswordChange = token.requirePasswordChange as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl: originalBaseUrl }) {
      const appBaseUrl = process.env.NEXTAUTH_URL || originalBaseUrl;

      // If the provided url is already correctly based, return it
      if (url.startsWith(appBaseUrl)) {
        return url;
      }

      // If the url is relative (e.g., "/dashboard"), make it absolute with appBaseUrl
      if (url.startsWith("/")) {
        return `${appBaseUrl}${url}`;
      }

      // If the url is absolute but has a different origin (e.g., http://localhost:3000 instead of http://localhost:3001)
      // attempt to reconstruct it with the correct appBaseUrl, preserving path and query.
      try {
        const incomingUrl = new URL(url);
        if (incomingUrl.origin !== appBaseUrl) {
          console.log(`Redirecting from ${incomingUrl.origin} to ${appBaseUrl} for path ${incomingUrl.pathname}`);
          return `${appBaseUrl}${incomingUrl.pathname}${incomingUrl.search}${incomingUrl.hash}`;
        }
        // If origins match, but it didn't pass the startsWith check (e.g. trailing slash differences), return it as is.
        return url;
      } catch (e) {
        // This might happen if the URL is not a valid absolute URL and not starting with "/"
        // For example, a malformed URL or an unexpected relative path format.
        console.warn(`Redirect callback: Could not parse '${url}' as an absolute URL. Falling back to originalBaseUrl logic.`);
        // Fallback to original logic for unparseable or non-relative-path URLs.
        return url.startsWith('/') ? `${originalBaseUrl}${url}` : url;
      }
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