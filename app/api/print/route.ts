import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { getPrinterConfig } from "@/lib/ticket-printer"

const execPromise = promisify(exec)

// This function handles the print request
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { imageData, ticketInfo } = data

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Remove the data:image/png;base64, prefix
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "")

    // Create a temporary file path
    const tempDir = path.join(process.cwd(), "temp")

    // Ensure temp directory exists
    try {
      await fs.mkdir(tempDir, { recursive: true })
    } catch (error) {
      console.error("Error creating temp directory:", error)
    }

    const fileName = `ticket-${Date.now()}.png`
    const filePath = path.join(tempDir, fileName)

    // Write the image to a temporary file
    await fs.writeFile(filePath, base64Data, "base64")

    // Get printer configuration
    const printerConfig = getPrinterConfig()

    // Print the image using the system's default printer or a specified printer
    let printCommand

    if (process.platform === "win32") {
      // Windows printing - BOCA printers typically come with Windows drivers
      printCommand = `"${printerConfig.windowsPrintUtility}" -printer "${printerConfig.printerName}" -dpi ${printerConfig.dpi} -papersize "${printerConfig.width}x${printerConfig.height}" "${filePath}"`
    } else {
      // Linux/Mac printing using lp
      // BOCA printers on Linux/Mac typically work with CUPS
      printCommand = `lp -d "${printerConfig.printerName}" -o media="BOCA ${printerConfig.width}x${printerConfig.height}in" -o resolution=${printerConfig.dpi} "${filePath}"`
    }

    console.log("Executing print command:", printCommand)

    // Execute the print command
    const { stdout, stderr } = await execPromise(printCommand)

    if (stderr && !stderr.includes("requesting printer")) {
      console.error("Error printing:", stderr)
      return NextResponse.json({ error: "Print error", details: stderr }, { status: 500 })
    }

    // Clean up the temporary file
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error("Error deleting temporary file:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Print job sent to printer",
      output: stdout,
      ticketInfo: {
        name: ticketInfo.name,
        show: ticketInfo.show,
        dateTime: ticketInfo.dateTime,
        section: ticketInfo.section,
        row: ticketInfo.row,
        seat: ticketInfo.seat,
      },
    })
  } catch (error) {
    console.error("Error in print handler:", error)
    return NextResponse.json({ error: "Server error", details: error }, { status: 500 })
  }
}
