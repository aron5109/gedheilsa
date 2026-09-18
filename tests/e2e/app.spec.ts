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
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Mjög illa', exact: true }).click();
  results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
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

test('daily words stay stable on reload and change when the local day changes', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-09-17T23:59:30Z') });
  await page.goto('/demo');
  await expect(page.locator('.date-label')).toContainText('17. september');
  const quote = page.locator('.gentle-card blockquote');
  const text = await quote.innerText();
  await page.reload();
  await expect(page.locator('.date-label')).toContainText('17. september');
  await expect(quote).toHaveText(text);
  await page.clock.fastForward(60000);
  await expect(quote).not.toHaveText(text);
  await expect(page.locator('.fact-source')).toHaveAttribute(
    'href',
    /^https:\/\/(www\.)?(cdc\.gov|nhlbi\.nih\.gov|who\.int)\//,
  );
});

test('personal reminders can be previewed, enabled and revoked', async ({ page }) => {
  await page.goto('/demo');
  await page
    .getByRole('navigation', { name: 'Aðalvalmynd' })
    .getByRole('button', { name: 'Mitt rými', exact: true })
    .click();
  const preview = page.getByLabel('Dæmi um tilkynningu');
  await expect(preview).not.toContainText('Alex');
  await page.getByLabel('Persónulegar tilkynningar með fornafninu mínu').check();
  await expect(preview).toContainText('Hæ, Alex.');
  await page.getByLabel('Persónulegar tilkynningar með fornafninu mínu').uncheck();
  await expect(preview).not.toContainText('Alex');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('notification destinations open the intended action', async ({ page }) => {
  await page.goto('/demo?skra=lidan');
  await expect(page.getByRole('dialog', { name: 'Hvernig líður þér núna?' })).toBeVisible();
  await page.goto('/demo?skra=vatn');
  await expect(page.getByRole('dialog', { name: 'Skrá vatn' })).toBeVisible();
  await page.goto('/demo?sida=aminningar');
  await expect(page.getByRole('heading', { name: 'Daglegar áminningar' })).toBeVisible();
});

test('phone mood controls are primary, large and readable with enlarged text', async ({ page }) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/demo');
    const controls = page.locator('.dashboard-moods .mood-option');
    await expect(controls).toHaveCount(5);
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(64);
      expect(box!.width).toBeGreaterThan(220);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const tooSmall = await page.locator('button:visible').evaluateAll((buttons) =>
      buttons
        .filter((button) => {
          const box = button.getBoundingClientRect();
          return box.width < 48 || box.height < 48;
        })
        .map((button) => button.textContent || button.getAttribute('aria-label')),
    );
    expect(tooSmall).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Vel', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Vel, breyta líðan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Vel', exact: true })).toBeFocused();
});

test('app navigation supports back, forward and reloading the selected screen', async ({
  page,
}) => {
  await page.goto('/demo');
  const nav = page.getByRole('navigation', { name: 'Aðalvalmynd' });
  await nav.getByRole('button', { name: 'Líðan yfir tíma' }).click();
  await expect(page).toHaveURL(/#lidan$/);
  await nav.getByRole('button', { name: 'Áminningar', exact: true }).click();
  await expect(page).toHaveURL(/#aminningar$/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Dagarnir þínir.' })).toBeVisible();
  await expect(page.locator('#main-content')).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Daglegar áminningar' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Daglegar áminningar' })).toBeVisible();
  await expect(page).toHaveTitle('Áminningar · Hlýja');
  await expect(page.locator('head > title')).toHaveCount(1);
});

test('mood draft survives Escape, changing mood and opening optional details', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Ágætlega', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Ágætlega, breyta líðan' })).toBeVisible();
  const note = page.getByLabel('Viltu bæta einhverju við?');
  await note.fill('Mikilvæg óvistuð hugsun');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Loka án þess að vista?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Halda áfram', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Halda áfram', exact: true }).click();
  await expect(note).toHaveValue('Mikilvæg óvistuð hugsun');
  await dialog.getByRole('button', { name: 'Ágætlega, breyta líðan' }).click();
  await dialog.getByRole('button', { name: 'Vel', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Vel, breyta líðan' })).toBeFocused();
  await dialog.locator('summary').click();
  const time = page.getByLabel('Tími skráningar', { exact: false });
  const originalTime = await time.inputValue();
  await time.fill('');
  await dialog.locator('summary').click();
  await dialog.getByRole('button', { name: 'Skrá líðan', exact: true }).click();
  await expect(time).toBeVisible();
  await time.fill(originalTime);
  await dialog.getByRole('button', { name: 'Skrá líðan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Líðanin þín skiptir máli.' })).toBeFocused();
  await page.getByRole('button', { name: 'Til baka í daginn' }).click();
  await page.getByRole('button', { name: 'Líðan yfir tíma', exact: true }).click();
  await expect(page.getByText('Mikilvæg óvistuð hugsun', { exact: true })).toBeVisible();
});

test('touch entry flow has a reachable save action and explicit discard', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    baseURL: 'http://127.0.0.1:3000',
  });
  const page = await context.newPage();
  try {
    await page.goto('/demo');
    await page.getByRole('button', { name: 'Vel', exact: true }).tap();
    const save = page.getByRole('dialog').getByRole('button', { name: 'Skrá líðan', exact: true });
    const box = await save.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    await page.getByLabel('Viltu bæta einhverju við?').fill('Þessi drög verða ekki vistuð');
    await page.getByRole('button', { name: 'Loka glugga' }).tap();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole('button', { name: 'Loka án þess að vista', exact: true }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page
      .getByRole('navigation', { name: 'Valmynd í síma' })
      .getByRole('button', { name: 'Líðan', exact: true })
      .tap();
    await expect(page.getByText('Þessi drög verða ekki vistuð', { exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
