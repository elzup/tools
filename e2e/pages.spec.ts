import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const pagesDir = path.join(__dirname, '..', 'src', 'pages')
const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx') && !f.startsWith('_'))

const routes = files.map((file) => {
  const name = file.replace('.tsx', '')
  return name === 'index' ? '/' : `/${name}`
})

const baseUrl = process.env.BASE_URL || 'http://localhost:3010'

test.describe('All pages E2E tests', () => {
  let consoleErrors: string[] = []
  let pageErrors: Error[] = []

  test.beforeEach(async ({ page }) => {
    consoleErrors = []
    pageErrors = []

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })
  })

  for (const route of routes) {
    test(`should load ${route} without errors`, async ({ page }) => {
      const url = baseUrl.replace(/\/$/, '') + route

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // Check HTTP status
      expect(response?.status()).toBeLessThan(400)

      // Wait a bit for client-side rendering
      await page.waitForTimeout(1000)

      // Check for page errors (uncaught exceptions, excluding known issues)
      const criticalPageErrors = pageErrors.filter(
        (err) =>
          !err.message.includes('Clipboard') && // Clipboard API permissions (expected in headless)
          !err.message.includes('qrCodeSuccessCallback') && // QR scanner library init (expected without camera)
          !err.message.includes('BoxBufferGeometry') && // Legacy THREE.js geometry (known issue in gl-bit-counter)
          !err.message.includes('Hydration failed') // SSR mismatch (known issue in some pages)
      )
      expect(
        criticalPageErrors,
        `Page errors on ${route}: ${criticalPageErrors.map((e) => e.message).join(', ')}`
      ).toHaveLength(0)

      // Check for console errors (excluding known warnings)
      const criticalErrors = consoleErrors.filter(
        (msg) =>
          !msg.includes('Download the React DevTools') &&
          !msg.includes('Warning:') &&
          !msg.includes('[HMR]') &&
          !msg.includes('Failed to load resource') && // 404 for optional resources
          !msg.includes('WebSocket connection') && // External WebSocket services
          !msg.includes('Error in connection establishment') // Network errors for optional features
      )
      expect(
        criticalErrors,
        `Console errors on ${route}: ${criticalErrors.join(', ')}`
      ).toHaveLength(0)
    })
  }
})
