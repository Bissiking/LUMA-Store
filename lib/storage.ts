import path from "node:path";
import { promises as fs } from "node:fs";
import { config } from "@/lib/config";

const root = path.resolve(config.STORAGE_DIR);

export function artifactPath(storageKey: string) {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-zA-Z0-9._-]+$/.test(storageKey)) throw new Error("Clé de stockage invalide.");
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Chemin de stockage invalide.");
  return resolved;
}

export async function prepareArtifactPath(applicationId: string, releaseId: string, fileName: string) {
  const storageKey = `${applicationId}/${releaseId}/${fileName}`;
  const finalPath = artifactPath(storageKey);
  await fs.mkdir(path.dirname(finalPath), { recursive: true, mode: 0o750 });
  return { storageKey, finalPath, tempPath: `${finalPath}.uploading` };
}

export async function removeArtifact(storageKey: string | null) {
  if (!storageKey) return;
  await fs.unlink(artifactPath(storageKey)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
