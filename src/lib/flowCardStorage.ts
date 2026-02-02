import { getSupabase } from "@/lib/supabaseClient";

const SUPABASE_BUCKET_ID = "flow-attachments";
const GOOGLE_DRIVE_BUCKET_ID = "google-drive";

function safeFileName(name: string) {
  // Keeps extensions, removes path separators and trims.
  return name
    .split("/")
    .pop()
    ?.split("\\")
    .pop()
    ?.trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .slice(0, 180) || "file";
}

export async function uploadFlowCardFile(args: {
  flowCardId: string;
  file: File;
}): Promise<{ bucketId: string; objectPath: string; publicUrl: string }>
{
  const supabase = getSupabase();

  const fileName = safeFileName(args.file.name);
  const form = new FormData();
  form.set("file", args.file, fileName);
  form.set("flowCardId", args.flowCardId);

  const { data, error } = await supabase.functions.invoke("drive-upload", {
    body: form,
  });

  if (error) throw error;
  if (!data?.publicUrl || !data?.objectPath) {
    throw new Error("Falha ao fazer upload no Google Drive");
  }

  return {
    bucketId: GOOGLE_DRIVE_BUCKET_ID,
    objectPath: String(data.objectPath),
    publicUrl: String(data.publicUrl),
  };
}

export async function deleteFlowCardObjects(
  objects: Array<{ bucketId: string; objectPath: string }>
): Promise<void> {
  if (!objects.length) return;
  const supabase = getSupabase();

  const supabasePaths = objects
    .filter((o) => o.bucketId === SUPABASE_BUCKET_ID)
    .map((o) => o.objectPath);

  if (supabasePaths.length) {
    // Supabase accepts an array of paths; keep it chunked for safety.
    const CHUNK = 100;
    for (let i = 0; i < supabasePaths.length; i += CHUNK) {
      const batch = supabasePaths.slice(i, i + CHUNK);
      const { error } = await supabase.storage.from(SUPABASE_BUCKET_ID).remove(batch);
      if (error) throw error;
    }
  }

  const driveFileIds = objects
    .filter((o) => o.bucketId === GOOGLE_DRIVE_BUCKET_ID)
    .map((o) => o.objectPath)
    .filter(Boolean);

  if (driveFileIds.length) {
    const { error } = await supabase.functions.invoke("drive-delete", {
      body: { fileIds: driveFileIds },
    });
    if (error) throw error;
  }
}
