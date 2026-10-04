import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { ApplicationSettings } from "@/components/application-settings";
import { ReleaseManager } from "@/components/release-manager";
import { MediaManager } from "@/components/media-manager";
import { getApplicationById, listReleases } from "@/lib/store";
import { listMedia } from "@/lib/media";
import { uuidSchema } from "@/lib/validation";
export default async function EditApplication({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const app = await getApplicationById(id.data);
  if (!app) notFound();
  const tab = (await searchParams).tab ?? "overview";
  return (
    <>
      <div className="admin-heading">
        <div>
          <p>
            <Link href="/admin/apps">Applications</Link> / {app.name}
          </p>
          <h1>{app.name}</h1>
        </div>
        <Link className="button button-secondary" href={`/apps/${app.slug}`}>
          Voir sur le Store
        </Link>
      </div>
      <nav className="application-tabs" aria-label="Gestion de l’application">
        {[
          ["overview", "Aperçu"],
          ["versions", "Versions"],
          ["media", "Médias"],
          ["settings", "Paramètres"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/apps/${app.id}?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "overview" && <ApplicationForm app={app} />}
      {tab === "versions" && (
        <>
          <Link
            className="button button-primary"
            href={`/admin/releases/new?applicationId=${app.id}`}
          >
            Publier une version
          </Link>
          <ReleaseManager initialReleases={await listReleases(app.id, false)} />
        </>
      )}
      {tab === "media" && (
        <MediaManager
          applicationId={app.id}
          initialMedia={await listMedia(app.id)}
        />
      )}
      {tab === "settings" && (
        <>
          <h2>Paramètres de l’application</h2>
          <ApplicationSettings app={app} />
        </>
      )}
    </>
  );
}
