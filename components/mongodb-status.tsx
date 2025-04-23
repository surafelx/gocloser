'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MongoDBStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking MongoDB connection...');
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      setStatus('loading');
      setMessage('Checking MongoDB connection...');

      const response = await fetch('/api/mongodb/status');
      const data = await response.json();

      if (response.ok && data.connected) {
        setStatus('connected');
        setMessage(data.message || 'Successfully connected to MongoDB');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to connect to MongoDB');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while checking the MongoDB connection');
      console.error('MongoDB connection check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
          {status === 'loading' && <RefreshCw className="h-5 w-5 animate-spin" />}
          MongoDB Status
        </CardTitle>
        <CardDescription>
          Check the connection to your MongoDB database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'connected' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Connected</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {status === 'loading' && (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">{message}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={checkConnection} 
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
