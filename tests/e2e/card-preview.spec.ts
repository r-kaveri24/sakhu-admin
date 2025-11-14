import { test, expect } from '@playwright/test';

test.describe('CardPreview - Visual Specs', () => {
  test('Renders with fixed dimensions and styles', async ({ page }) => {
    await page.goto('/card-preview-test');

    const card = page.locator('article[aria-label="Card preview"]').first();

    const box = await card.boundingBox();
    expect(box?.width).toBeCloseTo(320, 0);
    expect(box?.height).toBeCloseTo(270, 0);

    const styles = await card.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return {
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        backgroundImage: cs.backgroundImage,
        borderTopWidth: cs.borderTopWidth,
      };
    });

    expect(parseFloat(styles.borderRadius)).toBeGreaterThanOrEqual(4);
    expect(parseFloat(styles.borderRadius)).toBeLessThanOrEqual(12);
    expect(styles.boxShadow).not.toBe('none');
    expect(styles.backgroundImage).toContain('linear-gradient');
    expect(parseFloat(styles.borderTopWidth)).toBeGreaterThan(0);

    // Hover effects: shadow should intensify
    const beforeShadow = styles.boxShadow;
    await card.hover();
    const afterShadow = await card.evaluate(el => getComputedStyle(el as HTMLElement).boxShadow);
    expect(afterShadow).not.toEqual(beforeShadow);

    // Header/title ellipsis
    const title = card.locator('header h3');
    const titleOverflow = await title.evaluate(el => getComputedStyle(el).textOverflow);
    expect(titleOverflow).toBe('ellipsis');
  });
});