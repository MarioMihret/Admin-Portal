import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS
 * Combines clsx and tailwind-merge for optimal class name handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to filter applications by search term and status
export function filterApplications(applications: any[], searchTerm: string, statusFilter: string) {
  return applications.filter(app => {
    // Filter by status if not "all"
    if (statusFilter && statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    
    // Filter by search term (check name, email, organization)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        app.name.toLowerCase().includes(term) || 
        app.email.toLowerCase().includes(term) || 
        app.organization.toLowerCase().includes(term)
      );
    }
    
    // If no filters or passes all filters
    return true;
  });
} 