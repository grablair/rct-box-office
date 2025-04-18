import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { readSheet } from '@/lib/google-sheets-client'

const execPromise = promisify(exec)

// This function handles the print request
export async function GET() {
  try {

    return NextResponse.json(await readSheet())
  } catch (error) {
    console.error("Error in print handler:", error)
    return NextResponse.json({ error: "Server error", details: error }, { status: 500 })
  }
}
