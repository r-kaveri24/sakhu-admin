import { test, expect } from '@playwright/test';

test.describe('News Card Preview - Formatting and Truncation', () => {
  test('Displays date as "DD Month YYYY" and ellipsis on description', async ({ page }) => {
    await page.goto('/news-card-preview-test');

    // Heading should be fully visible, no truncation
    const heading = page.locator('article h3');
    await expect(heading).toHaveText('Inauguration of Sakhu Cancer Foundation');

    // Date should be formatted and prefixed with "Date:"
    const date = page.locator('article p[aria-label="Publication date"]');
    await expect(date).toHaveText(/Date: 02 .* October 2024|Date: 02 October 2024/);

    // Description element should have text-overflow: ellipsis and be single-line
    const desc = page.locator('article [aria-label="Description"]');
    const overflow = await desc.evaluate(el => getComputedStyle(el).textOverflow);
    expect(overflow).toBe('ellipsis');
    const whiteSpace = await desc.evaluate(el => getComputedStyle(el).whiteSpace);
    expect(whiteSpace).toBe('nowrap');
  });
});