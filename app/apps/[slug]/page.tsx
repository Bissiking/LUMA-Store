import { ScreenshotGallery } from "@/components/screenshot-gallery";
import { listMedia } from "@/lib/media";
import { groupReleases } from "@/lib/release-groups";
import type { Metadata } from "next";
import Link from "next/link";
import { platformLabel } from "@/lib/os-detect";
import { Download, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getApplication, listReleases } from "@/lib/store";
import { formatBytes } from "@/lib/format";
import { AppIcon } from "@/components/app-icon";
import { DownloadButton } from "@/components/download-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const app = await getApplication((await params).slug).catch(() => null);
  return app
    ? { title: app.name, description: app.summary }
    : { title: "Application introuvable" };
}

export default async function AppDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const app = await getApplication((await params).slug).catch(() => null);
  if (!app) notFound();
  const releases = await listReleases(app.id);
  const media = await listMedia(app.id);
  const groups = groupReleases(releases);
  const renderGroup = ([version, items]: (typeof groups)[number]) => (
    <section key={version}>
      <h3>{version}</h3>
      {[...new Set(items.map((release) => release.platform))].map(
        (platform) => (
          <div key={platform}>
            <h4>{platformLabel(platform)}</h4>
            {items
              .filter((release) => release.platform === platform)
              .map((release) => (
                <div className="release-row" key={release.id}>
                  <div>
                    <strong>
                      {release.platform} · {release.architecture}
                    </strong>
                    <small>
                      {release.packageType.toUpperCase()}
                      {release.distribution
                        ? ` · ${release.distribution}`
                        : ""}{" "}
                      · {formatBytes(release.sizeBytes)} · {release.channel}
                    </small>
                    {release.publishedAt && (
                      <small>
                        Publié le{" "}
                        {new Date(release.publishedAt).toLocaleDateString(
                          "fr-FR",
                          {
                            timeZone: "Europe/Paris",
                          },
                        )}
                      </small>
                    )}
                  </div>
                  <Link
                    href={`/api/v1/downloads/${release.id}`}
                    className="button button-secondary"
                    aria-label={`Télécharger ${app.name} ${version} pour ${release.platform} ${release.architecture}`}
                  >
                    <Download size={16} /> Télécharger
                  </Link>
                </div>
              ))}
          </div>
        ),
      )}
      {items[0].releaseNotes && (
        <p className="prose">{items[0].releaseNotes}</p>
      )}
    </section>
  );
  return (
    <main className="page-shell">
      <div className="container">
        <section className="detail-hero">
          <AppIcon name={app.name} iconUrl={app.iconUrl} size={112} />
          <div>
            <h1>{app.name}</h1>
            <span className="verified">
              <ShieldCheck size={16} /> Publié par {app.publisher}
            </span>
            <p>{app.summary}</p>
          </div>
          <div className="detail-action">
            <DownloadButton slug={app.slug} releases={releases} />
          </div>
        </section>
        <ScreenshotGallery
          media={media.filter((item) => item.kind === "screenshot")}
        />
        <div className="detail-content">
          <article>
            <h2>À propos</h2>
            <div className="prose">{app.description || app.summary}</div>
            <h2 id="releases">Versions disponibles</h2>
            <div className="release-list">
              {groups[0] && (
                <>
                  <p className="verified">Version actuelle</p>
                  {renderGroup(groups[0])}
                </>
              )}
              {groups.length > 1 && (
                <details className="release-history">
                  <summary>
                    Voir toutes les versions ({groups.length - 1} précédentes)
                  </summary>
                  {groups.slice(1).map(renderGroup)}
                </details>
              )}
              {!releases.length && (
                <p className="prose">Aucun binaire n’a encore été publié.</p>
              )}
            </div>
          </article>
          <aside>
            <h2>Informations</h2>
            <dl className="info-list">
              <div>
                <dt>Éditeur</dt>
                <dd>{app.publisher}</dd>
              </div>
              <div>
                <dt>Catégorie</dt>
                <dd>{app.category}</dd>
              </div>
              <div>
                <dt>Plateformes</dt>
                <dd>{app.platforms.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Version actuelle</dt>
                <dd>{groups[0]?.[0] ?? "—"}</dd>
              </div>
              <div>
                <dt>Canal courant</dt>
                <dd>
                  {groups[0]?.[1].find(
                    (release) => release.channel === "stable",
                  )?.channel ??
                    groups[0]?.[1][0].channel ??
                    "—"}
                </dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>Publiée</dd>
              </div>
              <div>
                <dt>Intégrité</dt>
                <dd>SHA-256</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
