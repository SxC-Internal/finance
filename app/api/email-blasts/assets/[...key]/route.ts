import { NextRequest, NextResponse } from "next/server";
import { readStoredFileBuffer } from "@/lib/server/file-storage";
import { extname } from "path";

const MIME_BY_EXT: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".csv": "text/csv",
    ".txt": "text/plain",
};

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await context.params;
        const storageKey = key.join("/");
        const file = await readStoredFileBuffer(storageKey);
        const extension = extname(storageKey).toLowerCase();
        const contentType = MIME_BY_EXT[extension] ?? "application/octet-stream";

        return new NextResponse(new Uint8Array(file), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=600",
            },
        });
    } catch {
        return NextResponse.json({ success: false, data: null, error: "Asset not found" }, { status: 404 });
    }
}
