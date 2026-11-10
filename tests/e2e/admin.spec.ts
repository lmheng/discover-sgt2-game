import { expect, test } from "@playwright/test";
import { E2E_PASSCODE } from "../../playwright.config";
import { shot } from "./helpers";

test.describe("admin", () => {
  test("admin routes are protected", async ({ page, request }) => {
    expect((await request.get("/api/admin/summary")).status()).toBe(401);
    expect((await request.get("/api/admin/export?stream=research")).status()).toBe(401);
    expect((await request.post("/api/admin/delete", { data: { confirm: "DELETE ALL DATA" } })).status()).toBe(401);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("wrong passcode is rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByTestId("admin-passcode").fill("not-the-passcode");
    await page.getByTestId("admin-login").click();
    await expect(page.getByText(/Incorrect passcode|Too many attempts/)).toBeVisible();
  });

  test("gameplay data reaches the dashboard and exports as CSV", async ({ page }) => {
    // Generate some real records by starting a game (session_started + desk research).
    await page.goto("/");
    await page.getByTestId("start").click();
    await page.getByTestId("wf-communications").click();
    await page.getByTestId("freq-daily").click();
    await page.getByTestId("desk-continue").click();
    await expect(page.getByTestId("intro-rush")).toBeVisible();
    await page.waitForTimeout(1500); // allow the outbox to flush

    await page.goto("/admin/login");
    await page.getByTestId("admin-passcode").fill(E2E_PASSCODE);
    await page.getByTestId("admin-login").click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId("exec-summary")).toBeVisible();
    await expect(page.getByTestId("exec-summary")).toContainText("unique visitors");
    await shot(page, "30-admin");

    const res = await page.request.get("/api/admin/export?stream=research");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const csv = await res.text();
    expect(csv.split("\r\n")[0]).toContain("workFunction_status");
    expect(csv).toContain("communications");

    await page.goto("/admin?demo=1");
    await expect(page.getByTestId("demo-watermark")).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, "31-admin-demo");
  });
});
