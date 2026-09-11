import { getAlbums } from "@/lib/queries";
import AlbumCard from "@/components/AlbumCard";

export default async function AlbumsPage() {
  const albums = await getAlbums();

  if (albums.length === 0) {
    return <p className="py-16 text-center text-neutral-500">No albums yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}
