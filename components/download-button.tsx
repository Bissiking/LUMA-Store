"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Laptop, Boxes, Terminal, Smartphone } from "lucide-react";
import type { Platform, Architecture, Release } from "@/lib/types";
import { detectPlatform, matchRelease } from "@/lib/os-detect";

const platformIcons: Record<Platform, typeof Laptop> = {
  windows: Laptop,
  macos: Boxes,
  linux: Terminal,
  android: Smartphone
};

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android"
};

interface DownloadButtonProps {
  slug: string;
  releases: Release[];
}

const subscribeToUserAgent = () => () => {};
const getBrowserUserAgent = () => navigator.userAgent;
const getServerUserAgent = () => null;

export function DownloadButton({ slug, releases }: DownloadButtonProps) {
  const [selected, setSelected] = useState<Platform | null>(null);
  const userAgent = useSyncExternalStore(subscribeToUserAgent, getBrowserUserAgent, getServerUserAgent);
  const detectionComplete = userAgent !== null;
  const clientDetected: { platform: Platform; architecture: Architecture } | null = detectPlatform(userAgent);

  const active = selected ?? clientDetected?.platform ?? null;
  const architecture = selected ? null : clientDetected?.architecture ?? null;

  const release = active
    ? matchRelease(releases, active, architecture)
    : null;

  const availablePlatforms = [...new Set(releases
    .filter((r) => r.status === "published" && r.channel === "stable")
    .map((r) => r.platform))];

  if (availablePlatforms.length === 0) {
    return <button className="button button-secondary" disabled>Pas encore disponible</button>;
  }

  if (!detectionComplete) {
    return (
      <div className="download-section">
        <a className="button button-primary download-main" href={`/api/v1/apps/${slug}/download`}>
          <Download size={18} /> Télécharger automatiquement
        </a>
        <span className="download-hint">Détection de votre système…</span>
      </div>
    );
  }

  if (!clientDetected || !release) {
    return (
      <div className="download-section" aria-live="polite">
        <p className="download-hint">
          {clientDetected
            ? `Aucun package compatible détecté pour ${platformLabels[clientDetected.platform]}. Choisissez une plateforme.`
            : "Système non identifié. Choisissez votre plateforme."}
        </p>
        <div className="platform-selector" role="radiogroup" aria-label="Choisir une plateforme">
          {availablePlatforms.map((platform) => {
            const Icon = platformIcons[platform];
            return (
              <button
                key={platform}
                className={`platform-option ${selected === platform ? "platform-option-active" : ""}`}
                onClick={() => setSelected(platform)}
                type="button"
                role="radio"
                aria-checked={selected === platform}
              >
                <Icon size={16} />
                {platformLabels[platform]}
              </button>
            );
          })}
        </div>
        {selected && release ? (
          <a className="button button-primary download-main" href={`/api/v1/apps/${slug}/download?platform=${selected}`}>
            <Download size={18} /> Télécharger pour {platformLabels[selected]} {release.version}
          </a>
        ) : (
          <a className="button button-secondary" href="#releases">Voir toutes les versions</a>
        )}
      </div>
    );
  }

  return (
    <div className="download-section">
      <a className="button button-primary download-main" href={`/api/v1/apps/${slug}/download`}>
        <Download size={18} /> Télécharger {release.version} pour {platformLabels[active!]}
      </a>
      <a className="link-subtle" href="#releases">Ou choisir une autre version</a>
    </div>
  );
}
