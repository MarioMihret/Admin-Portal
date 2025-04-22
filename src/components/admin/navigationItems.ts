import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart2, 
  FileText, 
  Calendar,
  ClipboardCheck,
  LucideIcon
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Applications', href: '/admin/applications', icon: ClipboardCheck },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]; 