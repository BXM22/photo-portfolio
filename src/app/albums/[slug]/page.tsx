import { notFound } from "next/navigation";
import { getAlbumBySlug } from "@/lib/queries";
import PhotoGrid from "@/components/PhotoGrid";

// LEARNING NOTE: `params` is also a Promise here, same reasoning as
// `searchParams` on the home page — see src/app/page.tsx's comment.
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  // `notFound()` immediately renders the nearest `not-found.tsx` (or
  // Next's default 404 page if you haven't added one) and stops executing
  // the rest of this component — the idiomatic way to handle "this
  // resource doesn't exist" in a Server Component.
  if (!album) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{album.title}</h1>
        {album.description && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{album.description}</p>
        )}
      </div>
      <PhotoGrid photos={album.photos} />
    </div>
  );
}
