'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Define payment method types
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export function usePaymentMethods() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/payment-methods');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      
      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create setup intent for adding a new payment method
  const createSetupIntent = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/billing/payment-methods', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create setup intent');
      }
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating setup intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare for adding a payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Set payment method as default
  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/billing/payment-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          action: 'setDefault',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }
      
      toast({
        title: 'Default Payment Method Updated',
        description: 'Your default payment method has been updated successfully.',
      });
      
      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to update default payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove payment method
  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/billing/payment-methods?id=${paymentMethodId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }
      
      toast({
        title: 'Payment Method Removed',
        description: 'Your payment method has been removed successfully.',
      });
      
      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    isLoading,
    isProcessing,
    clientSecret,
    fetchPaymentMethods,
    createSetupIntent,
    setDefaultPaymentMethod,
    removePaymentMethod,
    stripePromise,
  };
}

// Component for adding a new payment method
export function AddPaymentMethodForm({ 
  clientSecret, 
  onSuccess,
  onCancel,
}: { 
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent.status === 'succeeded') {
        toast({
          title: 'Payment Method Added',
          description: 'Your payment method has been added successfully.',
        });
        onSuccess();
      } else {
        throw new Error('Failed to add payment method');
      }
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add payment method');
      toast({
        title: 'Error',
        description: err.message || 'Failed to add payment method',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="card-element" className="text-sm font-medium">
          Card Details
        </label>
        <div className="p-3 border rounded-md">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={isProcessing || !stripe}
        >
          {isProcessing ? 'Processing...' : 'Add Payment Method'}
        </button>
      </div>
    </form>
  );
}

// Wrapper component with Stripe Elements
export function AddPaymentMethod({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  return (
    <Elements stripe={stripePromise}>
      <AddPaymentMethodForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
