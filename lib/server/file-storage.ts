import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const LOCAL_ROOT = process.env.EMAIL_BLAST_STORAGE_LOCAL_ROOT ?? path.join(process.cwd(), ".tmp", "email-blast-uploads");

export interface StoredFileResult {
    storageKey: string;
    checksumSha256: string;
    sizeBytes: number;
    publicUrl?: string;
}

function normalizeFilename(filename: string): string {
    const base = path.basename(filename).trim().replace(/\s+/g, "-");
    return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "file";
}

function toAbsolutePath(storageKey: string): string {
    const normalized = storageKey.replace(/\\/g, "/");
    const fullPath = path.resolve(LOCAL_ROOT, normalized);
    const resolvedRoot = path.resolve(LOCAL_ROOT);
    const relative = path.relative(resolvedRoot, fullPath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error("Validation failed: invalid storage key path");
    }

    return fullPath;
}

function buildPublicUrl(storageKey: string, explicitBaseUrl?: string): string | undefined {
    const baseUrl = explicitBaseUrl ?? process.env.EMAIL_BLAST_PUBLIC_BASE_URL;
    if (!baseUrl) return undefined;

    const encoded = storageKey
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    return `${baseUrl.replace(/\/$/, "")}/api/email-blasts/assets/${encoded}`;
}

export async function saveUploadForBlast(
    blastId: string,
    filename: string,
    data: Buffer,
    publicBaseUrl?: string
): Promise<StoredFileResult> {
    const safeName = normalizeFilename(filename);
    const storageKey = ["blasts", blastId, `${randomUUID()}-${safeName}`].join("/");
    const targetPath = toAbsolutePath(storageKey);

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, data);

    return {
        storageKey,
        checksumSha256: createHash("sha256").update(data).digest("hex"),
        sizeBytes: data.byteLength,
        publicUrl: buildPublicUrl(storageKey, publicBaseUrl),
    };
}

export async function readStoredFileBuffer(storageKey: string): Promise<Buffer> {
    const targetPath = toAbsolutePath(storageKey);
    return fs.readFile(targetPath);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
    const targetPath = toAbsolutePath(storageKey);
    await fs.rm(targetPath, { force: true });
}

export async function statStoredFile(storageKey: string): Promise<{ sizeBytes: number }> {
    const targetPath = toAbsolutePath(storageKey);
    const stats = await fs.stat(targetPath);
    return { sizeBytes: stats.size };
}
