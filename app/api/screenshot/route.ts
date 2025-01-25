import puppeteer from "puppeteer"
import { NextResponse } from "next/server"
import { z } from "zod"

const screenshotSchema = z.object({
  url: z.string().url(),
  fullSize: z.boolean().default(false),
  useProxy: z.boolean().default(false),
  noAds: z.boolean().default(false),
  width: z.number().min(100).max(3840),
  height: z.number().min(100).max(2160),
  zoom: z.number().min(10).max(200),
  format: z.enum(["png", "jpeg", "pdf"]).default("png"),
  quality: z.number().min(0).max(100).default(80),
  delay: z.number().min(0).max(10000).default(0),
  css: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const validated = screenshotSchema.parse(data)

    const browser = await puppeteer.launch({
      headless: true,
    })

    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({
      width: validated.width,
      height: validated.height,
      deviceScaleFactor: validated.zoom / 100,
    })

    // Block ads if requested
    if (validated.noAds) {
      await page.setRequestInterception(true)
      page.on("request", (request) => {
        if (request.resourceType() === "advertisement" || request.resourceType() === "media") {
          request.abort()
        } else {
          request.continue()
        }
      })
    }

    // Navigate to URL
    await page.goto(validated.url, {
      waitUntil: "networkidle0",
    })

    // Inject custom CSS if provided
    if (validated.css) {
      await page.evaluate((css) => {
        const style = document.createElement("style")
        style.textContent = css
        document.head.appendChild(style)
      }, validated.css)
    }

    // Wait for specified delay
    if (validated.delay > 0) {
      await page.waitForTimeout(validated.delay)
    }

    // Take screenshot
    let screenshot
    if (validated.format === "pdf") {
      screenshot = await page.pdf({
        format: "A4",
        printBackground: true,
      })
    } else {
      screenshot = await page.screenshot({
        fullPage: validated.fullSize,
        type: validated.format,
        quality: validated.format === "jpeg" ? validated.quality : undefined,
      })
    }

    await browser.close()

    // Return screenshot as base64
    return NextResponse.json({
      success: true,
      screenshot: `data:${validated.format === "pdf" ? "application/pdf" : `image/${validated.format}`};base64,${screenshot.toString("base64")}`,
    })
  } catch (error) {
    console.error("Screenshot error:", error)
    return NextResponse.json({ success: false, error: "Failed to capture screenshot" }, { status: 500 })
  }
}

