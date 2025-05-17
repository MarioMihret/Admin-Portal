import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart, 
  FileText, 
  Calendar,
  DollarSign,
  FileBarChart,
  ClipboardCheck,
  LucideIcon
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const adminNavigationLinks: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Applications', href: '/admin/applications', icon: FileText },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]; 
