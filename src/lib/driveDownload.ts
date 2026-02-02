import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseClient";

export async function downloadDriveFile(args: {
  accessToken: string;
  fileId: string;
  fileName: string;
}): Promise<void> {
  const url = `${SUPABASE_URL}/functions/v1/drive-download?fileId=${encodeURIComponent(args.fileId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${args.accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Falha ao baixar arquivo [${res.status}]: ${txt}`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = args.fileName || "arquivo";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
