import { supabase, cloudEnabled } from "@/database/supabase";
export async function uploadFile(file: File, userId: string): Promise<string> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Files must be smaller than 5 MB.");
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type))
    throw new Error("Choose a PNG, JPG, or PDF file.");
  if (!cloudEnabled) {
    if (file.size > 700000)
      throw new Error(
        "Demo uploads must be smaller than 700 KB. Supabase supports files up to 5 MB.",
      );
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }
  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : "pdf";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase()
    .storage.from("bank-files")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error("Could not upload file. Please try again.");
  return path;
}
export async function fileUrl(path: string) {
  if (
    path.startsWith("data:image/png;") ||
    path.startsWith("data:image/jpeg;") ||
    path.startsWith("data:application/pdf;")
  )
    return path;
  const { data, error } = await supabase()
    .storage.from("bank-files")
    .createSignedUrl(path, 120);
  if (error)
    throw new Error("File is unavailable or you do not have permission.");
  return data.signedUrl;
}
