"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FileText,
  BarChart,
  Clock,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Tag,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

interface TranscriptViewerProps {
  transcript: {
    id: string;
    title: string;
    text: string;
    formattedTranscript: string;
    analysis: {
      summary: string;
      keyPoints: string[];
      sentiment: string;
      topics: string[];
      actionItems: string[];
    };
    metadata: {
      speakers: number;
      words: number;
      paragraphs: number;
      channels: number;
    };
    fileUrl: string;
    duration: number;
    createdAt?: string;
  };
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState("analysis");

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-green-500";
      case "negative":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{transcript.title}</CardTitle>
            <CardDescription>
              {transcript.createdAt
                ? `Analyzed ${formatDistanceToNow(new Date(transcript.createdAt), { addSuffix: true })}`
                : "Recently analyzed"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(transcript.duration)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {transcript.metadata.speakers} speaker{transcript.metadata.speakers !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mx-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="raw">Raw Text</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="p-4">
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                Summary
              </h3>
              <p className="text-muted-foreground">{transcript.analysis.summary}</p>
            </div>

            <Separator />

            {/* Key Points */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Key Points
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {transcript.analysis.keyPoints.map((point, index) => (
                  <li key={index} className="text-muted-foreground">{point}</li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Sentiment and Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                  {transcript.analysis.sentiment.toLowerCase() === "positive" ? (
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                  ) : transcript.analysis.sentiment.toLowerCase() === "negative" ? (
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                  )}
                  Sentiment
                </h3>
                <Badge className={`${getSentimentColor(transcript.analysis.sentiment)} text-white`}>
                  {transcript.analysis.sentiment}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-blue-500" />
                  Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {transcript.analysis.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Items */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <CheckSquare className="h-5 w-5 text-indigo-500" />
                Action Items
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {transcript.analysis.actionItems.map((item, index) => (
                  <li key={index} className="text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Metadata */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <BarChart className="h-5 w-5 text-primary" />
                Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-lg font-medium">{formatDuration(transcript.duration)}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Speakers</p>
                  <p className="text-lg font-medium">{transcript.metadata.speakers}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Words</p>
                  <p className="text-lg font-medium">{transcript.metadata.words.toLocaleString()}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Paragraphs</p>
                  <p className="text-lg font-medium">{transcript.metadata.paragraphs}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Conversation Timeline
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Messages are displayed in chronological order with timestamps.
              </p>
            </div>
            <div className="transcript-content">
              <ReactMarkdown
                components={{
                  h2: ({ node, ...props }) => (
                    <h2 className="text-lg font-semibold mt-6 mb-2 text-primary" {...props} />
                  ),
                  p: ({ node, ...props }) => {
                    // Check if this is a timestamp paragraph (starts with [)
                    const content = props.children?.toString() || '';
                    if (content.startsWith('[') && content.includes(']')) {
                      const [timestamp, ...messageParts] = content.split(']');
                      const message = messageParts.join(']').trim();

                      return (
                        <div className="mb-4 border-l-4 pl-3 py-1 border-muted-foreground/30 hover:border-primary/50 transition-colors">
                          <span className="text-xs text-muted-foreground block mb-1">{timestamp}]</span>
                          <p className="text-sm" {...props}>{message}</p>
                        </div>
                      );
                    }
                    return <p className="mb-2" {...props} />;
                  }
                }}
              >
                {transcript.formattedTranscript}
              </ReactMarkdown>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="p-4">
          <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px]">
            <pre className="text-sm whitespace-pre-wrap">{transcript.text}</pre>
          </div>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={() => window.open(transcript.fileUrl, '_blank')}>
          Play Audio/Video
        </Button>
        <Button variant="outline" onClick={() => {
          const blob = new Blob([transcript.formattedTranscript], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${transcript.title.replace(/\s+/g, '_')}_transcript.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}>
          Download Transcript
        </Button>
      </CardFooter>
    </Card>
  );
}
