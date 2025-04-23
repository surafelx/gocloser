'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { refreshTrainingData } from '@/app/actions/training-actions';

export function RefreshTrainingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const result = await refreshTrainingData();
      
      if (result.success) {
        toast({
          title: 'Training data refreshed',
          description: result.message,
        });
      } else {
        toast({
          title: 'Failed to refresh training data',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error refreshing training data:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while refreshing training data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh} 
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Processing PDFs...' : 'Refresh Training Data'}
    </Button>
  );
}
