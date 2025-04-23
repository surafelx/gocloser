'use client';

import { MongoDBStatus } from '@/components/mongodb-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function MongoDBPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">MongoDB Connection</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <MongoDBStatus />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MongoDB Setup Guide</CardTitle>
              <CardDescription>
                Learn how to set up MongoDB for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you're experiencing connection issues with MongoDB, please check the setup guide for detailed instructions on how to:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Create a free MongoDB Atlas account</li>
                <li>Set up a cluster and database</li>
                <li>Configure network access</li>
                <li>Get your connection string</li>
                <li>Add the connection string to your .env.local file</li>
              </ul>
              <Button variant="outline" asChild className="w-full">
                <Link href="/MONGODB_SETUP.md" target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  View Setup Guide
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Troubleshooting</CardTitle>
              <CardDescription>
                Common issues and solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Connection String Format</h3>
                  <p className="text-sm text-muted-foreground">
                    Make sure your connection string is correctly formatted and includes your username, password, and database name.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Network Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure your IP address is allowed in the MongoDB Atlas Network Access settings.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Environment Variables</h3>
                  <p className="text-sm text-muted-foreground">
                    Check that your .env.local file contains the MONGODB_URI variable with the correct connection string.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Restart the Application</h3>
                  <p className="text-sm text-muted-foreground">
                    Try stopping and restarting the application to reload the environment variables.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
