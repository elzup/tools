#!/usr/bin/env node
/*
  E2E access checker
  - Requires a running dev server (default: http://localhost:3010)
  - Usage: BASE_URL=http://localhost:3010 node scripts/e2e-access.js
*/

const fs = require('fs')
const path = require('path')

async function run() {
  const pagesDir = path.join(__dirname, '..', 'src', 'pages')
  const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx') && !f.startsWith('_'))

  const routes = files.map((file) => {
    const name = file.replace('.tsx', '')
    return name === 'index' ? '/' : `/${name}`
  })

  const baseUrl = process.env.BASE_URL || 'http://localhost:3010'

  console.log(`Base URL: ${baseUrl}`)
  console.log(`Checking ${routes.length} routes...`)

  const { chromium } = require('@playwright/test')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const results = []
  for (const r of routes) {
    const url = baseUrl.replace(/\/$/, '') + r
    process.stdout.write(`Visiting ${url} ... `)
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      const status = resp ? resp.status() : null
      if (status && status >= 400) {
        console.log(`FAIL (HTTP ${status})`)
        results.push({ route: r, ok: false, status })
      } else {
        console.log('OK')
        results.push({ route: r, ok: true, status })
      }
    } catch (err) {
      console.log('ERROR')
      console.error(err && err.message ? err.message : err)
      results.push({ route: r, ok: false, error: String(err) })
    }
  }

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log('\nSummary:')
  console.log(`  Total: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`)
  if (failed.length > 0) {
    console.log('\nFailures:')
    failed.forEach((f) => console.log(`  ${f.route} -> ${f.status || f.error}`))
    process.exit(1)
  }

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(2)
})
