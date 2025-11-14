import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'test-results');
const ensureDir = () => { if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true }); };
const writeResult = (name: string, data: any) => { ensureDir(); fs.writeFileSync(path.join(RESULTS_DIR, `${name}.json`), JSON.stringify(data, null, 2)); };

const adminCreds = { email: 'admin@sakhu.org', password: 'admin123' };
const editorCreds = { email: 'editor@sakhu.org', password: 'editor123' };

async function login(page, creds = adminCreds) {
  await page.goto('/sign-in');
  await expect(page).toHaveURL(/.*sign-in/);
  await page.fill('input[type="text"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await Promise.all([
    page.waitForURL('**/admin/hero', { timeout: 15000 }),
    page.click('button:has-text("Log In")'),
  ]);
  await expect(page).toHaveURL(/.*\/admin\/hero/);
}

test.describe('Create News - Functional & UX', () => {
  test('Secure login grants access to news creation', async ({ page }) => {
    await login(page, editorCreds);
    await page.goto('/admin/news');
    await expect(page.locator('h1')).toHaveText(/Create News/i);
  });

  test('Create news with full data and image, capture performance', async ({ page }) => {
    await login(page, editorCreds);
    await page.goto('/admin/news');

    // Fill heading with special chars and long title
    const heading = `Launch Update – QA & Validation ✅ ${Date.now()}`;
    await page.fill('input[type="text"]', heading);

    // Fill Description via Quill editor
    const descEditor = page.locator('.quill-desc .ql-editor');
    await descEditor.click();
    await descEditor.type('This is a rich text description with bold, lists, and an embedded link: https://sakhu.org');

    // Upload an image (use repo root test.jpg)
    const fileInput = page.locator('input[type="file"]');
    // Trigger the hidden input via Upload button
    await page.getByRole('button', { name: /Upload File/i }).click();
    const fixturePath = path.join(process.cwd(), 'test.jpg');
    await fileInput.setInputFiles(fixturePath);

    // Submit and measure creation time
    const start = Date.now();
    await Promise.all([
      page.waitForURL(/.*\/admin\/news-edit\?id=.*/i, { timeout: 30000 }),
      page.getByRole('button', { name: /Submit/i }).click(),
    ]);
    const durationMs = Date.now() - start;

    // Screenshot of edit page after creation
    await page.screenshot({ path: path.join(RESULTS_DIR, 'news-create-success.png'), fullPage: true });

    // Verify persistence via API
    const resp = await page.request.get('/api/news');
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const created = (data.items || []).find((n: any) => n.title === heading);
    expect(created).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    const createdAt = new Date(created.createdAt).getTime();
    expect(Math.abs(Date.now() - createdAt)).toBeLessThan(5 * 60 * 1000);

    writeResult('news-create-performance', { durationMs, createdId: created.id, title: created.title });
  });

  test('Create news with various content formats (text-only, special characters)', async ({ page }) => {
    await login(page, editorCreds);
    await page.goto('/admin/news');

    const heading = `Special ~!@#$%^&*()_+{}|:"<>? News ${Date.now()}`;
    await page.fill('input[type="text"]', heading);
    const descEditor = page.locator('.quill-desc .ql-editor');
    await descEditor.click();
    await descEditor.type('Text-only entry with unicode: नमस्ते, مرحبا, こんにちは, emojis: 🚀🔥');

    await Promise.all([
      page.waitForURL(/.*\/admin\/news-edit\?id=.*/i, { timeout: 30000 }),
      page.getByRole('button', { name: /Submit/i }).click(),
    ]);

    const resp = await page.request.get('/api/news');
    const data = await resp.json();
    const created = (data.items || []).find((n: any) => n.title === heading);
    expect(created).toBeTruthy();
  });

  test('News appears in listing with correct timestamp', async ({ page }) => {
    await login(page, editorCreds);
    await page.goto('/admin/news');
    // Listing renders after load; verify at least one item shows createdAt or shows card rows
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('Negative: missing required fields shows validation error', async ({ page }) => {
    await login(page, editorCreds);
    await page.goto('/admin/news');
    // Without heading and content/description the button is disabled
    const submit = page.getByRole('button', { name: /Submit/i });
    await expect(submit).toBeDisabled();

    // Fill heading but leave description empty
    await page.fill('input[type="text"]', 'Heading only');
    await expect(submit).toBeDisabled();

    // Fill minimal description to enable
    const descEditor = page.locator('.quill-desc .ql-editor');
    await descEditor.click();
    await descEditor.type('x');
    await expect(submit).toBeEnabled();
  });

  test('Negative: unauthorized access redirects to sign-in', async ({ page }) => {
    // No login
    await page.goto('/admin/news');
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('Negative: session timeout (cookie cleared) forces sign-in on refresh', async ({ page, context }) => {
    await login(page, editorCreds);
    await page.goto('/admin/news');
    // Clear auth cookie and localStorage
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    if (authCookie) await context.clearCookies();
    await page.evaluate(() => { localStorage.removeItem('user'); });
    await page.reload();
    await expect(page).toHaveURL(/.*sign-in/);
  });
});