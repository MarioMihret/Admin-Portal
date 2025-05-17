"use client";

import { useMobileNav, SuperAdminMobileNav } from "./SuperAdminNavigation";

export function LayoutClientParts() {
  const { isOpen } = useMobileNav();
  return <>{isOpen && <SuperAdminMobileNav />}</>;
} 