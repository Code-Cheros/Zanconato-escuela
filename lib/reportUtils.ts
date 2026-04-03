import { prisma } from './prisma'
import path from 'path'
import fs from 'fs/promises'

const prismaCompat = prisma as any

/**
 * Gets the system logo and converts it to a Base64 string for embedding in HTML/PDF.
 */
export async function getLogoBase64(): Promise<string | null> {
  const cwd = process.cwd()
  try {
    const config = await prismaCompat.configuracionSistema.findUnique({
      where: { id: 'global' },
      select: { logoUrl: true }
    })

    if (!config?.logoUrl) {
      console.log('[LogoDebug] No logoUrl configured in global settings.')
      return null
    }

    const relativePath = config.logoUrl.startsWith('/') ? config.logoUrl.slice(1) : config.logoUrl
    const filePath = path.join(cwd, 'public', relativePath)
    
    console.log(`[LogoDebug] CWD: ${cwd}`)
    console.log(`[LogoDebug] Resolved filePath: ${filePath}`)

    try {
      const buffer = await fs.readFile(filePath)
      const ext = path.extname(filePath).slice(1).toLowerCase() || 'png'
      let mimeType = `image/${ext}`
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else if (ext === 'svg') mimeType = 'image/svg+xml'
      
      const b64 = buffer.toString('base64')
      console.log(`[LogoDebug] Success! Base64 length: ${b64.length}`)
      return `data:${mimeType};base64,${b64}`
    } catch (e: any) {
      console.error(`[LogoDebug] Error reading file at ${filePath}:`, e.message)
      // Fallback: try without 'public' if it's already included or environment is different
      if (filePath.includes('public/public')) {
        const altPath = filePath.replace('public/public', 'public')
        try {
           const buffer = await fs.readFile(altPath)
           console.log(`[LogoDebug] Success on fallback path: ${altPath}`)
           return `data:image/png;base64,${buffer.toString('base64')}`
        } catch (e2) {}
      }
      return null
    }
  } catch (e: any) {
    console.error('[LogoDebug] Global error getting logo:', e.message)
    return null
  }
}

/**
 * Gets the system logo as a Buffer for embedding in Excel files.
 */
export async function getLogoBuffer(): Promise<{ buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null> {
  const cwd = process.cwd()
  try {
    const config = await prismaCompat.configuracionSistema.findUnique({
      where: { id: 'global' },
      select: { logoUrl: true }
    })

    if (!config?.logoUrl) return null

    const relativePath = config.logoUrl.startsWith('/') ? config.logoUrl.slice(1) : config.logoUrl
    const filePath = path.join(cwd, 'public', relativePath)

    try {
      const buffer = await fs.readFile(filePath)
      let ext = path.extname(filePath).slice(1).toLowerCase()
      
      let finalExt: 'png' | 'jpeg' | 'gif' = 'png'
      if (ext === 'jpg' || ext === 'jpeg') finalExt = 'jpeg'
      else if (ext === 'gif') finalExt = 'gif'
      else finalExt = 'png'

      return { buffer, extension: finalExt }
    } catch (e) {
      console.error(`[LogoDebugBuffer] Error reading file at ${filePath}`)
      return null
    }
  } catch (e) {
    return null
  }
}
