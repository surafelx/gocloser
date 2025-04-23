"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    performanceReports: true,
    analysisCompleted: true,
    tipsRecommendations: true,
    browserNotifications: true,
    soundAlerts: false
  })

  const handleSaveNotifications = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      })
    }, 1000)
  }

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your notification preferences</p>
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="mb-6">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>



          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Performance Reports</p>
                        <p className="text-sm text-muted-foreground">Receive weekly performance reports</p>
                      </div>
                      <Switch
                        checked={notificationSettings.performanceReports}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({...notificationSettings, performanceReports: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Analysis Completed</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when your content analysis is complete
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.analysisCompleted}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({...notificationSettings, analysisCompleted: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Tips & Recommendations</p>
                        <p className="text-sm text-muted-foreground">
                          Receive sales tips and improvement recommendations
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.tipsRecommendations}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({...notificationSettings, tipsRecommendations: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Notifications</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Browser Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Show browser notifications when analysis is complete
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.browserNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({...notificationSettings, browserNotifications: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sound Alerts</p>
                        <p className="text-sm text-muted-foreground">Play sound when receiving new messages</p>
                      </div>
                      <Switch
                        checked={notificationSettings.soundAlerts}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({...notificationSettings, soundAlerts: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

