import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/types/applications';

interface StatusBadgeProps {
  status: ApplicationStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}) => {
  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: CheckCircle,
        };
      case 'Rejected':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: XCircle,
        };
      case 'Pending':
      default:
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: Clock,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.bgColor,
      config.textColor,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5')} />}
      {status}
    </span>
  );
};

export default StatusBadge; 