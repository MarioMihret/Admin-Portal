import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { ApplicationStats } from '@/types/applications';
import StatCard from '@/components/admin/dashboard/StatCard';

interface ApplicationsStatsProps {
  stats: ApplicationStats;
  isLoading?: boolean;
  error?: string;
}

const ApplicationsStats: React.FC<ApplicationsStatsProps> = ({ 
  stats, 
  isLoading = false,
  error
}) => {
  const statsConfig = [
    {
      key: 'total',
      name: 'Total Applications',
      value: stats.total.toString(),
      icon: Users,
      color: 'blue' as const,
      link: '/admin/applications'
    },
    {
      key: 'pending',
      name: 'Pending Review',
      value: stats.pending.toString(),
      icon: Clock,
      color: 'yellow' as const,
      link: '/admin/applications?status=pending'
    },
    {
      key: 'approved',
      name: 'Approved',
      value: stats.approved.toString(),
      icon: CheckCircle,
      color: 'green' as const,
      link: '/admin/applications?status=approved'
    },
    {
      key: 'rejected',
      name: 'Rejected',
      value: stats.rejected.toString(),
      icon: XCircle,
      color: 'red' as const,
      link: '/admin/applications?status=rejected'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.key}
          name={stat.name}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          link={stat.link}
          isLoading={isLoading}
          error={error}
        />
      ))}
    </div>
  );
};

export default ApplicationsStats; 