import Link from 'next/link';
import { LucideIcon, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames

interface StatCardProps {
  name: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red'; // Add more as needed
  link?: string;
  isLoading?: boolean;
  error?: string;
}

// Map color names to Tailwind classes to avoid purging issues
const colorClasses = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
};

const StatCard: React.FC<StatCardProps> = ({
  name,
  value,
  change,
  trend,
  icon: Icon,
  color,
  link,
  isLoading,
  error
}) => {
  const cardContent = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{name}</p>
          {isLoading ? (
             <div className="mt-1 h-7 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : error ? (
            <p className="mt-1 text-sm font-medium text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" /> Error
            </p>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          )}
        </div>
        <div className={cn(`p-3 rounded-full`, colorClasses[color]?.bg || colorClasses.blue.bg)}>
          <Icon className={cn(`w-6 h-6`, colorClasses[color]?.text || colorClasses.blue.text)} />
        </div>
      </div>
      {!isLoading && !error && change && trend && (
        <div className="mt-4 flex items-center">
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span className={cn(`ml-1 text-sm font-medium`, trend === 'up' ? 'text-green-600' : 'text-red-600')}>
            {change}
          </span>
          <span className="ml-2 text-sm text-gray-500">vs last month</span> {/* Make dynamic later */}
        </div>
      )}
      {error && (
        <p className="mt-4 text-xs text-red-500 truncate">
           {error}
        </p>
      )}
    </>
  );

  const cardClasses = "bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-md";

  if (link && !isLoading && !error) {
    return (
      <Link href={link} className={cn(cardClasses, "hover:border-gray-300")}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  );
};

export default StatCard; 