import Link from "next/link";
import { getAlbums } from "@/lib/queries";
import AlbumAdminRow from "@/components/admin/AlbumAdminRow";

export default async function ManageAlbumsPage() {
  const albums = await getAlbums();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage albums</h1>
        <Link
          href="/admin/albums/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          New album
        </Link>
      </div>
      {albums.length === 0 ? (
        <p className="text-neutral-500">No albums yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-neutral-500 dark:border-neutral-700">
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">Photos</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((album) => (
              <AlbumAdminRow key={album.id} album={album} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
