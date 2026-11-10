import { expect, type Page } from "@playwright/test";

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/screens/${test_project(page)}-${name}.png`, fullPage: false });

function test_project(page: Page) {
  const w = page.viewportSize()?.width ?? 0;
  return w < 500 ? "mobile" : w < 1500 ? "laptop" : "kiosk";
}

/** Plays Translation Rush perfectly by reading each card's answer and tapping card then dock. */
export async function playRush(page: Page, mode: "tap" | "keys" = "tap") {
  const scene = page.getByTestId("scene-rush");
  await expect(scene).toBeVisible();
  const keyFor: Record<string, string> = { together: "1", polyglot: "2", api: "3" };
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await page.getByTestId("result-rush").isVisible().catch(() => false)) break;
    const card = page.getByTestId("rush-card").first();
    if (!(await card.isVisible().catch(() => false))) {
      await page.waitForTimeout(150);
      continue;
    }
    const answer = await card.getAttribute("data-answer", { timeout: 500 }).catch(() => null);
    if (!answer) continue;
    if (mode === "keys") {
      await page.keyboard.press(keyFor[answer]!);
    } else {
      await card.click({ timeout: 2000 }).catch(() => undefined);
      await page.getByTestId(`dock-${answer}`).click({ timeout: 2000 }).catch(() => undefined);
    }
    // Let the routed card finish its exit animation so the next read is the real front card.
    await page.waitForTimeout(350);
  }
  await expect(page.getByTestId("result-rush")).toBeVisible({ timeout: 10_000 });
}

export async function playDetective(page: Page) {
  await expect(page.getByTestId("scene-detective")).toBeVisible();
  for (let i = 0; i < 3; i++) {
    const odd = page.locator('[data-testid="detective-segment"][data-odd="true"]');
    await odd.click();
    await page.getByRole("button", { name: "Next case" }).click();
  }
  await expect(page.getByTestId("result-detective")).toBeVisible({ timeout: 10_000 });
}

export async function playLaunch(page: Page) {
  await expect(page.getByTestId("scene-launch")).toBeVisible();
  for (const id of ["zh", "ms", "ta"]) {
    const run = page.getByTestId(`run-${id}`);
    if (await run.isVisible().catch(() => false)) await run.click();
  }
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    if (await page.getByTestId("result-launch").isVisible().catch(() => false)) break;
    for (const id of ["zh", "ms", "ta"]) {
      const lane = page.getByTestId(`lane-${id}`);
      const stage = await lane.getAttribute("data-stage", { timeout: 500 }).catch(() => null);
      if (stage === "translated") await page.getByTestId(`review-${id}`).click({ timeout: 1000 }).catch(() => undefined);
      if (stage === "issue") await page.getByTestId(`fix-${id}`).click({ timeout: 1000 }).catch(() => undefined);
      if (stage === "approved") await page.getByTestId(`publish-${id}`).click({ timeout: 1000 }).catch(() => undefined);
    }
    await page.waitForTimeout(150);
  }
  await expect(page.getByTestId("result-launch")).toBeVisible({ timeout: 10_000 });
}
