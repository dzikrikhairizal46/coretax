import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fase: string }> }
) {
  try {
    const { fase } = await params
    const backupFileName = `coretax-fase-${fase}-backup.tar.gz`
    const backupPath = path.join(process.cwd(), backupFileName)

    // Check if backup file exists
    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { error: `Backup file for Fase ${fase} not found` },
        { status: 404 }
      )
    }

    // Read the file
    const fileBuffer = await fs.readFile(backupPath)

    // Return the file as download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${backupFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Failed to download backup file' },
      { status: 500 }
    )
  }
}