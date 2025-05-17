import { useState, useCallback, useEffect } from 'react';
import { ISubscriptionPlanFE } from '../types'; // From our shared types
import { fetchPlansData, togglePlanStatusOnPage } from '../api'; // API calls
import { toast } from 'sonner';

export const usePlanDefinitions = () => {
  const [plansData, setPlansData] = useState<ISubscriptionPlanFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPlans = await fetchPlansData();
      setPlansData(fetchedPlans);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not load plan definitions.';
      setError(errorMessage);
      toast.error(errorMessage);
      setPlansData([]); // Clear plans on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleTogglePlanStatus = async (planToToggle: ISubscriptionPlanFE) => {
    const originalStatus = planToToggle.isActive;
    const originalPlans = [...plansData]; // For optimistic update rollback

    // Optimistic UI update
    setPlansData(prevPlans => 
      prevPlans.map(p => 
        p._id === planToToggle._id ? { ...p, isActive: !p.isActive } : p
      )
    );
    
    toast.loading(`${originalStatus ? 'Deactivating' : 'Activating'} ${planToToggle.name}...`);

    try {
      const updatedPlan = await togglePlanStatusOnPage(planToToggle.slug, originalStatus);
      setPlansData(prevPlans => 
        prevPlans.map(p => (p._id === updatedPlan._id ? updatedPlan : p))
      );
      toast.dismiss(); // Dismiss loading toast
      toast.success(`Plan ${updatedPlan.name} ${updatedPlan.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.dismiss(); // Dismiss loading toast
      const errorMessage = err instanceof Error ? err.message : 'Operation failed to toggle plan status.';
      toast.error(errorMessage);
      // Rollback optimistic update
      setPlansData(originalPlans);
    }
  };
  
  const refreshPlansData = () => {
    loadPlans();
  };

  return {
    plansData,
    isLoading,
    error,
    handleTogglePlanStatus,
    refreshPlansData, // Expose refresh function
  };
}; 