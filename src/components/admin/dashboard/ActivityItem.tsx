import Link from 'next/link';
import { Activity } from 'lucide-react'; // Or a more specific icon
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  userInitial: string;
  userName?: string;
  userLink?: string;
  action: string;
  timestamp: string; // e.g., "2 hours ago"
  itemLink?: string; // Optional link for the action item
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  userInitial,
  userName,
  userLink,
  action,
  timestamp,
  itemLink
}) => {
  const UserLink = userLink ? Link : 'div';
  const ItemLink = itemLink ? Link : 'span';

  return (
    <div className="flex items-start">
      <UserLink href={userLink || '#'} className={cn("flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center", userLink && "hover:bg-blue-200 transition-colors")}>
        <span className="text-blue-600 font-medium">{userInitial}</span>
      </UserLink>
      <div className="ml-3">
        <p className="text-sm text-gray-900">
          <UserLink href={userLink || '#'} className={cn("font-medium", userLink && "hover:underline")}>{userName || 'User'}</UserLink>
          {' '}
          <ItemLink href={itemLink || '#'} className={cn(itemLink && "text-blue-600 hover:underline")}>
            {action}
          </ItemLink>
        </p>
        <p className="text-xs text-gray-500">{timestamp}</p>
      </div>
    </div>
  );
};

export default ActivityItem; 