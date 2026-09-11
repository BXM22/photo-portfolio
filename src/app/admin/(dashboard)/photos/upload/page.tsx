import { prisma } from "@/lib/prisma";
import UploadForm from "@/components/admin/UploadForm";

export default async function UploadPage() {
  const albums = await prisma.album.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Upload photos</h1>
      <UploadForm albums={albums} />
    </div>
  );
}
