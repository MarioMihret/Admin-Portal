import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { AppRole } from "@/constants/roles";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    user?: {
      id: string;
      role: AppRole;
      requirePasswordChange?: boolean;
    } & DefaultSession["user"]; // Keep existing user properties and add ours
  }

  interface User extends DefaultUser {
    role: AppRole;
    requirePasswordChange?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    role?: AppRole;
    requirePasswordChange?: boolean;
    // id is typically in `sub` claim for JWT
  }
} 