import { notFound } from "next/navigation";
import AlbumForm from "../AlbumForm";
import { getAlbumById } from "@/lib/queries";
import styles from "@/styles/Admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbumById(id);
  if (!album) notFound();

  return (
    <main>
      <p className={styles.label}>Work</p>
      <h1 className={styles.title}>Edit set</h1>
      <AlbumForm
        albumId={album.id}
        title={album.title}
        year={album.year}
        photos={album.photos}
      />
    </main>
  );
}
