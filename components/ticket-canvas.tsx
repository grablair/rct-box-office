"use client"

import type React from "react"
import { forwardRef, useEffect, useRef, useState } from "react"
import type { TicketData } from "@/lib/sheets-service"
import { loadCustomFonts, getShowAbbreviation } from "@/lib/font-loader"
import { generateQRCode } from "@/lib/qr-code"

interface TicketCanvasProps {
  ticket: TicketData
}

export const TicketCanvas = forwardRef<HTMLCanvasElement, TicketCanvasProps>(function TicketCanvas({ ticket }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const actualRef = (ref as React.RefObject<HTMLCanvasElement>) || canvasRef
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  // Load custom fonts when component mounts
  useEffect(() => {
    const loadFonts = async () => {
      const loaded = await loadCustomFonts()
      setFontsLoaded(loaded)
    }

    loadFonts()
  }, [])

  // Generate QR code for the ticket
  useEffect(() => {
    const generateQR = async () => {
      if (isGeneratingQR) return

      try {
        setIsGeneratingQR(true)
        // Create a unique attendee code based on ticket details
        const attendeeCode = `${ticket.name}-${ticket.show}-${ticket.dateTime}-${ticket.section}-${ticket.row}-${ticket.seat}`

        const qrDataUrl = await generateQRCode({
          data: attendeeCode,
          width: 477,
          height: 477,
          dotsOptions: {
            color: "#000000",
            type: "rounded",
          },
          cornersSquareOptions: {
            color: "#000000",
            type: "extra-rounded",
          },
        })

        setQrCodeDataUrl(qrDataUrl)
      } catch (error) {
        console.error("Failed to generate QR code:", error)
      } finally {
        setIsGeneratingQR(false)
      }
    }

    generateQR()
  }, [ticket, isGeneratingQR])

  // Render ticket when fonts are loaded, QR code is ready, or ticket changes
  useEffect(() => {
    if (!fontsLoaded || !qrCodeDataUrl) return

    const canvas = actualRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions - adjust as needed for the template
    canvas.width = 1650 // Increased canvas size to accommodate QR code
    canvas.height = 600 // Increased height based on coordinates

    // Load template image
    const templateImage = new Image()
    templateImage.crossOrigin = "anonymous"
    templateImage.src = "/rct-ticket-template.png"

    templateImage.onload = () => {
      // Clear canvas
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw template image as background
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height)

      // Load show title image
      const showAbbrev = getShowAbbreviation(ticket.show)
      const titleImage = new Image()
      titleImage.crossOrigin = "anonymous"
      titleImage.src = `/title-images/${showAbbrev}.png`

      titleImage.onload = () => {
        // Draw title image at specified coordinates (59, 45)
        ctx.drawImage(titleImage, 59, 45)

        // Calculate position for date (50px below the bottom of the title image)
        const dateY = 45 + titleImage.height + 50

        // Draw date with specified styling
        ctx.fillStyle = "#000000"
        ctx.font = "500 32px HankenGrotesk"
        ctx.textAlign = "left"

        // Handle text wrapping if needed
        const dateText = ticket.dateTime
        const maxWidth = 700
        let fontSize = 32
        let textWidth = ctx.measureText(dateText).width

        // Reduce font size if text is too wide
        while (textWidth > maxWidth && fontSize > 12) {
          fontSize -= 2
          ctx.font = `500 ${fontSize}px HankenGrotesk`
          textWidth = ctx.measureText(dateText).width
        }

        ctx.fillText(dateText, 59, dateY, maxWidth)

        // Draw attendee name
        ctx.fillStyle = "#FFFFFF" // White text
        ctx.font = "600 42px HankenGrotesk"
        ctx.textAlign = "center"

        // Handle text wrapping for name
        const nameText = ticket.name
        const nameMaxWidth = 570
        let nameFontSize = 42
        let nameTextWidth = ctx.measureText(nameText).width

        // Reduce font size if name is too wide
        while (nameTextWidth > nameMaxWidth && nameFontSize > 16) {
          nameFontSize -= 2
          ctx.font = `600 ${nameFontSize}px HankenGrotesk`
          nameTextWidth = ctx.measureText(nameText).width
        }

        ctx.fillText(nameText, 372, 307, nameMaxWidth)

        // Draw section
        ctx.fillStyle = "#000000" // Black text
        ctx.font = "500 70px HankenGrotesk"
        ctx.textAlign = "center"
        ctx.fillText(ticket.section, 187, 490)

        // Draw row
        ctx.fillText(ticket.row, 402, 490)

        // Draw seat
        ctx.fillText(ticket.seat, 589, 490)

        // Special note for subscribers with GA section
        if (ticket.isSubscriber && ticket.section === "GA") {
          ctx.fillStyle = "#000000"
          ctx.font = "500 25px HankenGrotesk"
          ctx.textAlign = "left"
          ctx.fillText("See board member for seat preference selection", 59, 562)
        }

        // Draw white circle for non-subscribers
        if (!ticket.isSubscriber) {
          ctx.beginPath()
          ctx.arc(663, 267, 10, 0, 2 * Math.PI) // Center at (663, 267) with radius 10
          ctx.fillStyle = "#FFFFFF"
          ctx.fill()
          ctx.strokeStyle = "#000000"
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Draw QR code
        const qrImage = new Image()
        qrImage.crossOrigin = "anonymous"
        qrImage.src = qrCodeDataUrl

        qrImage.onload = () => {
          ctx.drawImage(qrImage, 811, 60, 477, 477)
        }
      }

      titleImage.onerror = () => {
        // Fallback if title image fails to load
        console.warn(`Title image for ${showAbbrev} not found, using text fallback`)
        ctx.fillStyle = "#000000"
        ctx.font = "bold 28px HankenGrotesk"
        ctx.textAlign = "left"
        ctx.fillText(ticket.show, 59, 80)

        // Continue with other ticket information
        renderTicketDetailsWithoutTitle(ctx, ticket)
      }
    }

    templateImage.onerror = () => {
      console.error("Failed to load ticket template image")
      // Fallback to basic rendering if template fails to load
      renderBasicTicket(ctx, ticket)
    }
  }, [ticket, actualRef, fontsLoaded, qrCodeDataUrl])

  // Function to render ticket details when title image fails to load
  const renderTicketDetailsWithoutTitle = (ctx: CanvasRenderingContext2D, ticket: TicketData) => {
    // Draw date
    ctx.fillStyle = "#000000"
    ctx.font = "500 32px HankenGrotesk"
    ctx.textAlign = "left"
    ctx.fillText(ticket.dateTime, 59, 130, 700)

    // Draw attendee name
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "600 42px HankenGrotesk"
    ctx.textAlign = "center"
    ctx.fillText(ticket.name, 372, 265, 570)

    // Draw section, row, seat
    ctx.fillStyle = "#000000"
    ctx.font = "500 70px HankenGrotesk"
    ctx.textAlign = "center"
    ctx.fillText(ticket.section, 187, 420)
    ctx.fillText(ticket.row, 402, 420)
    ctx.fillText(ticket.seat, 589, 420)

    // Special note for subscribers with GA section
    if (ticket.isSubscriber && ticket.section === "GA") {
      ctx.fillStyle = "#000000"
      ctx.font = "500 25px HankenGrotesk"
      ctx.textAlign = "left"
      ctx.fillText("See board member for seat preference selection", 59, 537)
    }

    // Draw white circle for non-subscribers
    if (!ticket.isSubscriber) {
      ctx.beginPath()
      ctx.arc(663, 267, 10, 0, 2 * Math.PI)
      ctx.fillStyle = "#FFFFFF"
      ctx.fill()
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw QR code if available
    if (qrCodeDataUrl) {
      const qrImage = new Image()
      qrImage.crossOrigin = "anonymous"
      qrImage.src = qrCodeDataUrl

      qrImage.onload = () => {
        ctx.drawImage(qrImage, 811, 60, 477, 477)
      }
    }
  }

  // Fallback rendering if template fails to load
  const renderBasicTicket = (ctx: CanvasRenderingContext2D, ticket: TicketData) => {
    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw border
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, ctx.canvas.width - 20, ctx.canvas.height - 20)

    // Draw show name
    ctx.fillStyle = "#000000"
    ctx.font = "bold 28px HankenGrotesk"
    ctx.textAlign = "center"
    ctx.fillText(ticket.show, ctx.canvas.width / 2, 80)

    // Draw date
    ctx.font = "500 32px HankenGrotesk"
    ctx.fillText(ticket.dateTime, ctx.canvas.width / 2, 130)

    // Draw attendee name
    ctx.font = "600 42px HankenGrotesk"
    ctx.fillText(ticket.name, ctx.canvas.width / 2, 200)

    // Draw section, row, seat
    ctx.font = "500 70px HankenGrotesk"
    ctx.fillText(`Section: ${ticket.section}`, ctx.canvas.width / 2, 300)
    ctx.fillText(`Row: ${ticket.row}`, ctx.canvas.width / 2, 380)
    ctx.fillText(`Seat: ${ticket.seat}`, ctx.canvas.width / 2, 460)

    // Draw subscriber status
    if (ticket.isSubscriber) {
      ctx.fillStyle = "#1d4ed8"
      ctx.font = "700 25px HankenGrotesk"
      ctx.fillText("SUBSCRIBER", ctx.canvas.width / 2, 520)

      if (ticket.section === "GA") {
        ctx.fillStyle = "#000000"
        ctx.font = "500 25px HankenGrotesk"
        ctx.fillText("See board member for seat preference selection", ctx.canvas.width / 2, 550)
      }
    }

    // Draw QR code if available
    if (qrCodeDataUrl) {
      const qrImage = new Image()
      qrImage.crossOrigin = "anonymous"
      qrImage.src = qrCodeDataUrl

      qrImage.onload = () => {
        ctx.drawImage(qrImage, ctx.canvas.width - 500, 60, 477, 477)
      }
    }
  }

  return <canvas ref={actualRef} style={{ maxWidth: "100%", height: "auto" }} />
})
