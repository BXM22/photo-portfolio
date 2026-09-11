import { getPhotos, getTags } from "@/lib/queries";
import PhotoGrid from "@/components/PhotoGrid";
import { notFound } from "next/navigation";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tags, photos] = await Promise.all([getTags(), getPhotos({ tag: slug })]);
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">#{tag.name}</h1>
      <PhotoGrid photos={photos} />
    </div>
  );
}
