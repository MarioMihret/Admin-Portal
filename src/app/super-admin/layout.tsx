import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { cookies } from 'next/headers';
import { 
  SuperAdminNavigation, 
  SuperAdminMobileNavProvider, 
  SuperAdminMobileNavToggle,
  SuperAdminMobileNav,
  useMobileNav
} from "@/components/super-admin/SuperAdminNavigation";
import { LayoutClientParts } from "@/components/super-admin/LayoutClientParts";
import { TopBarTitle } from "@/components/super-admin/TopBarTitle";
import { LogOut, Search, Bell, Settings as SettingsIcon, UserCircle, Menu as MenuIcon } from 'lucide-react';
import { Toaster } from 'sonner';

// Server action for sign out
async function signOutAction() {
  "use server";
  cookies().delete('next-auth.session-token');
  cookies().delete('__Secure-next-auth.session-token');
  cookies().delete('next-auth.csrf-token');
  cookies().delete('__Secure-next-auth.csrf-token');
  cookies().delete('next-auth.callback-url');
  cookies().delete('__Secure-next-auth.callback-url');
  
  redirect('/auth/signin');
}

// Client component to render conditional parts like mobile menu
// function LayoutClientParts() {
//   const { isOpen } = useMobileNav();
//   return <>{isOpen && <SuperAdminMobileNav />}</>;
// }

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "super-admin") {
    redirect("/unauthorized");
  }

  const userName = session.user!.name;
  const userEmail = session.user!.email;
  let userInitial = 'S';
  if (userName) {
    userInitial = userName.charAt(0).toUpperCase();
  } else if (userEmail) {
    userInitial = userEmail.charAt(0).toUpperCase();
  }

  return (
    <SuperAdminMobileNavProvider>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/super-admin/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Super Portal
                </span>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <SuperAdminNavigation />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-medium text-lg shadow">
                  {userInitial}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                    {userName || 'Super Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                    {userEmail}
                  </p>
                </div>
              </div>
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="lg:hidden">
                  <SuperAdminMobileNavToggle />
                </div>
                <div className="hidden lg:block">
                  <TopBarTitle />
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Example icons - can be customized or removed */}
                {/* <button className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button> */}
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <LayoutClientParts />
    </SuperAdminMobileNavProvider>
  );
} 