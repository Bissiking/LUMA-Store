import Image from "next/image";

const colors = ["#ebeaff", "#e5f6ef", "#fff0e7", "#e8f1ff", "#f5e9ff", "#fff3d5"];

export function AppIcon({ name, iconUrl, size = 64 }: { name: string; iconUrl?: string | null; size?: number }) {
  const color = colors[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
  return (
    <span className="app-icon" style={{ "--icon-bg": color, width: size, height: size } as React.CSSProperties} aria-hidden="true">
      {iconUrl ? <Image src={iconUrl} alt="" width={size} height={size} unoptimized /> : <Image className="placeholder-art" src="/luma-store-logo.png" alt="" width={size} height={size} />}
    </span>
  );
}
