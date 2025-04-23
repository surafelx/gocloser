'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugEnv() {
  const [showEnv, setShowEnv] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  useEffect(() => {
    // Only access environment variables on the client side
    setGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null);
  }, []);

  return (
    <div className="mt-4">
      <Button variant="outline" onClick={() => setShowEnv(!showEnv)}>
        {showEnv ? 'Hide Debug Info' : 'Show Debug Info'}
      </Button>
      
      {showEnv && (
        <Card className="mt-2">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</strong>{' '}
                {googleClientId ? 
                  `${googleClientId.substring(0, 10)}...${googleClientId.substring(googleClientId.length - 5)}` : 
                  'Not set'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
