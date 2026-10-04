"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ApplicationMedia } from "@/lib/types";

export function ScreenshotGallery({ media }: { media: ApplicationMedia[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ApplicationMedia | null>(null);
  if (!media.length) return null;
  return (
    <section>
      <h2>Captures d’écran</h2>
      <div className="screenshot-rail">
        {media.map((item, index) => (
          <figure key={item.id}>
            <button
              type="button"
              onClick={() => {
                setSelected(item);
                dialog.current?.showModal();
              }}
              aria-label={`Agrandir ${item.caption || `la capture ${index + 1}`}`}
            >
              <Image
                src={item.url}
                alt={item.caption || `Capture ${index + 1}`}
                width={item.width}
                height={item.height}
                unoptimized
              />
            </button>
            <figcaption>
              {item.caption}
              {item.platform && ` · ${item.platform}`}
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog ref={dialog} className="screenshot-dialog">
        <button
          className="button button-secondary"
          autoFocus
          onClick={() => dialog.current?.close()}
        >
          Fermer
        </button>
        {selected && (
          <Image
            src={selected.url}
            alt={selected.caption || "Capture agrandie"}
            width={selected.width}
            height={selected.height}
            unoptimized
          />
        )}
      </dialog>
    </section>
  );
}
