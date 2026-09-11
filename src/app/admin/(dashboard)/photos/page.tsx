import { getPhotos } from "@/lib/queries";
import PhotoAdminRow from "@/components/admin/PhotoAdminRow";

export default async function ManagePhotosPage() {
  const photos = await getPhotos();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Manage photos</h1>
      {photos.length === 0 ? (
        <p className="text-neutral-500">No photos yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-500 dark:border-neutral-700">
                <th className="py-2 pr-4 font-medium">Photo</th>
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Album</th>
                <th className="py-2 pr-4 font-medium">Tags</th>
                <th className="py-2 pr-4 font-medium">Featured</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {photos.map((photo) => (
                <PhotoAdminRow key={photo.id} photo={photo} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
