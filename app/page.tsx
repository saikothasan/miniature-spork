"use client"

import { useState, useEffect } from "react"
import { Camera, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useTheme } from "next-themes"

interface ScreenshotOptions {
  url: string
  fullSize: boolean
  useProxy: boolean
  noAds: boolean
  width: number
  height: number
  zoom: number
  format: "png" | "jpeg" | "pdf"
  quality: number
  delay: number
  css: string
}

interface HistoryItem {
  id: string
  url: string
  timestamp: number
  screenshot: string
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const { theme, setTheme } = useTheme()
  const [options, setOptions] = useState<ScreenshotOptions>({
    url: "",
    fullSize: false,
    useProxy: false,
    noAds: false,
    width: 1280,
    height: 720,
    zoom: 100,
    format: "png",
    quality: 80,
    delay: 0,
    css: "",
  })

  useEffect(() => {
    const savedHistory = localStorage.getItem("screenshotHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const handleResolutionChange = (value: string) => {
    const [width, height] = value.split("x").map(Number)
    setOptions((prev) => ({ ...prev, width, height }))
  }

  const handleScreenshot = async () => {
    try {
      setIsLoading(true)

      if (!options.url) {
        toast.error("Please enter a URL")
        return
      }

      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setScreenshot(data.screenshot)

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        url: options.url,
        timestamp: Date.now(),
        screenshot: data.screenshot,
      }

      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)]
      setHistory(updatedHistory)
      localStorage.setItem("screenshotHistory", JSON.stringify(updatedHistory))

      toast.success("Screenshot captured successfully!")
    } catch (error) {
      toast.error("Failed to capture screenshot")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    if (screenshot) {
      navigator.clipboard
        .writeText(screenshot)
        .then(() => toast.success("Screenshot URL copied to clipboard"))
        .catch(() => toast.error("Failed to copy screenshot URL"))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Camera className="h-6 w-6" />
            <span className="font-bold">Screenshot Tool</span>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost">Documentation</Button>
            <Button variant="ghost">Pricing</Button>
            <Button>Sign In</Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8 flex items-center space-x-2">
          <Input
            type="url"
            placeholder="https://www.wikipedia.org..."
            className="max-w-2xl"
            value={options.url}
            onChange={(e) => setOptions((prev) => ({ ...prev, url: e.target.value }))}
          />
          <Button onClick={handleScreenshot} disabled={isLoading}>
            <Camera className="mr-2 h-4 w-4" />
            {isLoading ? "Capturing..." : "Take Screenshot"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Browser Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="full-size">Full Size</Label>
                  <Switch
                    id="full-size"
                    checked={options.fullSize}
                    onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, fullSize: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="us-proxy">US Proxy</Label>
                  <Switch
                    id="us-proxy"
                    checked={options.useProxy}
                    onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, useProxy: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="no-ads">No Ads / No Cookie</Label>
                  <Switch
                    id="no-ads"
                    checked={options.noAds}
                    onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, noAds: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={`${options.width}x${options.height}`} onValueChange={handleResolutionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1280x720">1280×720</SelectItem>
                      <SelectItem value="1920x1080">1920×1080</SelectItem>
                      <SelectItem value="2560x1440">2560×1440</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Width</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[options.width]}
                      max={3840}
                      step={1}
                      onValueChange={([value]) => setOptions((prev) => ({ ...prev, width: value }))}
                    />
                    <Input
                      type="number"
                      className="w-20"
                      value={options.width}
                      onChange={(e) => setOptions((prev) => ({ ...prev, width: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Height</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[options.height]}
                      max={2160}
                      step={1}
                      onValueChange={([value]) => setOptions((prev) => ({ ...prev, height: value }))}
                    />
                    <Input
                      type="number"
                      className="w-20"
                      value={options.height}
                      onChange={(e) => setOptions((prev) => ({ ...prev, height: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Zoom</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[options.zoom]}
                      max={200}
                      step={1}
                      onValueChange={([value]) => setOptions((prev) => ({ ...prev, zoom: value }))}
                    />
                    <Input
                      type="number"
                      className="w-20"
                      value={options.zoom}
                      onChange={(e) => setOptions((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={options.format}
                    onValueChange={(value: "png" | "jpeg" | "pdf") =>
                      setOptions((prev) => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {options.format === "jpeg" && (
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[options.quality]}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setOptions((prev) => ({ ...prev, quality: value }))}
                      />
                      <Input
                        type="number"
                        className="w-20"
                        value={options.quality}
                        onChange={(e) => setOptions((prev) => ({ ...prev, quality: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Delay (ms)</Label>
                  <Input
                    type="number"
                    value={options.delay}
                    onChange={(e) => setOptions((prev) => ({ ...prev, delay: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custom CSS</Label>
                  <Textarea
                    value={options.css}
                    onChange={(e) => setOptions((prev) => ({ ...prev, css: e.target.value }))}
                    placeholder="Enter custom CSS here"
                    className="h-24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Website Screenshot API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Capture a website screenshot online</h3>
                  <p className="text-muted-foreground">Generate a full web-page screenshot with our service</p>
                  <p className="text-sm text-muted-foreground">
                    Our web page screenshot service provides a rich interface to make any kind of web screenshots online
                    for free with no limits. In addition it provides powerful API to automate website screenshot
                    generation.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The simplest way to take a full page screenshot, we support long pages up to 20000 pixels.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Feel free to share generated web screenshot, all captured screenshots have unique address.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">API call example:</p>
                  <code className="block rounded bg-muted p-2 text-sm">
                    https://api.screenshot-tool.com/?url=www.example.com&key=YOUR_API_KEY
                  </code>
                </div>
              </CardContent>
            </Card>

            {screenshot && (
              <Card>
                <CardHeader>
                  <CardTitle>Screenshot Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {options.format === "pdf" ? (
                    <embed src={screenshot} type="application/pdf" width="100%" height="600px" />
                  ) : (
                    <img
                      src={screenshot || "/placeholder.svg"}
                      alt="Website Screenshot"
                      className="w-full rounded-lg border"
                    />
                  )}
                  <div className="mt-4 flex space-x-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        const link = document.createElement("a")
                        link.href = screenshot
                        link.download = `screenshot.${options.format}`
                        link.click()
                      }}
                    >
                      Download Screenshot
                    </Button>
                    <Button className="flex-1" onClick={handleShare}>
                      Share Screenshot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Screenshot History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {history.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-lg border bg-background">
                      <img
                        src={item.screenshot || "/placeholder.svg"}
                        alt={`Screenshot of ${item.url}`}
                        className="aspect-video w-full object-cover"
                      />
                      <div className="p-2">
                        <p className="truncate text-sm">{item.url}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

