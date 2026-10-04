import { test, expect } from "@playwright/test";
import sharp from "sharp";
const id = "00000000-0000-4000-8000-000000000001";
test("catalogue et galerie sur mobile et ordinateur", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer")).toContainText("LUMA Store 1.0.0");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: ".impeccable/screenshots/store-home-desktop.png",
    fullPage: true,
  });
  await page.goto("/apps/argos-test");
  await expect(
    page.getByRole("article").getByText("Version actuelle", { exact: true }),
  ).toBeVisible();
  const history = page.locator("details.release-history");
  await expect(history).not.toHaveAttribute("open", "");
  await history.locator("summary").click();
  await expect(
    history.getByRole("heading", { name: "1.5.0", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agrandir Aperçu de test" }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await history.locator("summary").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("radio", { name: "Linux", exact: true }).click();
  await expect(page.locator("a.download-main")).toHaveAttribute(
    "href",
    /platform=linux/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: ".impeccable/screenshots/store-detail-mobile.png",
    fullPage: true,
  });
});
test("administration fermée sans session", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (
      await request.patch(
        `/api/admin/releases/00000000-0000-4000-8000-000000000010`,
        {
          headers: { Origin: "http://127.0.0.1:3100" },
          data: { architecture: "arm64" },
        },
      )
    ).status(),
  ).toBe(401);
});
test.describe("administration avec une session de test isolée", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "luma_store_session",
        value: "isolated-e2e-session",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
  });
  test("corrige les métadonnées et masque une release sans remplacer son fichier", async ({
    page,
    request,
  }) => {
    const fileUrl = "/api/v1/downloads/00000000-0000-4000-8000-000000000016";
    const before = await request.get(fileUrl);
    const checksum = before.headers()["x-checksum-sha256"];
    const bytes = await before.body();
    await page.goto(`/admin/apps/${id}?tab=versions`);
    await expect(
      page.getByRole("link", { name: "Médias / Assets" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Modifier", exact: true })
      .first()
      .click();
    await page
      .getByRole("combobox", { name: "Architecture", exact: true })
      .selectOption("arm64");
    await page
      .getByRole("button", { name: "Enregistrer la correction" })
      .click();
    await expect(page.locator("table")).toContainText("linux · arm64");
    await expect(page.locator("table")).toContainText("argos.deb");
    await page
      .getByRole("button", { name: "Masquer", exact: true })
      .first()
      .click();
    await expect(page.locator("table")).toContainText("Masquée");
    await page
      .getByRole("button", { name: "Afficher", exact: true })
      .first()
      .click();
    await expect(page.locator("table")).toContainText("Publiée");
    const after = await request.get(fileUrl);
    expect(after.headers()["x-checksum-sha256"]).toBe(checksum);
    expect(await after.body()).toEqual(bytes);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: ".impeccable/screenshots/store-admin-versions.png",
      fullPage: true,
    });
  });
  test("modifie la fiche et ses plateformes sans URL d’icône externe", async ({
    page,
  }) => {
    await page.goto(`/admin/apps/${id}`);
    await expect(page.getByLabel("linux", { exact: true })).toBeChecked();
    await expect(page.getByLabel("URL de l’icône")).toHaveCount(0);
    await page.getByLabel("windows", { exact: true }).check();
    await page
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(
      page.getByText("Application mise à jour.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("windows", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Nom", { exact: true })).toHaveValue(
      "Argos Test",
    );
  });
  test("préremplit le fichier et demande le résumé avant publication", async ({
    page,
  }) => {
    await page.goto(`/admin/releases/new?applicationId=${id}`);
    await expect(
      page.getByLabel("Application", { exact: true }),
    ).toBeDisabled();
    await page.getByLabel("Fichier", { exact: true }).setInputFiles({
      name: "argos-prob-1.8.0-1.fc44.aarch64.rpm",
      mimeType: "application/octet-stream",
      buffer: Buffer.from([0xed, 0xab, 0xee, 0xdb, 1, 2, 3, 4]),
    });
    await expect(page.getByLabel("Version", { exact: true })).toHaveValue(
      "1.8.0",
    );
    await expect(
      page.getByRole("combobox", { name: "Architecture", exact: true }),
    ).toHaveValue("arm64");
    await page.getByRole("button", { name: "Vérifier le résumé" }).click();
    await expect(
      page.getByRole("heading", { name: "Résumé", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Confirmer la publication" })
      .click();
    await expect(
      page.getByText("1 fichier(s) publié(s), empreinte SHA-256 calculée."),
    ).toBeVisible();
    await page.goto(`/admin/apps/${id}?tab=versions`);
    await page
      .getByRole("button", { name: "Modifier", exact: true })
      .first()
      .click();
    await expect(
      page.getByText(/Détection : 1.8.0 · aarch64 · rpm · fc44/),
    ).toBeVisible();
  });
  test("importe une icône et des captures hébergées", async ({ page }) => {
    await page.goto(`/admin/apps/${id}?tab=media`);
    const buffer = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#5b5ceb" },
    })
      .png()
      .toBuffer();
    await page
      .getByLabel("Importer ou remplacer l’icône")
      .setInputFiles({ name: "icon.png", mimeType: "image/png", buffer });
    await expect(page.getByAltText("Icône actuelle")).toBeVisible();
    await page.getByLabel(/Déposez les images/).setInputFiles([
      { name: "screen.png", mimeType: "image/png", buffer },
      { name: "screen-2.png", mimeType: "image/png", buffer },
    ]);
    await expect(page.getByLabel("Légende", { exact: true })).toHaveCount(3);
    await page
      .getByLabel("Légende", { exact: true })
      .nth(1)
      .fill("Capture ajoutée");
    await page
      .getByRole("button", { name: "Enregistrer", exact: true })
      .nth(1)
      .click();
    await page.goto("/apps/argos-test");
    await expect(
      page.getByRole("button", { name: "Agrandir Capture ajoutée" }),
    ).toBeVisible();
  });
  test("protège le retrait et les origines, et fournit l’installateur natif", async ({
    context,
  }) => {
    const request = context.request;
    const headers = { Origin: "http://127.0.0.1:3100" };
    const protectedRelease = await request.delete(
      "/api/admin/releases/00000000-0000-4000-8000-000000000014",
      { headers },
    );
    expect(protectedRelease.status()).toBe(409);
    expect((await protectedRelease.json()).error.code).toBe(
      "release_protected",
    );
    const origin = await request.patch(`/api/admin/apps/${id}`, {
      headers: { Origin: "https://other.example" },
      data: { status: "hidden" },
    });
    expect(origin.status()).toBe(403);
    const install = await request.get(
      "/install/linux?app=argos-test&arch=x64&package=deb",
    );
    expect(install.status()).toBe(200);
    expect(await install.text()).toContain("sha256sum --check --status");
    expect(await install.text()).toContain("apt-get install");
  });
});
