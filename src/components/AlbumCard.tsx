import Image from "next/image";
import Link from "next/link";
import type { ShapedAlbum } from "@/lib/queries";

export default function AlbumCard({ album }: { album: ShapedAlbum }) {
  return (
    <Link
      href={`/albums/${album.slug}`}
      className="group block overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-200 dark:bg-neutral-800">
        {album.coverUrl && (
          <Image
            src={album.coverUrl}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium">{album.title}</h3>
        <p className="text-sm text-neutral-500">
          {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
        </p>
      </div>
    </Link>
  );
}
