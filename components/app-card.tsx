import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { StoreApplication } from "@/lib/types";
import { AppIcon } from "@/components/app-icon";

const platformLabel = { windows: "Win", macos: "Mac", linux: "Linux", android: "APK" };

export function AppCard({ app }: { app: StoreApplication }) {
  return (
    <Link href={`/apps/${app.slug}`} className="app-card">
      <div className="app-card-top">
        <AppIcon name={app.name} iconUrl={app.iconUrl} />
        <div><h3>{app.name}</h3><span className="publisher">{app.publisher}</span></div>
        <ChevronRight size={19} color="#8a8b9a" aria-hidden="true" />
      </div>
      <p>{app.summary}</p>
      <div className="app-card-meta">
        <span className="platforms">
          {app.platforms.length ? app.platforms.map((platform) => <span className="platform-tag" key={platform}>{platformLabel[platform]}</span>) : <span className="platform-tag">Bientôt</span>}
        </span>
        <span>{app.latestVersion ?? "Aucune version"}</span>
      </div>
    </Link>
  );
}
