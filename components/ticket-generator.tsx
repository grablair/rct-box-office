"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, Download } from "lucide-react"
import type { TicketData } from "@/lib/sheets-service"
import { TicketCanvas } from "@/components/ticket-canvas"
import { loadCustomFonts, getShowAbbreviation } from "@/lib/font-loader"
import { generateQRCode } from "@/lib/qr-code"

interface TicketGeneratorProps {
  tickets: TicketData[]
}

export function TicketGenerator({ tickets }: TicketGeneratorProps) {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handlePrint = async () => {
    // Ensure fonts are loaded before printing
    await loadCustomFonts()

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Create HTML for print window
    let ticketsHtml = ""

    // Add font styles to print window
    const fontStyles = `
      @font-face {
        font-family: 'HankenGrotesk';
        src: url('/fonts/adjusted-350.ttf');
        font-weight: 350;
      }
      @font-face {
        font-family: 'HankenGrotesk';
        src: url('/fonts/adjusted-400.ttf');
        font-weight: 400;
      }
      @font-face {
        font-family: 'HankenGrotesk';
        src: url('/fonts/adjusted-500.ttf');
        font-weight: 500;
      }
      @font-face {
        font-family: 'HankenGrotesk';
        src: url('/fonts/adjusted-550.ttf');
        font-weight: 550;
      }
      @font-face {
        font-family: 'HankenGrotesk';
        src: url('/fonts/adjusted-600.ttf');
        font-weight: 600;
      }
      @font-face {
        font-family: 'HankenGrotesk';
        src: url('/fonts/adjusted-700.ttf');
        font-weight: 700;
      }
    `

    // Generate ticket images
    for (const ticket of tickets) {
      // Create a temporary canvas for this ticket
      const canvas = document.createElement("canvas")
      canvas.width = 1650
      canvas.height = 600
      const ctx = canvas.getContext("2d")

      if (!ctx) continue

      try {
        // Draw template image
        const templateImage = new Image()
        templateImage.crossOrigin = "anonymous"
        templateImage.src = "/rct-ticket-template.png"

        // Wait for template to load
        await new Promise<void>((resolve, reject) => {
          templateImage.onload = () => {
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height)
            resolve()
          }
          templateImage.onerror = () => {
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = "#333333"
            ctx.lineWidth = 2
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
            resolve()
          }
          setTimeout(() => reject(new Error("Template image load timeout")), 3000)
        })

        // Try to load show title image
        const showAbbrev = getShowAbbreviation(ticket.show)
        const titleImage = new Image()
        titleImage.crossOrigin = "anonymous"
        titleImage.src = `/title-images/${showAbbrev}.png`

        let titleHeight = 60
        try {
          titleHeight = await new Promise<void>((resolve, reject) => {
            titleImage.onload = () => {
              ctx.drawImage(titleImage, 59, 45)
              resolve(titleImage.height)
            }
            titleImage.onerror = () => {
              // Fallback to text
              ctx.fillStyle = "#000000"
              ctx.font = "bold 60px HankenGrotesk"
              ctx.textAlign = "left"
              ctx.fillText(ticket.show, 59, 80)
              resolve(28)
            }
            setTimeout(() => reject(new Error("Title image load timeout")), 3000)
          })
        } catch (error) {
          console.warn(`Failed to load title image for ${ticket.show}:`, error)
          // Fallback to text
          ctx.fillStyle = "#000000"
          ctx.font = "bold 60px HankenGrotesk"
          ctx.textAlign = "left"
          ctx.fillText(ticket.show, 59, 80)
        }

        // Calculate position for date (50px below the bottom of the title image)
        // Since we don't know the exact height of the title image in this context,
        // we'll use an estimated position
        const dateY = 45 + titleHeight + 50 // Estimated title height of 100px + 50px spacing

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

        // Generate and draw QR code
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

        const qrImage = new Image()
        qrImage.crossOrigin = "anonymous"
        qrImage.src = qrDataUrl

        await new Promise<void>((resolve) => {
          qrImage.onload = () => {
            ctx.drawImage(qrImage, 811, 60, 477, 477)
            resolve()
          }
          qrImage.onerror = () => {
            console.error("Failed to load QR code")
            resolve()
          }
          setTimeout(resolve, 1000) // Timeout fallback
        })

        // Add ticket to HTML
        ticketsHtml += `<div style="page-break-after: always; margin-bottom: 20px;">
          <img src="${canvas.toDataURL("image/png")}" style="width: 100%; max-width: 1350px;" />
        </div>`
      } catch (error) {
        console.error(`Failed to generate ticket for ${ticket.name}:`, error)
        // Add error message to HTML
        ticketsHtml += `<div style="page-break-after: always; margin-bottom: 20px;">
          <p>Failed to generate ticket for ${ticket.name}</p>
        </div>`
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Theater Tickets</title>
          <style>
            ${fontStyles}
            body { font-family: HankenGrotesk, system-ui, sans-serif; margin: 0; padding: 20px; }
            @media print {
              @page { size: auto; margin: 0mm; }
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${ticketsHtml}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = `ticket-${tickets[currentTicketIndex].name.replace(/\s+/g, "-")}.png`
    link.href = canvasRef.current.toDataURL("image/png")
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tickets selected. Please select tickets from the Ticket List tab.</p>
          </div>
        ) : (
          <>
            <Tabs defaultValue="preview">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Print</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <div className="flex flex-col items-center">
                  <div className="mb-4 border rounded-md p-4 w-full overflow-auto">
                    <TicketCanvas ticket={tickets[currentTicketIndex]} ref={canvasRef} />
                  </div>

                  <div className="flex justify-between w-full mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentTicketIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1))}
                      disabled={tickets.length <= 1}
                    >
                      Previous
                    </Button>
                    <span className="py-2">
                      {currentTicketIndex + 1} of {tickets.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentTicketIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0))}
                      disabled={tickets.length <= 1}
                    >
                      Next
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" /> Print Current
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bulk">
                <div className="text-center py-6">
                  <p className="mb-6">Ready to print all {tickets.length} selected tickets</p>
                  <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print All Tickets
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}
