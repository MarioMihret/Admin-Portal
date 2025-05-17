"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Settings,
  Shield, // Changed from Calendar for Admin Management
  CreditCard, // Added for Subscription
  LifeBuoy, // Added for Support
  ShieldCheck, // Added ShieldCheck icon
  DollarSign, // Added DollarSign icon
  CalendarDays, // Added CalendarDays icon
  FileText, // Added FileText icon
  UserCog, // Added UserCog icon
  LayoutList // Added LayoutList icon
  // Assuming other icons like FileText, ClipboardList, FileBarChart, DollarSign might not be needed unless specified
} from "lucide-react";

// Define the shape of a navigation item
export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  // Add any other properties like subItems if needed in the future
}

// Define navigation links specifically for Super Admin
export const superAdminNavigationLinks: NavItem[] = [
  { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { name: "User Management", href: "/super-admin/users", icon: Users },
  { name: "Admin Management", href: "/super-admin/admins", icon: UserCog },
  { name: "Subscription", href: "/super-admin/subscription", icon: CreditCard },
  { name: "Support", href: "/super-admin/support", icon: LifeBuoy },
  { name: "System Settings", href: "/super-admin/settings", icon: Settings },
  { name: "Security", href: "/super-admin/security", icon: ShieldCheck },
  { name: "Financials", href: "/super-admin/financials", icon: DollarSign },
  // { name: "Event Management", href: "/super-admin/events", icon: CalendarDays },
  // { name: "Subscription Plans", href: "/super-admin/plans", icon: LayoutList }
];

// NavLink component for desktop navigation (adapted for Super Admin)
function SuperAdminNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/super-admin/dashboard" && pathname.startsWith(item.href));


  // Example: Use purple theme for active state if desired
  const activeClasses = "bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700";
  const inactiveClasses = "text-gray-700 hover:bg-purple-50/50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-purple-700/20 dark:hover:text-purple-300";
  const activeIconClasses = "text-purple-700 dark:text-purple-400";
  const inactiveIconClasses = "text-gray-400 group-hover:text-purple-700 dark:text-gray-500 dark:group-hover:text-purple-400";
  const activeIndicatorClass = "bg-purple-600 dark:bg-purple-500";

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative ${ // Added relative for absolute positioning of active indicator
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      <item.icon
        className={`h-5 w-5 transition-colors duration-200 ${
          isActive ? activeIconClasses : inactiveIconClasses
        }`}
      />
      <span>{item.name}</span>
      {isActive && (
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${activeIndicatorClass} rounded-r-full`} aria-hidden="true" />
      )}
    </Link>
  );
}

// Context for mobile navigation state
interface MobileNavContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error('useMobileNav must be used within a SuperAdminMobileNavProvider');
  }
  return context;
}


// Mobile navigation toggle button (adapted for Super Admin)
function SuperAdminMobileNavToggle() {
  const { setIsOpen } = useMobileNav();
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-purple-50/50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-purple-700/20 dark:hover:text-purple-300"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}

// Mobile navigation component (adapted for Super Admin)
function SuperAdminMobileNav() {
  const { setIsOpen } = useMobileNav();
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Example: Use purple theme for mobile menu
  const mobileBgGradient = "bg-gradient-to-b from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/30";
  const headerBorderClass = "border-purple-100/50 dark:border-purple-700/50";
  const closeButtonHoverClass = "hover:bg-purple-50/50 hover:text-purple-700 dark:hover:bg-purple-700/30 dark:hover:text-purple-300";
  const activeLinkMobileClasses = "bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700 dark:from-purple-700/30 dark:to-purple-800/50 dark:text-purple-200";
  const inactiveLinkMobileClasses = "text-gray-700 hover:bg-purple-50/50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-purple-700/20 dark:hover:text-purple-300";
  const activeIconMobileClasses = "text-purple-700 dark:text-purple-300";
  const inactiveIconMobileClasses = "text-gray-400 group-hover:text-purple-700 dark:text-gray-500 dark:group-hover:text-purple-300";


  return (
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/20 backdrop-blur-sm transition-opacity duration-300 dark:bg-black/40"
        onClick={() => setIsOpen(false)}
      />
      <div className={`fixed inset-y-0 right-0 z-[1000] w-full max-w-xs sm:max-w-sm transform overflow-hidden ${mobileBgGradient} shadow-xl transition-transform duration-300 ease-in-out`}>
        <div className="flex h-full flex-col">
          <div className={`flex items-center justify-between border-b ${headerBorderClass} px-4 py-4`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className={`rounded-lg p-2 text-gray-500 dark:text-gray-400 ${closeButtonHoverClass} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {superAdminNavigationLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/super-admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    setTimeout(() => setIsOpen(false), 100);
                  }}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all duration-200 ${ // Increased text size slightly for mobile
                    isActive ? activeLinkMobileClasses : inactiveLinkMobileClasses
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isActive ? activeIconMobileClasses : inactiveIconMobileClasses
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

// Desktop navigation component (adapted for Super Admin)
export function SuperAdminNavigation() {
  // Example: Use purple theme for section header
  const sectionHeaderClass = "text-purple-600 dark:text-purple-400";
  return (
    <nav className="flex flex-col gap-2">
      <div className="px-3 py-2">
        <h2 className={`mb-2 px-2 text-xs font-semibold uppercase tracking-wider ${sectionHeaderClass}`}>
          Super Admin Menu
        </h2>
        <div className="space-y-1">
          {superAdminNavigationLinks.map((item) => (
            <SuperAdminNavLink key={item.name} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
}

// Mobile navigation provider component (adapted for Super Admin)
// This provider will now only provide context. The toggle and menu will be placed in the layout.
export function SuperAdminMobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ isOpen, setIsOpen }}>
      {children} {/* The actual layout that will consume the context */}
    </MobileNavContext.Provider>
  );
}

// Export the toggle and menu components so they can be used in the layout
export { SuperAdminMobileNavToggle, SuperAdminMobileNav }; 