"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Mic, Plus, Search, Video } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TrainingItem {
  id: string
  title: string
  type: "audio" | "video" | "text"
  category: string
  date: string
}

export default function TrainingDataPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemCategory, setNewItemCategory] = useState("")
  const [newItemContent, setNewItemContent] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const trainingData: TrainingItem[] = [
    { id: "1", title: "Handling Price Objections", type: "audio", category: "Objection Handling", date: "2023-12-15" },
    { id: "2", title: "Product Demo Script", type: "text", category: "Presentations", date: "2023-11-20" },
    { id: "3", title: "Closing Techniques", type: "video", category: "Closing", date: "2023-10-05" },
    { id: "4", title: "Discovery Call Questions", type: "text", category: "Discovery", date: "2023-09-12" },
    { id: "5", title: "Value Proposition Examples", type: "text", category: "Messaging", date: "2023-08-30" },
    {
      id: "6",
      title: "Handling Competitor Comparisons",
      type: "audio",
      category: "Objection Handling",
      date: "2023-07-22",
    },
    { id: "7", title: "Follow-up Email Templates", type: "text", category: "Follow-up", date: "2023-06-15" },
    { id: "8", title: "Sales Call Opening Script", type: "text", category: "Call Scripts", date: "2023-05-10" },
  ]

  const filteredData = trainingData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddItem = () => {
    // This would add the new item to the training data
    console.log("Adding new item:", { title: newItemTitle, category: newItemCategory, content: newItemContent })
    setNewItemTitle("")
    setNewItemCategory("")
    setNewItemContent("")
    setDialogOpen(false)
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "audio":
        return <Mic className="h-5 w-5 text-muted-foreground" />
      case "video":
        return <Video className="h-5 w-5 text-muted-foreground" />
      case "text":
        return <FileText className="h-5 w-5 text-muted-foreground" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Data</h1>
            <p className="text-muted-foreground">Manage your sales training materials and examples</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Training Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Training Material</DialogTitle>
                <DialogDescription>
                  Add new training content to improve the AI's sales analysis capabilities
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="E.g., Objection Handling Examples"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="E.g., Objection Handling"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your training content here..."
                    className="min-h-[150px]"
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>Add Material</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search training materials..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="objections">Objection Handling</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="presentations">Presentations</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {getIconForType(item.type)}
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    <CardDescription>{item.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Added: {new Date(item.date).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="objections" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData
                .filter((item) => item.category === "Objection Handling")
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getIconForType(item.type)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Added: {new Date(item.date).toLocaleDateString()}
                        </span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData
                .filter((item) => item.category === "Call Scripts" || item.category === "Follow-up")
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getIconForType(item.type)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Added: {new Date(item.date).toLocaleDateString()}
                        </span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="presentations" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData
                .filter((item) => item.category === "Presentations")
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getIconForType(item.type)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Added: {new Date(item.date).toLocaleDateString()}
                        </span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

