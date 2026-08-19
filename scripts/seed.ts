import { pool } from "../lib/db";

const apps = [
  ["luma-agent", "LUMA Agent", "Supervision et maintenance des machines de l'écosystème.", "Infrastructure", true],
  ["orbis", "Orbis", "Déployez et pilotez vos services depuis une interface unifiée.", "Développement", true],
  ["nino-player", "Nino Player", "Un lecteur musical conçu pour l'écosystème LUMA.", "Multimédia", false]
];

for (const [slug, name, summary, category, featured] of apps) {
  await pool.query(
    `INSERT INTO applications (slug, name, summary, description, category, is_featured, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'published') ON CONFLICT (slug) DO NOTHING`,
    [slug, name, summary, summary, category, featured]
  );
}
console.log("Catalogue de démonstration créé (sans faux binaires). ");
await pool.end();
