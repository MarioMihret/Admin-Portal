"use client";

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { UserCog, UserX, ShieldAlert, Search, Filter, RefreshCw, Lock, Unlock, CalendarDays, Edit3, Trash2, UserCheck } from 'lucide-react';

// Interfaces
interface ManagedAccount {
  id: string; // Internal ID for the management record
  userId: string;
  userName: string;
  userEmail: string;
  status: 'locked' | 'banned' | 'active'; // 'active' for potential future use if showing all users
  reason?: string;
  statusDate: string; // ISO date string
  setBy?: 'system' | string; // 'system' or admin ID
  failedAttempts?: number;
}

interface AccountFilters {
  searchTerm?: string;
  status?: 'locked' | 'banned' | 'active' | '';
  dateFrom?: string;
  dateTo?: string;
}

// Mock Data
const generateMockAccounts = (count: number): ManagedAccount[] => {
  const accounts: ManagedAccount[] = [];
  const users = [
    { id: 'usr_john_locke', name: 'John Locke', email: 'john.locke@example.com' },
    { id: 'usr_jane_ban', name: 'Jane Bannington', email: 'jane.ban@example.com' },
    { id: 'usr_mike_restrict', name: 'Mike Restrict', email: 'mike.restrict@company.com' },
    { id: 'usr_sara_issue', name: 'Sara Issue', email: 'sara.issue@email.org' },
  ];
  const reasons = [
    'Multiple failed login attempts.',
    'Violation of terms of service.',
    'Suspicious activity detected.',
    'Manual administrative lock.',
    'Account compromise suspected.'
  ];
  const statuses: ManagedAccount['status'][] = ['locked', 'banned'];

  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    const status = statuses[i % statuses.length];
    const randomPastMilliseconds = Math.random() * 60 * 24 * 60 * 60 * 1000; // up to 60 days ago

    accounts.push({
      id: `mngacc_${Date.now()}_${i}`,
      userId: user.id + `_${i}`,
      userName: user.name,
      userEmail: user.email.replace('@', `+${i}@`),
      status: status,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      statusDate: new Date(Date.now() - randomPastMilliseconds).toISOString(),
      setBy: Math.random() > 0.3 ? 'system' : 'adm_super_admin',
      failedAttempts: status === 'locked' ? Math.floor(Math.random() * 10) + 3 : undefined,
    });
  }
  return accounts.sort((a,b) => new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime());
};


