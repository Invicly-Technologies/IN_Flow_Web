import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * No object-storage service (S3/R2/etc.) is configured for this deployment,
 * so attachments are written straight to public/uploads and served as static
 * files by Next — fine for a single-instance deploy, not for a horizontally
 * scaled one. Swap this module out first if that ever changes.
 */
export async function saveUploadedFile(file: File): Promise<{ storageKey: string; sizeBytes: number }> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("File exceeds the 15MB attachment limit");
  }
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name).slice(0, 20);
  const key = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, key), buffer);

  return { storageKey: `/uploads/${key}`, sizeBytes: buffer.byteLength };
}

export async function deleteUploadedFile(storageKey: string): Promise<void> {
  if (!storageKey.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_DIR, storageKey.replace("/uploads/", ""));
  await unlink(filePath).catch(() => {});
}
