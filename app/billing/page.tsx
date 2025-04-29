"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { AreaChart } from "@/components/charts"
import {
  AlertCircle,
  Check,
  CreditCard,
  Download,
  Package,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AnimatedElement from "@/components/animated-element";
import { useSubscription } from "@/hooks/use-subscription";
import {
  usePaymentMethods,
  AddPaymentMethod,
} from "@/hooks/use-payment-methods";
import { SUBSCRIPTION_PLANS } from "@/lib/whop";

// Create a simple error boundary component since React's ErrorBoundary is class-based
const ErrorBoundary = ({ children, FallbackComponent, onError }: {
  children: React.ReactNode;
  FallbackComponent: React.ComponentType<any>;
  onError?: (error: Error) => void;
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Add error event listener
    const errorHandler = (event: ErrorEvent) => {
      console.error('Error caught by ErrorBoundary:', event.error);
      setError(event.error);
      setHasError(true);
      if (onError) onError(event.error);
    };

    // Add unhandled rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Promise rejection caught by ErrorBoundary:', event.reason);
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      setError(error);
      setHasError(true);
      if (onError) onError(error);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, [onError]);

  if (hasError) {
    return <FallbackComponent error={error} />;
  }

  return <>{children}</>;
};

// Define plan types
interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceId: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

// Create a client component that uses searchParams
function BillingPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [isAddingTokens, setIsAddingTokens] = useState(false);
  const [additionalTokens, setAdditionalTokens] = useState(100000);
  const [apiError, setApiError] = useState<string | null>(null);

  // Token stats state
  const [tokenStats, setTokenStats] = useState<{
    tokenLimit: number;
    tokensUsed: number;
    tokensRemaining: number;
    percentageUsed: number;
    planId: string;
    planName: string;
    hasActiveSubscription: boolean;
  }>({
    tokenLimit: 100000, // Default value
    tokensUsed: 0,
    tokensRemaining: 100000,
    percentageUsed: 0,
    planId: "free",
    planName: "Free",
    hasActiveSubscription: false,
  });

  // Get subscription and payment methods
  const {
    subscription,
    tokenUsage,
    dailyUsage,
    isLoading: isLoadingSubscription,
    isChangingPlan,
    fetchSubscription,
    fetchTokenUsage,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    addTokens,
  } = useSubscription();

  const {
    paymentMethods,
    isLoading: isLoadingPaymentMethods,
    isProcessing,
    clientSecret,
    fetchPaymentMethods,
    createSetupIntent,
    setDefaultPaymentMethod,
    removePaymentMethod,
  } = usePaymentMethods();

  // Fetch token stats
  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        console.log("Fetching token usage stats...");
        // Get the user's token usage stats
        const response = await fetch("/api/token-usage/stats");

        if (!response.ok) {
          throw new Error(`Failed to fetch token stats: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Token stats data:", data);

        if (data.success) {
          setTokenStats({
            tokenLimit: data.tokenLimit || 100000,
            tokensUsed: data.tokensUsed || 0,
            tokensRemaining: data.tokensRemaining || 100000,
            percentageUsed: data.percentageUsed || 0,
            planId: data.planId || "free",
            planName: data.planName || "Free",
            hasActiveSubscription: data.hasActiveSubscription || false,
          });

          console.log("Token stats updated successfully");
        } else {
          console.error("Token stats API returned success: false", data);
          toast({
            title: "Failed to load token usage",
            description: data.error || "Please try again later",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching token stats:", error);
        toast({
          title: "Failed to load token usage",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    };

    fetchTokenStats();

    // Set up interval to refresh token stats every minute
    const intervalId = setInterval(fetchTokenStats, 60000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [toast]);

  // Check for success or canceled params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const plan = searchParams.get("plan");
    const sessionPreserved = searchParams.get("session_preserved");

    // Check if we need to refresh auth state
    if (sessionPreserved === "true") {
      // Ensure we have the latest auth state
      const checkAuthState = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (!response.ok) {
            console.warn('Session may have expired, redirecting to login...');
            // Don't redirect immediately, let the user see the toast message first
          }
        } catch (error) {
          console.error('Error checking auth state:', error);
        }
      };

      checkAuthState();
    }

    if (success === "true" && plan) {
      toast({
        title: "Subscription Updated",
        description: `You have successfully subscribed to the ${
          plan.charAt(0).toUpperCase() + plan.slice(1)
        } plan.`,
      });

      // Refresh subscription data
      fetchSubscription();
      fetchTokenUsage();
    } else if (canceled === "true") {
      toast({
        title: "Subscription Update Canceled",
        description: "You have canceled the subscription update.",
      });
    }
  }, [searchParams, toast, fetchSubscription, fetchTokenUsage]);

  // Handle adding a payment method
  const handleAddPaymentMethod = async () => {
    await createSetupIntent();
    setIsAddingPaymentMethod(true);
  };

  // Handle payment method added
  const handlePaymentMethodAdded = async () => {
    setIsAddingPaymentMethod(false);
    await fetchPaymentMethods();
  };

  // Handle adding tokens
  const handleAddTokens = async () => {
    await addTokens(additionalTokens);
    setIsAddingTokens(false);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get all plans
  const allPlans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        <Tabs defaultValue="subscription">
          <TabsList className="mb-6">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="tokens">Token Usage</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            <div className="space-y-6">
              {isLoadingSubscription ? (
                <Card>
                  <CardContent className="py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : subscription ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      You are currently on the {subscription.planName} plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">
                          {subscription.planName} Plan
                        </p>
                        <p className="text-muted-foreground">
                          {subscription.planId === "free"
                            ? "Free"
                            : `$${
                                SUBSCRIPTION_PLANS[
                                  subscription.planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS
                                ]?.price
                              }/month`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          subscription.status === "active"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : subscription.status === "canceled" ||
                              subscription.cancelAtPeriodEnd
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        {subscription.cancelAtPeriodEnd
                          ? "Canceling"
                          : subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                      </Badge>
                    </div>

                    {subscription.planId !== "free" && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          {subscription.cancelAtPeriodEnd
                            ? `Your subscription will be canceled on ${formatDate(
                                subscription.currentPeriodEnd
                              )}`
                            : `Your next billing date is ${formatDate(
                                subscription.currentPeriodEnd
                              )}`}
                        </p>
                      </div>
                    )}

                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Token Usage</span>
                        <span>
                          {tokenStats.tokensUsed.toLocaleString()} /{" "}
                          {tokenStats.tokenLimit.toLocaleString()} tokens
                        </span>
                      </div>
                      <Progress
                        value={tokenStats.percentageUsed}
                        className="h-2"
                        style={
                          {
                            "--progress-value": `${tokenStats.percentageUsed}%`,
                            "--progress-color":
                              tokenStats.percentageUsed < 50
                                ? "var(--green-500)"
                                : tokenStats.percentageUsed < 80
                                ? "var(--amber-500)"
                                : "var(--red-500)",
                          } as React.CSSProperties
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>
                          {tokenStats.tokensRemaining.toLocaleString()} tokens
                          remaining
                        </span>
                        <span>{tokenStats.percentageUsed}% used</span>
                      </div>

                      {tokenStats.percentageUsed > 80 && (
                        <div className="flex items-center gap-1.5 mt-3 text-red-500">
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-xs">
                            Approaching token limit
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    {subscription.planId !== "free" &&
                      (subscription.cancelAtPeriodEnd ? (
                        <Button
                          variant="outline"
                          onClick={reactivateSubscription}
                          disabled={isChangingPlan}
                        >
                          Reactivate Subscription
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={cancelSubscription}
                          disabled={isChangingPlan}
                        >
                          Cancel Subscription
                        </Button>
                      ))}

                    {subscription.planId !== "free" && (
                      <Button
                        variant="default"
                        onClick={() => setIsAddingTokens(true)}
                        disabled={isChangingPlan}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Add Tokens
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-10">
                    <div className="flex justify-center">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                    </div>
                    <p className="text-center mt-4">
                      Failed to load subscription data. Please try again.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div>
                <h2 className="text-xl font-bold mb-6">Available Plans</h2>
                <div className="grid md:grid-cols-4 gap-6">
                  {allPlans.map((plan) => (
                    <AnimatedElement
                      key={plan.id}
                      type="fade-in"
                      duration={400}
                      staggerIndex={allPlans.indexOf(plan)}
                    >
                      <Card
                        className={`h-full flex flex-col ${
                          plan.id === "professional"
                            ? "border-primary shadow-md"
                            : ""
                        }`}
                      >
                        <CardHeader>
                          {plan.id === "professional" && (
                            <Badge className="w-fit mb-2" variant="default">
                              Popular
                            </Badge>
                          )}
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="mb-4">
                            <span className="text-3xl font-bold">
                              ${plan.price}
                            </span>
                            <span className="text-muted-foreground">
                              /month
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant={
                              subscription?.planId === plan.id
                                ? "outline"
                                : plan.id === "professional"
                                ? "gradient"
                                : "default"
                            }
                            className="w-full"
                            disabled={
                              isChangingPlan || subscription?.planId === plan.id
                            }
                            onClick={() => changePlan(plan.id)}
                          >
                            {subscription?.planId === plan.id
                              ? "Current Plan"
                              : "Select Plan"}
                          </Button>
                        </CardFooter>
                      </Card>
                    </AnimatedElement>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tokens">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Token Usage</CardTitle>
                  <CardDescription>
                    Monitor your token usage and limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSubscription ? (
                    <div className="py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-accent/20 rounded-lg p-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Current Plan
                          </p>
                          <p className="text-2xl font-bold">
                            {tokenStats.planName}
                          </p>
                        </div>

                        <div className="bg-accent/20 rounded-lg p-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Total Tokens
                          </p>
                          <p className="text-2xl font-bold">
                            {tokenStats.tokenLimit.toLocaleString()}
                          </p>
                        </div>

                        <div className="bg-accent/20 rounded-lg p-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Tokens Remaining
                          </p>
                          <p className="text-2xl font-bold">
                            {tokenStats.tokensRemaining.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Usage</span>
                          <span>{tokenStats.percentageUsed}%</span>
                        </div>
                        <Progress
                          value={tokenStats.percentageUsed}
                          className="h-3"
                          style={
                            {
                              "--progress-value": `${tokenStats.percentageUsed}%`,
                              "--progress-color":
                                tokenStats.percentageUsed < 50
                                  ? "var(--green-500)"
                                  : tokenStats.percentageUsed < 80
                                  ? "var(--amber-500)"
                                  : "var(--red-500)",
                            } as React.CSSProperties
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>0</span>
                          <span>{tokenStats.tokenLimit.toLocaleString()}</span>
                        </div>
                      </div>

                      {tokenStats.percentageUsed > 80 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <p className="font-medium text-red-600 dark:text-red-400">
                              Approaching Token Limit
                            </p>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            You have used {tokenStats.percentageUsed}% of your token limit.
                            Consider upgrading your plan or adding more tokens.
                          </p>
                        </div>
                      )}

                      {/* Daily usage chart would go here */}

                      {tokenStats.hasActiveSubscription && (
                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={() => setIsAddingTokens(true)}
                            disabled={isChangingPlan}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Add More Tokens
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View your past invoices and payment history
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                {/* This would be replaced with real data from the API */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(
                            Date.now() - i * 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {i === 1
                            ? "Professional"
                            : i === 2
                            ? "Professional"
                            : "Starter"}{" "}
                          Plan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${i === 1 || i === 2 ? "79.00" : "29.00"}
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        >
                          Paid
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPaymentMethods ? (
                  <div className="py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </div>
                ) : paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {method.brand.charAt(0).toUpperCase() +
                                method.brand.slice(1)}{" "}
                              ending in {method.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires{" "}
                              {method.expMonth.toString().padStart(2, "0")}/
                              {method.expYear}
                            </p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary"
                          >
                            Default
                          </Badge>
                        )}
                        <div className="flex gap-2">
                          {!method.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDefaultPaymentMethod(method.id)}
                              disabled={isProcessing}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaymentMethod(method.id)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">
                      No payment methods found.
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddPaymentMethod}
                    disabled={isProcessing}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog
        open={isAddingPaymentMethod && !!clientSecret}
        onOpenChange={setIsAddingPaymentMethod}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new credit or debit card to your account.
            </DialogDescription>
          </DialogHeader>

          {clientSecret && (
            <Suspense>
              <AddPaymentMethod
                clientSecret={clientSecret}
                onSuccess={handlePaymentMethodAdded}
                onCancel={() => setIsAddingPaymentMethod(false)}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Tokens Dialog */}
      <Dialog open={isAddingTokens} onOpenChange={setIsAddingTokens}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add More Tokens</DialogTitle>
            <DialogDescription>
              Add additional tokens to your current subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tokens" className="text-sm font-medium">
                Number of Tokens
              </label>
              <select
                id="tokens"
                className="w-full p-2 border rounded-md"
                value={additionalTokens}
                onChange={(e) => setAdditionalTokens(Number(e.target.value))}
              >
                <option value={100000}>100,000 tokens ($5)</option>
                <option value={500000}>500,000 tokens ($20)</option>
                <option value={1000000}>1,000,000 tokens ($35)</option>
              </select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Adding tokens will immediately charge your payment method on
                file.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTokens(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTokens} disabled={isChangingPlan}>
              Add Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Error boundary component
function ErrorFallback() {
  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mt-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                Unable to load billing information
              </h3>
              <p className="text-red-600 dark:text-red-400 mt-1">
                We're having trouble loading your billing information. Please try refreshing the page or contact support if the issue persists.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-2"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    </AppLayout>
  );
}

// Export the main page component with Suspense and error handling
export default function BillingPage() {
  const [hasError, setHasError] = useState(false);

  // Reset error state when component mounts (for when user navigates back to page)
  useEffect(() => {
    setHasError(false);
  }, []);

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={() => setHasError(true)}>
        <BillingPageContent />
      </ErrorBoundary>
    </Suspense>
  );
}
