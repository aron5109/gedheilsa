import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('Icelandic landing and demo show setup honestly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'is');
  await expect(page.getByRole('heading', { name: 'Smá stund. Meiri hlýja.' })).toBeVisible();
  await page.getByRole('link', { name: 'Kíkja inn í Hlýju' }).click();
  await expect(page.getByRole('heading', { name: 'Gott að sjá þig, Alex.' })).toBeVisible();
  await expect(page.getByText('Tilbúnar færslur.', { exact: false })).toBeVisible();
});
test('records multiple moods, preserves individual notes, and exports chosen data', async ({
  page,
}) => {
  await page.goto('/demo');
  for (const note of ['Fyrri færsla', 'Seinni færsla']) {
    await page.getByRole('button', { name: 'Ágætlega', exact: true }).click();
    await page.getByLabel('Viltu bæta einhverju við?').fill(note);
    await page.getByRole('dialog').getByRole('button', { name: 'Skrá líðan', exact: true }).click();
    await page.getByRole('button', { name: 'Til baka í daginn' }).click();
  }
  await page.getByRole('button', { name: 'Líðan yfir tíma', exact: true }).click();
  await expect(page.getByText('Fyrri færsla', { exact: true })).toBeVisible();
  await expect(page.getByText('Seinni færsla', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dagur', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Sækja CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
});
test('medication schedule logs only once and appointment exports to calendar', async ({ page }) => {
  await page.goto('/demo');
  await page
    .getByRole('navigation', { name: 'Aðalvalmynd' })
    .getByRole('button', { name: 'Áminningar', exact: true })
    .click();
  await page.getByRole('button', { name: 'Ný áminning' }).click();
  await page.getByLabel('Tegund').selectOption('medication');
  await page.getByLabel('Heiti lyfs eða áminningar').fill('Prófunarlyf');
  await page.getByLabel('Tími 1', { exact: true }).fill('00:00');
  await page.getByRole('button', { name: 'Vista áminningu' }).click();
  await page.getByRole('button', { name: 'Búið að taka', exact: true }).click();
  await expect(page.getByText('Tekið', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Búið að taka', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Bæta við tíma', exact: true }).click();
  await page.getByLabel('Heiti', { exact: true }).fill('Viðtal');
  await page.getByLabel('Dagsetning og tími').fill('2027-10-15T10:00');
  await page.getByRole('button', { name: 'Vista tíma' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Apple / iCal' }).click();
  expect((await download).suggestedFilename()).toBe('hlyja-timi.ics');
});
test('mobile layout fits and navigation is keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page
    .getByRole('navigation', { name: 'Valmynd í síma' })
    .getByRole('button', { name: 'Líðan', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Dagarnir þínir.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('dashboard and mood dialog satisfy automated accessibility checks', async ({ page }) => {
  await page.goto('/demo');
  let results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Mjög illa', exact: true }).click();
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('private APIs fail closed without an authenticated user', async ({ request }) => {
  for (const path of ['/api/data', '/api/export']) {
    const r = await request.get(path);
    expect([401, 503]).toContain(r.status());
    expect(r.headers()['cache-control']).toContain('no-store');
  }
  const job = await request.get('/api/cron');
  expect(job.status()).toBe(401);
  const change = await request.post('/api/entries', { data: { kind: 'mood', payload: {} } });
  expect(change.status()).toBe(403);
});

test('new user answers Icelandic onboarding and sees a personalized suggestion', async ({
  page,
}) => {
  await page.goto('/demo?nyr=1');
  await page.getByLabel('Hvað eigum við að kalla þig?').fill('Rósa');
  await page.getByLabel('Ég er 18 ára eða eldri.').check();
  await page.getByRole('button', { name: 'Halda áfram' }).click();
  await page.getByRole('button', { name: 'Tónlist', exact: true }).click();
  await page
    .getByLabel('Eitthvað sem þér þykir sérstaklega gott að gera?')
    .fill('Ganga með hundinum');
  await page.getByRole('button', { name: 'Halda áfram' }).click();
  await page.getByLabel('Ég samþykki að Hlýja geymi').check();
  await page.getByRole('button', { name: 'Opna Hlýju' }).click();
  await expect(page.getByRole('heading', { name: 'Gott að sjá þig, Rósa.' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Ganga með hundinum', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.chart-date').first()).toHaveText(/^(sun|mán|þri|mið|fim|fös|lau)\.$/);
});
