"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleSignOut = async () => {
    // You can specify a callbackUrl if you want to redirect to a specific page after sign out
    // By default, it redirects to the current page or the home page after sign out process is complete on the server.
    // Since we want to go to /auth/signin, we can let NextAuth handle its default behavior or specify callbackUrl.
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign out
    </button>
  );
} 