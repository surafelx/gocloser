import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowUpRight, BarChart3, FileText, Mic, Upload, Video } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const recentUploads = [
    { id: 1, name: "Sales Call - Enterprise Client", type: "audio", date: "2 hours ago", score: 82 },
    { id: 2, name: "Product Demo - New Feature", type: "video", date: "Yesterday", score: 76 },
    { id: 3, name: "Follow-up Email Template", type: "text", date: "3 days ago", score: 91 },
  ]

  const performanceMetrics = [
    { name: "Engagement", score: 78, improvement: 12 },
    { name: "Objection Handling", score: 65, improvement: 8 },
    { name: "Closing Techniques", score: 82, improvement: 15 },
    { name: "Product Knowledge", score: 90, improvement: 5 },
  ]

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your sales performance.</p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="gap-2">
              <Upload className="h-4 w-4" /> Upload New Content
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78/100</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
              <Progress value={78} className="h-2 mt-3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Analyzed Content</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">8 new in the last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Practice Sessions</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">4 hours total practice time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Top Skill</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Product Knowledge</div>
              <p className="text-xs text-muted-foreground">90/100 score</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>Your recently analyzed sales content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {upload.type === "audio" && <Mic className="h-5 w-5 text-muted-foreground" />}
                      {upload.type === "video" && <Video className="h-5 w-5 text-muted-foreground" />}
                      {upload.type === "text" && <FileText className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium">{upload.name}</p>
                        <p className="text-sm text-muted-foreground">{upload.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">Score: {upload.score}/100</div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboard/analytics">
                  <Button variant="outline" className="w-full">
                    View All Content
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Your sales skills breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{metric.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{metric.score}/100</span>
                        <span className="text-xs text-green-500">+{metric.improvement}%</span>
                      </div>
                    </div>
                    <Progress value={metric.score} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboard/analytics">
                  <Button variant="outline" className="w-full">
                    View Detailed Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle>Suggested Actions</CardTitle>
              <CardDescription>Recommendations to improve your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-3">
                  <h3 className="font-semibold mb-1">Practice Objection Handling</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your objection handling score is lower than other metrics. Practice with our AI assistant.
                  </p>
                  <Link href="/dashboard/chat">
                    <Button variant="secondary" size="sm" className="w-full">
                      Start Practice Session
                    </Button>
                  </Link>
                </div>
                <div className="rounded-lg border p-3">
                  <h3 className="font-semibold mb-1">Upload More Closing Calls</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    We need more data on your closing techniques to provide better feedback.
                  </p>
                  <Link href="/dashboard/upload">
                    <Button variant="secondary" size="sm" className="w-full">
                      Upload Sales Call
                    </Button>
                  </Link>
                </div>
                <div className="rounded-lg border p-3">
                  <h3 className="font-semibold mb-1">Review Training Materials</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enhance your product knowledge by reviewing the latest training materials.
                  </p>
                  <Link href="/dashboard/training-data">
                    <Button variant="secondary" size="sm" className="w-full">
                      View Training Materials
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

