import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { 
  LogOut,
  Search
} from "lucide-react";
import { AdminNavigation, MobileNavProvider } from "@/components/admin/Navigation";
import { signOutAction } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "admin" && session.user.role !== "super-admin")) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-white/90 backdrop-blur-sm shadow-sm border-r border-blue-100 flex flex-col">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-blue-100">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Portal
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <AdminNavigation />
          </div>

          {/* User section */}
          <div className="p-4 border-t border-blue-100">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {session.user.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {session.user.email}
                </p>
              </div>
            </div>
            <form action={signOutAction} className="mt-3">
              <button
                type="submit"
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-blue-100 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              {/* Mobile logo - only icon */}
              <div className="ml-4 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4 hidden sm:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-blue-100 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Search..."
                />
              </div>
            </div>

            {/* Right side icons - empty for now */}
            <div className="flex items-center space-x-4">
              {/* Notification icon removed */}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Mobile navigation toggle - positioned in top right corner of screen */}
      <div className="fixed top-4 right-4 z-50 lg:hidden">
        <MobileNavProvider>
          <div></div>
        </MobileNavProvider>
      </div>
    </div>
  );
} 