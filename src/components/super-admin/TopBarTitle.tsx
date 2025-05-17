"use client";

import { usePathname } from 'next/navigation';
import { superAdminNavigationLinks } from './SuperAdminNavigation'; // Assuming this has name and href

export function TopBarTitle() {
  const pathname = usePathname();

  // Find the current page name from navigation links
  const currentNavItem = superAdminNavigationLinks.find(link => pathname.startsWith(link.href));
  
  let title = "Super Portal"; // Default title
  if (currentNavItem) {
    title = currentNavItem.name;
  }
  // You might want to add more sophisticated logic for titles of sub-pages 
  // or pages not directly in the main navigation (e.g., an "Edit User" page).
  // For example:
  if (pathname.includes('/users/') && pathname !== '/super-admin/users') title = 'User Details';
  if (pathname.includes('/admins/') && pathname !== '/super-admin/admins') title = 'Admin Details';
  if (pathname.includes('/settings') && !pathname.endsWith('/settings')) title = 'Setting Details';


  return (
    <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
      {title}
    </h1>
  );
} 