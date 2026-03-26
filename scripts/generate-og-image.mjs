import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputPath = join(__dirname, '../public/og-image.png')

// 1200×630 — standard OG image size
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c896"/>
      <stop offset="100%" stop-color="#007a5e"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#d0fff2" stop-opacity="1"/>
    </linearGradient>
    <!-- Subtle grid pattern -->
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <!-- Grid overlay -->
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Glow circle behind icon -->
  <circle cx="210" cy="305" r="155" fill="rgba(255,255,255,0.10)"/>
  <circle cx="210" cy="305" r="115" fill="rgba(255,255,255,0.10)"/>

  <!-- Lightning bolt icon (centred in the circle) -->
  <g transform="translate(132, 185) scale(1.55)">
    <path d="M100 20 L45 100 L80 100 L70 155 L125 75 L90 75 Z"
          fill="url(#boltGrad)"
          filter="drop-shadow(0 6px 18px rgba(0,0,0,0.25))"/>
  </g>

  <!-- Divider line -->
  <line x1="390" y1="190" x2="390" y2="430" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>

  <!-- App name -->
  <text x="430" y="300"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="96" font-weight="800" fill="#ffffff" letter-spacing="-3">
    ChargeNow
  </text>

  <!-- Tagline -->
  <text x="433" y="370"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="38" font-weight="400" fill="rgba(255,255,255,0.85)">
    Find EV Charging Stations Near You
  </text>

  <!-- Bottom bar -->
  <rect x="0" y="555" width="1200" height="75" fill="rgba(0,0,0,0.18)"/>
  <text x="600" y="603"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="26" font-weight="500" fill="rgba(255,255,255,0.65)" text-anchor="middle">
    Real-time availability · Directions · Free to use
  </text>
</svg>
`

await sharp(Buffer.from(svg)).png().toFile(outputPath)
console.log(`✅  OG image saved → ${outputPath}`)
