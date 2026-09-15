import AlbumForm from "../AlbumForm";
import styles from "@/styles/Admin.module.css";

export default function NewAlbumPage() {
  return (
    <main>
      <p className={styles.label}>Work</p>
      <h1 className={styles.title}>New set</h1>
      <AlbumForm />
    </main>
  );
}
