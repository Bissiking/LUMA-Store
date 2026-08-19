import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { ReleaseManager } from "@/components/release-manager";
import { getApplicationById, listReleases } from "@/lib/store";
import { uuidSchema } from "@/lib/validation";

export default async function EditApplication({ params }: { params: Promise<{ id: string }> }) {
  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const app = await getApplicationById(id.data);
  if (!app) notFound();
  const releases = await listReleases(app.id, false);
  return <><div className="admin-heading"><div><h1>{app.name}</h1><p>Modifiez la fiche et gérez la rétention de ses versions.</p></div></div><ApplicationForm app={app} /><ReleaseManager initialReleases={releases.filter((release) => release.status === "published")} /></>;
}
