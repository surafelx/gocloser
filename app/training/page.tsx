'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshTrainingButton } from '@/components/training/refresh-training-button';
import { FileText, Upload } from 'lucide-react';
import Link from 'next/link';

export default function TrainingPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch training documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/training/documents');
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        } else {
          console.error('Failed to fetch training documents');
        }
      } catch (error) {
        console.error('Error fetching training documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Training Data Management</h1>
        <RefreshTrainingButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>PDF Documents</CardTitle>
            <CardDescription>
              Manage PDF documents used for training the AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Upload PDF files to the <code>training</code> folder and refresh the training data to make them available to the AI.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" asChild>
                <Link href="/training/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload PDFs</CardTitle>
            <CardDescription>
              Add new PDF documents to the training folder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Upload new PDF files to be processed and used as context for the AI.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" asChild>
                <Link href="/training/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Understanding how training data is used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The AI uses the content from your PDF files as context when generating responses. This helps it provide more relevant and accurate information based on your specific needs.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload PDFs to the training folder</li>
              <li>Click "Refresh Training Data" to process the PDFs</li>
              <li>The AI will now use this content as context</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="mb-4">
          <TabsTrigger value="documents">Processed Documents</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Processed Documents</CardTitle>
              <CardDescription>
                Documents that have been processed and are available to the AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-3">
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Category: {doc.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-3">
                        <p className="text-sm line-clamp-3">{doc.content?.substring(0, 150)}...</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No documents found. Upload PDFs and refresh the training data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Document Categories</CardTitle>
              <CardDescription>
                How documents are categorized for AI context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Objection Handling</h3>
                  <p className="text-sm text-muted-foreground">
                    Documents containing keywords like "objection", "concern", "hesitation", "pushback", etc.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Closing Techniques</h3>
                  <p className="text-sm text-muted-foreground">
                    Documents containing keywords like "closing", "close the sale", "commitment", "next steps", etc.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Discovery Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Documents containing keywords like "discovery", "question", "challenge", "pain point", etc.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Value Propositions</h3>
                  <p className="text-sm text-muted-foreground">
                    Documents containing keywords like "value", "benefit", "solution", "result", "outcome", etc.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Sales Scripts</h3>
                  <p className="text-sm text-muted-foreground">
                    Documents categorized as scripts or with "script" in the title.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
