import { z } from "zod";

export const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const uuidSchema = z.string().uuid();

export const applicationInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  summary: z.string().trim().min(10).max(180),
  description: z.string().trim().max(20_000).default(""),
  publisher: z.string().trim().min(1).max(120).default("LUMA"),
  category: z.string().trim().min(2).max(60).default("Outils"),
  iconUrl: z.string().url().max(2_000).nullable().optional(),
  websiteUrl: z.string().url().max(2_000).nullable().optional(),
  repositoryUrl: z.string().url().max(2_000).nullable().optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(["draft", "published", "retired"]).default("draft")
});

export const releaseInput = z.object({
  applicationId: uuidSchema,
  version: z.string().trim().min(1).max(64).regex(/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  channel: z.enum(["stable", "beta", "nightly"]).default("stable"),
  platform: z.enum(["windows", "macos", "linux", "android"]),
  architecture: z.enum(["x64", "arm64", "universal"]).default("universal"),
  packageType: z.enum(["apk", "exe", "msi", "dmg", "deb", "rpm", "appimage", "tar.gz", "zip"]),
  minimumOs: z.string().trim().max(80).nullable().optional(),
  releaseNotes: z.string().trim().max(40_000).default(""),
  isProtected: z.boolean().default(false)
});

const extensionByType: Record<string, string[]> = {
  apk: [".apk"], exe: [".exe"], msi: [".msi"], dmg: [".dmg"], deb: [".deb"], rpm: [".rpm"],
  appimage: [".appimage"], "tar.gz": [".tar.gz", ".tgz"], zip: [".zip"]
};

export function validateArtifactName(fileName: string, packageType: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
  if (!safe || safe.startsWith(".")) throw new Error("Nom de fichier invalide.");
  if (!(extensionByType[packageType] ?? []).some((extension) => safe.toLowerCase().endsWith(extension))) {
    throw new Error(`L'extension ne correspond pas au format ${packageType}.`);
  }
  return safe;
}

const signatures: Record<string, number[][]> = {
  apk: [[0x50, 0x4b, 0x03, 0x04]],
  zip: [[0x50, 0x4b, 0x03, 0x04]],
  exe: [[0x4d, 0x5a]],
  msi: [[0xd0, 0xcf, 0x11, 0xe0]],
  deb: [[0x21, 0x3c, 0x61, 0x72, 0x63, 0x68, 0x3e, 0x0a]],
  rpm: [[0xed, 0xab, 0xee, 0xdb]],
  appimage: [[0x7f, 0x45, 0x4c, 0x46]],
  "tar.gz": [[0x1f, 0x8b]]
};

export function validateArtifactMagic(bytes: Buffer, packageType: string) {
  const expected = signatures[packageType];
  if (!expected) return true; // DMG ne possède pas de signature fiable en tête de fichier.
  return expected.some((signature) => signature.every((value, index) => bytes[index] === value));
}
