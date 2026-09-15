import Link from "next/link";
import AlbumList from "./AlbumList";
import { listAlbums } from "@/lib/queries";
import styles from "@/styles/Admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const albums = await listAlbums();

  return (
    <main>
      <p className={styles.label}>Work</p>
      <h1 className={styles.title}>Sets</h1>
      <p>
        <Link className={styles.button} href="/admin/new">
          New set
        </Link>
      </p>
      {albums.length === 0 ? (
        <p className={styles.rowMeta}>No sets yet.</p>
      ) : (
        <AlbumList albums={albums} />
      )}
    </main>
  );
}