// API Simulation
const fetchManagedAccounts = async (filters: AccountFilters): Promise<{ accounts: ManagedAccount[], totalCount: number }> => {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
  let mockAccounts = generateMockAccounts(20); // Generate a base set

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    mockAccounts = mockAccounts.filter(acc => 
      acc.userName.toLowerCase().includes(term) || 
      acc.userEmail.toLowerCase().includes(term) ||
      acc.userId.toLowerCase().includes(term)
    );
  }
  if (filters.status) {
    mockAccounts = mockAccounts.filter(acc => acc.status === filters.status);
  }
  if (filters.dateFrom) {
    mockAccounts = mockAccounts.filter(acc => new Date(acc.statusDate) >= new Date(filters.dateFrom!));
  }
  if (filters.dateTo) {
    mockAccounts = mockAccounts.filter(acc => new Date(acc.statusDate) <= new Date(filters.dateTo!));
  }
  
  return { accounts: mockAccounts, totalCount: mockAccounts.length };
};

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Account Card Component
const AccountCard: React.FC<{ account: ManagedAccount; onUnlock: (userId: string) => void; onEditBan: (accountId: string) => void; onDeleteRecord: (accountId: string) => void; }> = ({ account, onUnlock, onEditBan, onDeleteRecord }) => {
  const isLocked = account.status === 'locked';
  const isBanned = account.status === 'banned';

  const cardBorderColor = isLocked ? 'border-yellow-500 dark:border-yellow-400' : isBanned ? 'border-red-600 dark:border-red-500' : 'border-gray-300 dark:border-gray-600';
  const cardAccentColor = isLocked ? 'bg-yellow-50 dark:bg-yellow-700/20' : isBanned ? 'bg-red-50 dark:bg-red-700/20' : 'bg-gray-50 dark:bg-gray-700/20';
  const iconColor = isLocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-700 dark:text-red-500';

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border-l-4 ${cardBorderColor} transition-all duration-300 hover:shadow-xl`}>
      <div className={`p-5 ${cardAccentColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {isLocked && <Lock className={`h-6 w-6 mr-2 ${iconColor}`} />}
            {isBanned && <UserX className={`h-6 w-6 mr-2 ${iconColor}`} />}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate" title={account.userName}>{account.userName}</h3>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${isLocked ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-600/50 dark:text-yellow-200' : 'bg-red-200 text-red-800 dark:bg-red-600/50 dark:text-red-200'}`}>
            {account.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={account.userEmail}>{account.userEmail}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">User ID: {account.userId}</p>
      </div>
      <div className="px-5 py-4 space-y-2.5 text-sm">
        {account.reason && (
          <div className="flex items-start">
            <ShieldAlert className="h-4 w-4 mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Reason:</span> {account.reason}</p>
          </div>
        )}
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Date:</span> {formatDate(account.statusDate)}</p>
        </div>
        {account.failedAttempts !== undefined && (
          <div className="flex items-center">
             <span className="font-bold text-xs mr-2 text-gray-400 dark:text-gray-500">!</span>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Failed Attempts:</span> {account.failedAttempts}</p>
          </div>
        )}
         {account.setBy && (
          <div className="flex items-center">
            <UserCog className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Set By:</span> {account.setBy}</p>
          </div>
        )}
      </div>
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
        {isLocked && (
          <button 
            onClick={() => onUnlock(account.userId)} 
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-offset-gray-800 transition-colors shadow-sm hover:shadow-md"
          >
            <Unlock size={14} /> Unlock User
          </button>
        )}
        {isBanned && (
          <button 
            onClick={() => onEditBan(account.id)} 
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800 transition-colors shadow-sm hover:shadow-md"
          >
            <Edit3 size={14} /> Edit Ban
          </button>
        )}
         <button 
            onClick={() => onDeleteRecord(account.id)} 
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors shadow-sm hover:shadow-md"
            title="Remove this management record (does not affect user data)"
          >
            <Trash2 size={14} /> Clear Record
          </button>
      </div>
    </div>
  );
};

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AccountFilters>({ status: 'locked' }); // Default to showing locked accounts
  const [showFilterControls, setShowFilterControls] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const { accounts: fetchedAccounts, totalCount: fetchedTotalCount } = await fetchManagedAccounts(filters);
      setAccounts(fetchedAccounts);
      setTotalCount(fetchedTotalCount);
    } catch (error) {
      console.error("Failed to fetch managed accounts:", error);
      setAccounts([]);
      setTotalCount(0);
      // TODO: User-friendly error toast
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [filters]);

  const handleUnlockUser = (userId: string) => {
    console.log("Unlock user:", userId);
    // Placeholder: API call to unlock, then refresh or update state
    alert(`Simulating unlock for user ID: ${userId}`);
    // Example: Optimistically update UI or refetch
    // setAccounts(prev => prev.filter(acc => acc.userId !== userId && acc.status === 'locked'));
    // loadAccounts(); // or refetch
  };

  const handleEditBan = (accountId: string) => {
    console.log("Edit ban for account record:", accountId);
    alert(`Simulating edit ban for account record ID: ${accountId}`);
  };
  
  const handleDeleteRecord = (accountId: string) => {
    console.log("Delete management record:", accountId);
    alert(`Simulating delete for management record ID: ${accountId}`);
    setAccounts(prev => prev.filter(acc => acc.id !== accountId)); // Optimistic UI update
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-full lg:max-w-7xl xl:max-w-screen-xl space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <UserCog className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
            Account Management
          </h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Manage user account locks, bans, and review statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilterControls(!showFilterControls)} 
            className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            title={showFilterControls ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="h-5 w-5" />
          </button>
          <button onClick={loadAccounts} title="Refresh accounts" className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* TODO: Add a dedicated panel/form for Lock/Ban User Action here */}

      {showFilterControls && (
         <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Filter Accounts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Term</label>
              <input type="text" name="searchTerm" id="searchTerm" placeholder="Name, email, or ID..." value={filters.searchTerm || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm" />
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="status" id="statusFilter" value={filters.status || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option value="">All</option>
                <option value="locked">Locked</option>
                <option value="banned">Banned</option>
                {/* <option value="active">Active</option> */}
              </select>
            </div>
            {/* Future: Date range filters */}
             <div className="col-span-full mt-2 flex justify-end">
                 <button onClick={() => { setFilters({status: 'locked'}); loadAccounts(); }} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md shadow-sm">Reset to Defaults</button>
             </div>
          </div>
        </div>
      )}
      
      {isLoading && accounts.length === 0 ? (
        <div className="py-20 text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading account data...</p>
        </div>
      ) : !isLoading && accounts.length === 0 ? (
        <div className="py-20 text-center">
          <UserX size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-1">No Accounts Found</h3>
          <p className="text-md text-gray-500 dark:text-gray-400">No accounts match your current filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <AccountCard 
              key={account.id} 
              account={account} 
              onUnlock={handleUnlockUser} 
              onEditBan={handleEditBan}
              onDeleteRecord={handleDeleteRecord}
            />
          ))}
        </div>
      )}
      {/* TODO: Add pagination if totalCount > accounts.length */}
    </div>
  );
} 