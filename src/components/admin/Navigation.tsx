"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  BarChart, 
  FileText, 
  ClipboardList, 
  FileBarChart,
  DollarSign
} from "lucide-react";

// Navigation item interface
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

// Navigation items
const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Applications", href: "/admin/applications", icon: FileText },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Payments", href: "/admin/payments", icon: DollarSign },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart },
  { name: "Reports", href: "/admin/reports", icon: FileBarChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// NavLink component for desktop navigation
function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700"
          : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-700"
      }`}
    >
      <item.icon
        className={`h-5 w-5 transition-colors duration-200 ${
          isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700"
        }`}
      />
      <span>{item.name}</span>
      {isActive && (
        <div className="absolute left-0 h-full w-1 bg-blue-600 rounded-r-full" />
      )}
    </Link>
  );
}

// Mobile navigation toggle button
function MobileNavToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}

// Mobile navigation component
function MobileNav({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[999] bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Mobile menu */}
      <div className="fixed inset-y-0 right-0 z-[1000] w-full max-w-sm transform overflow-hidden bg-gradient-to-b from-white to-blue-50/30 shadow-xl transition-transform duration-300 ease-in-out">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue-100/50 px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-blue-50/50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Add a small delay before closing to allow for animation
                    setTimeout(onClose, 100);
                  }}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700"
                      : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-700"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isActive
                        ? "text-blue-700"
                        : "text-gray-400 group-hover:text-blue-700"
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

// Desktop navigation component
export function AdminNavigation() {
  return (
    <nav className="flex flex-col gap-2">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Main Menu
        </h2>
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
}

// Mobile navigation provider component
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children}
      {isOpen && <MobileNav onClose={() => setIsOpen(false)} />}
      <MobileNavToggle onOpen={() => setIsOpen(true)} />
    </>
  );
} 