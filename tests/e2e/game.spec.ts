import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { playDetective, playLaunch, playRush, shot } from "./helpers";

test.describe("full game", () => {
  test("complete run by touch/tap with all Real Mission steps", async ({ page }) => {
    test.setTimeout(180_000); // three real-time missions plus research steps
    await page.goto("/");
    await expect(page.getByTestId("title")).toBeVisible();
    await shot(page, "01-title");
    await page.getByTestId("start").click();

    // Desk setup (research: work function + frequency)
    await expect(page.getByTestId("interlude-desk")).toBeVisible();
    await page.getByTestId("wf-product_engineering").click();
    await page.getByTestId("freq-weekly").click();
    await shot(page, "02-desk");
    await page.getByTestId("desk-continue").click();

    // Mission 1
    await expect(page.getByTestId("intro-rush")).toBeVisible();
    await shot(page, "03-intro-rush");
    await page.getByTestId("mission-go").click();
    await page.waitForTimeout(2500);
    await shot(page, "04-rush");
    await playRush(page, "tap");
    await expect(page.getByTestId("mission-outcome")).toContainText("Mission complete");
    await shot(page, "05-result-rush");
    await page.getByTestId("mission-next").click();

    // Content-type interlude: same drag/tap mechanic
    await expect(page.getByTestId("interlude-contentTypes")).toBeVisible();
    await page.getByTestId("sort-mine").click();
    await page.getByTestId("sort-notme").click();
    await page.getByTestId("sort-mine").click();
    await shot(page, "06-content-sort");
    await page.getByTestId("interlude-done").click();

    // Mission 2
    await page.getByTestId("mission-go").click();
    await page.waitForTimeout(800);
    await shot(page, "07-detective");
    await playDetective(page);
    await page.getByTestId("mission-next").click();

    // Challenges interlude
    await expect(page.getByTestId("interlude-challenges")).toBeVisible();
    await page.getByTestId("challenge-turnaround").click();
    await page.getByTestId("challenge-consistency").click();
    await shot(page, "08-case-files");
    await page.getByTestId("interlude-done").click();

    // Mission 3
    await page.getByTestId("mission-go").click();
    await page.getByTestId("run-zh").click();
    await page.waitForTimeout(1600);
    await shot(page, "09-launch");
    // Trap: publishing an unreviewed draft is blocked with a human-review message.
    await page.getByTestId("publish-zh").click();
    await expect(page.getByTestId("feedback")).toContainText("human review");
    await playLaunch(page);
    await page.getByTestId("mission-next").click();

    // Tools + capability interludes
    await expect(page.getByTestId("interlude-tools")).toBeVisible();
    await page.getByTestId("tool-bilingual_colleagues").click();
    await shot(page, "10-crew");
    await page.getByTestId("interlude-done").click();
    await expect(page.getByTestId("interlude-capability")).toBeVisible();
    await page.getByTestId("cap-glossary").click();

    // Results
    await expect(page.getByTestId("results")).toBeVisible();
    await page.waitForTimeout(1600);
    await shot(page, "11-results");
    const score = Number((await page.getByTestId("final-score").innerText()).replace(/,/g, ""));
    expect(score).toBeGreaterThan(1000);
    await expect(page.getByTestId("tier-badge")).toBeVisible();

    // Optional interest, separate from play
    await page.getByTestId("cta-interest").click();
    await page.getByTestId("interest-yes").click();
    await expect(page.getByTestId("formsg-placeholder")).toBeVisible();
    await shot(page, "12-interest");
    await page.getByTestId("interest-done").click();
    await expect(page.getByTestId("thanks")).toBeVisible();

    // Replay in the same visit does not ask research questions again.
    await page.getByRole("button", { name: "Play again" }).click();
    await expect(page.getByTestId("intro-rush")).toBeVisible();
  });

  test("research steps can all be skipped without penalty", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("start").click();
    await page.getByTestId("interlude-skip").click();
    await expect(page.getByTestId("intro-rush")).toBeVisible();
  });

  test("keyboard-only: start and play Translation Rush with number keys", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("title")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("interlude-desk")).toBeVisible();
    await page.keyboard.press("Tab"); // first focusable: Skip
    await expect(page.getByTestId("interlude-skip")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("intro-rush")).toBeVisible();
    await page.keyboard.press("Enter");
    await playRush(page, "keys");
    await expect(page.getByTestId("mission-outcome")).toContainText("Mission complete");
  });

  test("respects reduced motion", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByTestId("title")).toBeVisible();
    const duration = await page.getByTestId("witty").first().evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
    await ctx.close();
  });

  test("no serious accessibility violations on key screens", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("title")).toBeVisible();
    await page.waitForTimeout(600);
    const check = async (label: string) => {
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    };
    await check("title");
    await page.getByTestId("start").click();
    await page.waitForTimeout(600);
    await check("desk");
    await page.getByTestId("interlude-skip").click();
    await page.waitForTimeout(600);
    await check("intro");
  });
});

test.describe("kiosk mode", () => {
  // Real time (no fake clock): Motion's frame loop does not advance reliably under
  // Playwright's mocked clock. Uses the configured 30 s results/title timeout + 10 s countdown.
  test("attract screen, idle warning, dismiss, then reset to attract", async ({ page }, info) => {
    test.skip(info.project.name !== "kiosk-1920", "Long real-time idle test runs on the kiosk project only");
    test.setTimeout(150_000);
    await page.goto("/kiosk");
    await expect(page.getByTestId("attract")).toBeVisible();
    await shot(page, "20-attract");
    await page.getByTestId("attract").click();
    await expect(page.getByTestId("title")).toBeVisible();
    await expect(page.getByTestId("idle-warning")).toBeVisible({ timeout: 40_000 });
    await shot(page, "21-idle-warning");
    await page.getByRole("button", { name: "I'm still here" }).click();
    await expect(page.getByTestId("idle-warning")).toBeHidden();
    await expect(page.getByTestId("title")).toBeVisible();
    await expect(page.getByTestId("idle-warning")).toBeVisible({ timeout: 40_000 });
    await expect(page.getByTestId("attract")).toBeVisible({ timeout: 15_000 });
  });

  test("staff panel shows a text-only GovEntry reminder and resets the visitor", async ({ page }) => {
    await page.goto("/kiosk");
    await page.getByTestId("attract").click();
    await page.keyboard.press("Shift+S");
    await expect(page.getByTestId("staff-panel")).toBeVisible();
    await shot(page, "22-staff");
    await page.getByTestId("staff-goventry").click();
    const reminder = page.getByTestId("goventry-reminder");
    await expect(reminder).toContainText("GovEntry");
    await expect(reminder.locator("img, canvas")).toHaveCount(0); // never a substitute QR
    await shot(page, "23-goventry");
    await page.getByRole("button", { name: "Done" }).click();
    await page.keyboard.press("Shift+S");
    await page.getByTestId("staff-reset").click();
    await expect(page.getByTestId("attract")).toBeVisible();
  });

  test("no horizontal overflow on the game screens", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("start").click();
    await page.getByTestId("interlude-skip").click();
    await page.getByTestId("mission-go").click();
    await page.waitForTimeout(3000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
