// Headless smoke test of the console against a running stack (live mode):
//   VITE dev server on CONSOLE_URL with VITE_LIVE_API=true, gateway behind /api.
//   node e2e/console.smoke.mjs   (BROWSER_CHANNEL=msedge to use Edge)
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.CONSOLE_URL ?? 'http://127.0.0.1:8766'
const OUT = process.env.SHOTS ?? 'e2e/screenshots'
mkdirSync(OUT, { recursive: true })

// BROWSER_CHANNEL=msedge (or chrome) reuses an installed browser instead of Playwright's.
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? 'chromium',
})
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } })
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` })
const step = (msg) => console.log(`- ${msg}`)
page.on('pageerror', (e) => console.log('  page error:', e.message))

// 1. sign-in is the default page
await page.goto(`${BASE}/`)
await page.waitForURL(/\/sign-in/)
await page.getByText('Demo operators').waitFor()
await shot('1-sign-in')
step('opening / redirects to /sign-in with the demo operator line')

// 2. hospital demo account
await page.getByRole('button', { name: 'Hospital demo' }).click()
await page.getByRole('button', { name: /^Sign in$/i }).click()
await page.waitForURL((u) => !u.pathname.startsWith('/sign-in'), { timeout: 15_000 })
await page.getByText('SLA Verification Overview').waitFor()
await page.waitForTimeout(1500)
await shot('2-dashboard')
step('hospital demo signs in and lands on the dashboard')

// sign out
await page.evaluate(() => {
  document.cookie = 'thisisjustarandomstring=; Max-Age=0; path=/'
})

// 3. new provider account
const email = `provider-${Date.now()}@edge.test`
await page.goto(`${BASE}/sign-up`)
await page.getByText('Provider', { exact: true }).click()
await page.getByLabel('Organisation').fill('Smoke Test Edge Cloud')
await page.getByLabel('Email').fill(email)
await page.getByLabel('Password', { exact: true }).fill('smoke-password-1')
await page.getByLabel('Confirm Password').fill('smoke-password-1')
await page.getByRole('button', { name: 'Create Account' }).click()
await page.waitForURL(/\/wallet/, { timeout: 15_000 })
await page.getByText('Account link').waitFor()
await shot('3-wallet-after-signup')
step(`new provider ${email} signs up and lands on /wallet`)

// 4. connect the development burner wallet and link it
await page.locator('mysten-dapp-kit-connect-button').first().click()
await page.getByText(/burner/i).first().click({ timeout: 10_000 })
await page.getByText(/^0x[0-9a-f]{64}$/).waitFor({ timeout: 15_000 })
const address = (await page.getByText(/^0x[0-9a-f]{64}$/).first().textContent())?.trim()
step(`burner wallet connected: ${address}`)
await page.getByRole('button', { name: /Link connected wallet/ }).click()
await page.getByText('Wallet linked to your account').waitFor({ timeout: 15_000 })
await page.waitForTimeout(1000)
await shot('4-wallet-linked')
step('signed challenge links the wallet to the account')

await browser.close()
console.log('console smoke test passed')
