import { Browser, Page } from 'playwright'
import qawolf from 'qawolf'

let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await qawolf.launch()
  const context = await browser.newContext()
  await qawolf.register(context)
  page = await context.newPage()
})

afterAll(async () => {
  await qawolf.stopVideos()
  await browser.close()
})

test('localhost', async () => {
  await page.goto('http://localhost:3000/')
  await page.click('.root div')
  await page.click('text=made by anozon')
  await page.click('text=GHA BadgeMaker')

  await page.waitForSelector('[data-test=page-gha-badge-maker]')
  await page.click('text=noopener Attack Demo')

  await page.waitForSelector('[data-test=page-noopener]')
  await page.click('text=Top')

  await page.waitForSelector('[data-test=page-]')
})
