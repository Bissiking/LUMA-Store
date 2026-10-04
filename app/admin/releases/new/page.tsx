import { ReleaseForm } from "@/components/release-form";
import { listApplications } from "@/lib/store";

export default async function NewRelease({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const apps = await listApplications({ publicOnly: false });
  const requestedId = (await searchParams).applicationId;
  const selected = apps.find(
    (app) => app.id === requestedId && app.status !== "retired",
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Publier une version</h1>
          <p>
            Le fichier est contrôlé en flux et son empreinte calculée avant
            publication.
          </p>
        </div>
      </div>
      <ReleaseForm
        applicationId={selected?.id}
        apps={apps
          .filter((app) => app.status !== "retired")
          .map(({ id, name }) => ({ id, name }))}
      />
    </>
  );
}
