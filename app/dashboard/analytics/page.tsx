import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart, LineChart } from "@/components/charts"
import { FileText, Mic, Video } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track your sales performance metrics and improvement over time</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills Breakdown</TabsTrigger>
            <TabsTrigger value="content">Content Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Your overall performance score over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart
                    data={[
                      { name: "Jan", value: 65 },
                      { name: "Feb", value: 68 },
                      { name: "Mar", value: 72 },
                      { name: "Apr", value: 70 },
                      { name: "May", value: 74 },
                      { name: "Jun", value: 78 },
                    ]}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Skills Comparison</CardTitle>
                  <CardDescription>Your performance across different sales skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={[
                      { name: "Engagement", value: 78 },
                      { name: "Objections", value: 65 },
                      { name: "Closing", value: 82 },
                      { name: "Knowledge", value: 90 },
                      { name: "Discovery", value: 75 },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Content Performance</CardTitle>
                <CardDescription>Performance scores for your recently analyzed content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Mic className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Sales Call - Enterprise Client</p>
                        <p className="text-sm text-muted-foreground">Analyzed 2 days ago</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium">82/100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm">Strengths:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Product knowledge</li>
                            <li>Building rapport</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm">Areas to Improve:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Handling price objections</li>
                            <li>Closing techniques</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Product Demo - New Feature</p>
                        <p className="text-sm text-muted-foreground">Analyzed 5 days ago</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium">76/100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm">Strengths:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Feature explanation</li>
                            <li>Use case examples</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm">Areas to Improve:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Technical clarity</li>
                            <li>Addressing customer needs</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Follow-up Email Template</p>
                        <p className="text-sm text-muted-foreground">Analyzed 1 week ago</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-medium">91/100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm">Strengths:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Clear call-to-action</li>
                            <li>Personalization</li>
                            <li>Concise messaging</li>
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm">Areas to Improve:</span>
                          <ul className="text-sm text-muted-foreground ml-5 list-disc">
                            <li>Value proposition</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement</CardTitle>
                  <CardDescription>How well you engage with prospects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">78/100</div>
                  <p className="text-sm text-muted-foreground mb-4">+12% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Strong at asking open-ended questions</li>
                      <li>Good rapport building</li>
                      <li>Could improve active listening</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Objection Handling</CardTitle>
                  <CardDescription>How well you address customer concerns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">65/100</div>
                  <p className="text-sm text-muted-foreground mb-4">+8% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Need to acknowledge concerns better</li>
                      <li>Improve value-based responses</li>
                      <li>Practice handling price objections</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Closing Techniques</CardTitle>
                  <CardDescription>How effectively you close deals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">82/100</div>
                  <p className="text-sm text-muted-foreground mb-4">+15% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Strong at creating urgency</li>
                      <li>Good at summarizing value</li>
                      <li>Could improve asking for the sale directly</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Knowledge</CardTitle>
                  <CardDescription>Your understanding of product features and benefits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">90/100</div>
                  <p className="text-sm text-muted-foreground mb-4">+5% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Excellent feature knowledge</li>
                      <li>Strong at explaining technical details</li>
                      <li>Could improve connecting features to benefits</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Discovery Skills</CardTitle>
                  <CardDescription>How well you uncover customer needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">75/100</div>
                  <p className="text-sm text-muted-foreground mb-4">+10% from last month</p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Insights:</h4>
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      <li>Good at identifying pain points</li>
                      <li>Need to ask more follow-up questions</li>
                      <li>Could improve needs qualification</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Type Analysis</CardTitle>
                <CardDescription>Performance comparison across different content types</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[
                    { name: "Sales Calls", value: 76 },
                    { name: "Product Demos", value: 82 },
                    { name: "Email Templates", value: 91 },
                    { name: "Presentations", value: 85 },
                    { name: "Proposals", value: 79 },
                  ]}
                />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Audio Content</CardTitle>
                  <CardDescription>Analysis of your sales calls and audio recordings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Tone of Voice</span>
                        <span className="text-sm font-medium">82/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Pacing</span>
                        <span className="text-sm font-medium">75/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Clarity</span>
                        <span className="text-sm font-medium">80/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Filler Words</span>
                        <span className="text-sm font-medium">68/100</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Top Improvement Areas:</h4>
                      <ul className="text-sm text-muted-foreground ml-5 list-disc">
                        <li>Reduce filler words (um, uh)</li>
                        <li>Improve pacing - slow down key points</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Video Content</CardTitle>
                  <CardDescription>Analysis of your video presentations and demos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Visual Aids</span>
                        <span className="text-sm font-medium">85/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Body Language</span>
                        <span className="text-sm font-medium">78/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Presentation Flow</span>
                        <span className="text-sm font-medium">82/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Engagement</span>
                        <span className="text-sm font-medium">80/100</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Top Improvement Areas:</h4>
                      <ul className="text-sm text-muted-foreground ml-5 list-disc">
                        <li>Improve eye contact with camera</li>
                        <li>Use more hand gestures for emphasis</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Content</CardTitle>
                  <CardDescription>Analysis of your written sales materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Clarity</span>
                        <span className="text-sm font-medium">92/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Persuasiveness</span>
                        <span className="text-sm font-medium">88/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Call to Action</span>
                        <span className="text-sm font-medium">95/100</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Personalization</span>
                        <span className="text-sm font-medium">90/100</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Top Improvement Areas:</h4>
                      <ul className="text-sm text-muted-foreground ml-5 list-disc">
                        <li>Strengthen value propositions</li>
                        <li>Add more social proof elements</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

