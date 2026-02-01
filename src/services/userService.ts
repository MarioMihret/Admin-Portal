// Type definitions
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  requirePasswordChange?: boolean;
  createdAt: string;
  updatedAt: string;
  lastPasswordChange?: string;
  lastLogin?: string;
  lastLogout?: string;
  loginHistory?: Array<{
    loginTime?: string;
    logoutTime?: string;
    userAgent?: string;
    ipAddress?: string;
  }>;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationResult;
}

export interface UserResponse {
  user: User;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  requirePasswordChange?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  requirePasswordChange?: boolean;
}

// API methods
export const userService = {
  // Get all users with pagination and search
  getUsers: async (search: string = '', page: number = 1, limit: number = 10, status: string = 'all'): Promise<UsersResponse> => {
    try {
      const response = await fetch(`/api/users?search=${search}&page=${page}&limit=${limit}&status=${status}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      const userData = await response.json();
      
      // Fetch admin roles from the role collection
      try {
        const rolesResponse = await fetch(`/api/roles`);
        
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          
          if (rolesData && rolesData.roles && Array.isArray(rolesData.roles)) {
            // Map of email to role
            const roleMap = new Map();
            rolesData.roles.forEach((role: any) => {
              if (role && role.email && role.role) {
                roleMap.set(role.email, role.role);
              }
            });
            
            // Update user roles with admin roles from the role collection
            userData.users = userData.users.map((user: User) => {
              const adminRole = roleMap.get(user.email);
              if (adminRole) {
                return { ...user, role: adminRole };
              }
              return user;
            });
          } else {
            console.error('Invalid roles data structure:', rolesData);
          }
        }
      } catch (error) {
        console.error('Error fetching admin roles:', error);
      }
      
      return userData;
    } catch (error) {
      console.error('Error in getUsers service:', error);
      throw error;
    }
  },
  
  // Get a single user by ID
  getUserById: async (id: string): Promise<UserResponse> => {
    try {
      const userResponse = await fetch(`/api/users/${id}`);
      
      if (!userResponse.ok) {
        throw new Error(`Error fetching user: ${userResponse.statusText}`);
      }
      
      const userData = await userResponse.json();
      
      // Check if user has admin/super-admin role in the role collection
      try {
        // Use the user's email to fetch the role, properly URL encoded
        const encodedEmail = encodeURIComponent(userData.user.email);
        const roleByEmailResponse = await fetch(`/api/roles/email/${encodedEmail}`);
        
        // If role exists, update the user's role with the one from role collection
        if (roleByEmailResponse.ok) {
          const roleData = await roleByEmailResponse.json();
          userData.user.role = roleData.role.role;
        }
      } catch (error) {
        // If error fetching role, just continue with user data
        console.error('Error fetching role, using basic role:', error);
      }
      
      return userData;
    } catch (error) {
      console.error('Error in getUserById service:', error);
      throw error;
    }
  },
  
  // Create a new user
  createUser: async (userData: CreateUserInput): Promise<UserResponse> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error creating user: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in createUser service:', error);
      throw error;
    }
  },
  
  // Update an existing user
  updateUser: async (id: string, userData: UpdateUserInput): Promise<UserResponse> => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error updating user: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateUser service:', error);
      throw error;
    }
  },
  
  // Delete a user
  deleteUser: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error deleting user: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in deleteUser service:', error);
      throw error;
    }
  },
  
  // Update a user's role in the role collection (for admin and super-admin)
  updateUserRole: async (userId: string, role: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`/api/roles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error updating user role: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateUserRole service:', error);
      throw error;
    }
  },
}; 