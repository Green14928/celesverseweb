import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getSession } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB，非 GIF 會在上傳前壓縮
const MAX_GIF_SIZE = 4 * 1024 * 1024; // 動態 GIF 不壓縮，維持較小上限

export async function POST(request: NextRequest) {
  const adminId = await getSession();
  if (!adminId) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "未提供檔案" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "不支援的檔案格式，僅接受 JPG、PNG、WebP、GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE || (file.type === "image/gif" && file.size > MAX_GIF_SIZE)) {
    return NextResponse.json(
      { error: "檔案大小超過上限，請先壓縮圖片" },
      { status: 400 }
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === "image/gif";
  const body = isGif
    ? input
    : await sharp(input)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

  const ext = isGif ? file.name.split(".").pop() || "gif" : "webp";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  try {
    const blob = await put(`uploads/${filename}`, body, {
      access: "public",
      contentType: isGif ? file.type : "image/webp",
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      { error: "圖片儲存失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
