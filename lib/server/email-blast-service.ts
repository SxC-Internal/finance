import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { isFinanceManager } from "@/lib/finance";
import { DB_EMAIL_BLAST_ATTACHMENTS, DB_EMAIL_BLASTS, DB_EMAIL_BLAST_RECIPIENTS } from "@/constants";
import type {
    DbEmailBlast,
    DbEmailBlastAttachment,
    DbEmailBlastRecipient,
    EmailBlastAttachmentKind,
    User,
} from "@/types";
import { deleteStoredFile, saveUploadForBlast } from "@/lib/server/file-storage";

const emailSchema = z.string().trim().email();

export const createBlastSchema = z.object({
    subject: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(10000).refine((val) => {
        const tokens = val.match(/<<[^>]+>>/g) || [];
        return tokens.every((t) => /^<<[A-Z0-9_]+>>$/.test(t));
    }, { message: "Body contains invalid placeholders. Use format <<TOKEN_NAME>> (uppercase A-Z, 0-9, and underscore only)." }),
    contentMode: z.enum(["text", "html"]).default("text"),
    senderName: z.string().trim().min(1).max(120).optional(),
    senderEmail: z.string().trim().email().optional(),
    replyToEmail: z.string().trim().email().optional(),
    departmentId: z.string().trim().min(1),
    recipients: z.array(emailSchema).min(1),
    saveAsDraft: z.boolean().optional().default(true),
});

export const updateDraftSchema = z.object({
    blastId: z.string().trim().min(1),
    subject: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(10000).refine((val) => {
        const tokens = val.match(/<<[^>]+>>/g) || [];
        return tokens.every((t) => /^<<[A-Z0-9_]+>>$/.test(t));
    }, { message: "Body contains invalid placeholders. Use format <<TOKEN_NAME>> (uppercase A-Z, 0-9, and underscore only)." }),
    contentMode: z.enum(["text", "html"]).default("text"),
    senderName: z.string().trim().min(1).max(120).optional(),
    senderEmail: z.string().trim().email().optional(),
    replyToEmail: z.string().trim().email().optional(),
    recipients: z.array(emailSchema).min(1),
});

export const submitSchema = z.object({
    blastId: z.string().trim().min(1),
});

export const rejectSchema = z.object({
    blastId: z.string().trim().min(1),
    reason: z.string().trim().min(3).max(500),
});

export const blastIdSchema = z.object({
    blastId: z.string().trim().min(1),
});

export const EMAIL_BLAST_ATTACHMENT_LIMITS = {
    maxFilesPerBlast: 5,
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxTotalBytes: 20 * 1024 * 1024,
} as const;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
]);

const ALLOWED_FILE_MIME_TYPES = new Set([
    ...ALLOWED_IMAGE_MIME_TYPES,
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/csv",
    "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".pdf",
    ".docx",
    ".xlsx",
    ".pptx",
    ".csv",
    ".txt",
]);

type BlastWithRecipients = {
    id: string;
    subject: string;
    body: string;
    contentMode: string;
    senderName: string | null;
    senderEmail: string | null;
    replyToEmail: string | null;
    status: "draft" | "pending_approval" | "approved" | "rejected" | "sent";
    composedBy: string;
    approvedBy: string | null;
    rejectedBy: string | null;
    rejectionReason: string | null;
    sentAt: Date | null;
    sentCount: number;
    departmentId: string;
    isArchived: boolean;
    createdAt: Date;
    recipients: Array<{
        id: string;
        blastId: string;
        email: string;
    }>;
};

type BlastAttachmentRecord = {
    id: string;
    blastId: string;
    kind: string;
    storageKey: string;
    publicUrl: string | null;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    uploadedBy: string;
    createdAt: Date;
};

type EmailBlastMemoryStore = {
    blasts: DbEmailBlast[];
    recipients: DbEmailBlastRecipient[];
    attachments: DbEmailBlastAttachment[];
};

const initialMemoryStore: EmailBlastMemoryStore = {
    blasts: DB_EMAIL_BLASTS.map((blast) => ({ ...blast })),
    recipients: DB_EMAIL_BLAST_RECIPIENTS.map((recipient) => ({ ...recipient })),
    attachments: DB_EMAIL_BLAST_ATTACHMENTS.map((attachment) => ({ ...attachment })),
};

let memoryStore: EmailBlastMemoryStore = {
    blasts: initialMemoryStore.blasts,
    recipients: initialMemoryStore.recipients,
    attachments: initialMemoryStore.attachments,
};

let loggedPrismaFallback = false;
let nextPrismaRetryAt = 0;
const PRISMA_RETRY_BACKOFF_MS = 15_000;
const allowMemoryFallback =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_EMAIL_BLAST_MEMORY_FALLBACK === "true";

function toBlastDto(blast: BlastWithRecipients): DbEmailBlast {
    return {
        id: blast.id,
        subject: blast.subject,
        body: blast.body,
        contentMode: blast.contentMode as "text" | "html",
        senderName: blast.senderName ?? undefined,
        senderEmail: blast.senderEmail ?? undefined,
        replyToEmail: blast.replyToEmail ?? undefined,
        status: blast.status,
        composedBy: blast.composedBy,
        approvedBy: blast.approvedBy ?? undefined,
        rejectedBy: blast.rejectedBy ?? undefined,
        rejectionReason: blast.rejectionReason ?? undefined,
        sentAt: blast.sentAt?.toISOString(),
        sentCount: blast.sentCount,
        departmentId: blast.departmentId,
        createdAt: blast.createdAt.toISOString(),
        isArchived: blast.isArchived,
    };
}

function toRecipientDtos(blast: BlastWithRecipients): DbEmailBlastRecipient[] {
    return blast.recipients.map((recipient) => ({
        id: recipient.id,
        blastId: recipient.blastId,
        email: recipient.email,
    }));
}

function toAttachmentDto(attachment: BlastAttachmentRecord): DbEmailBlastAttachment {
    return {
        id: attachment.id,
        blastId: attachment.blastId,
        kind: attachment.kind as EmailBlastAttachmentKind,
        storageKey: attachment.storageKey,
        publicUrl: attachment.publicUrl ?? undefined,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        checksumSha256: attachment.checksumSha256,
        uploadedBy: attachment.uploadedBy,
        createdAt: attachment.createdAt.toISOString(),
    };
}

function getAttachmentKindFromMime(mimeType: string): EmailBlastAttachmentKind {
    return ALLOWED_IMAGE_MIME_TYPES.has(mimeType) ? "image" : "file";
}

function getExtension(filename: string): string {
    const index = filename.lastIndexOf(".");
    if (index <= 0) return "";
    return filename.slice(index).toLowerCase();
}

function normalizeAttachmentFilename(filename: string): string {
    const normalized = filename.trim().replace(/\s+/g, " ");
    return normalized.slice(0, 160);
}

function validateAttachmentInput(filename: string, mimeType: string, sizeBytes: number): void {
    const safeFilename = normalizeAttachmentFilename(filename);
    if (!safeFilename) {
        throw new Error("Validation failed: filename is required");
    }

    if (sizeBytes <= 0) {
        throw new Error("Validation failed: zero-byte files are not allowed");
    }

    if (sizeBytes > EMAIL_BLAST_ATTACHMENT_LIMITS.maxFileSizeBytes) {
        throw new Error("Payload too large: file exceeds 10 MB limit");
    }

    if (!ALLOWED_FILE_MIME_TYPES.has(mimeType)) {
        throw new Error(`Unsupported media type: ${mimeType}`);
    }

    if (!ALLOWED_EXTENSIONS.has(getExtension(safeFilename))) {
        throw new Error("Unsupported media type: file extension is not allowed");
    }
}

function ensureDepartmentAccess(user: User, departmentId: string): void {
    if (user.role === "admin") return;
    const userDepartmentId = user.departmentId ?? `d_${user.role}`;
    if (userDepartmentId !== departmentId) {
        throw new Error("Forbidden: cross-department access is not allowed");
    }
}

function ensureManager(user: User): void {
    if (user.role === "admin") return;
    if (!isFinanceManager(user)) {
        throw new Error("Forbidden: manager role required");
    }
}

function isPrismaConnectionError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return true;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
        return true;
    }

    return error instanceof Error && error.message.includes("Can't reach database server");
}

export function isFallbackActive(): boolean {
    return allowMemoryFallback && nextPrismaRetryAt > 0 && Date.now() < nextPrismaRetryAt;
}

async function withPrismaFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => T | Promise<T>
): Promise<T> {
    if (allowMemoryFallback && Date.now() < nextPrismaRetryAt) {
        return await fallbackOperation();
    }

    try {
        const result = await operation();
        nextPrismaRetryAt = 0;
        return result;
    } catch (error) {
        if (!isPrismaConnectionError(error)) {
            throw error;
        }

        if (!allowMemoryFallback) {
            throw new Error("Service unavailable: email blast database is unreachable");
        }

        nextPrismaRetryAt = Date.now() + PRISMA_RETRY_BACKOFF_MS;

        if (!loggedPrismaFallback) {
            loggedPrismaFallback = true;
            console.warn("[email-blast] Prisma unavailable, using in-memory fallback store for local development");
        }

        return await fallbackOperation();
    }
}

function makeMemoryId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getMemoryBlastOrThrow(blastId: string): DbEmailBlast {
    const blast = memoryStore.blasts.find((item) => item.id === blastId);
    if (!blast) {
        throw new Error(
            "Service unavailable: blast is not available in fallback store while database is unreachable"
        );
    }
    return blast;
}

function getMemoryRecipientsForBlast(blastId: string): DbEmailBlastRecipient[] {
    return memoryStore.recipients
        .filter((recipient) => recipient.blastId === blastId)
        .sort((a, b) => a.email.localeCompare(b.email));
}

function getMemoryAttachmentsForBlast(blastId: string): DbEmailBlastAttachment[] {
    return memoryStore.attachments
        .filter((attachment) => attachment.blastId === blastId)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function listEmailBlastsFromMemory(departmentId: string): { blasts: DbEmailBlast[]; recipients: DbEmailBlastRecipient[] } {
    const blasts = memoryStore.blasts
        .filter((blast) => blast.departmentId === departmentId && !blast.isArchived)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const blastIds = new Set(blasts.map((blast) => blast.id));
    const recipients = memoryStore.recipients.filter((recipient) => blastIds.has(recipient.blastId));

    return {
        blasts,
        recipients,
    };
}

function createEmailBlastInMemory(input: z.infer<typeof createBlastSchema>, user: User): DbEmailBlast {
    const status = input.saveAsDraft ? "draft" : "pending_approval";
    const uniqueRecipients = Array.from(new Set(input.recipients.map((email) => email.trim().toLowerCase())));

    if (uniqueRecipients.length === 0) {
        throw new Error("Validation failed: at least one recipient is required");
    }

    const createdAt = new Date().toISOString();
    const blastId = makeMemoryId("eb");

    const newBlast: DbEmailBlast = {
        id: blastId,
        subject: input.subject,
        body: input.body,
        contentMode: input.contentMode as "text" | "html",
        senderName: input.senderName,
        senderEmail: input.senderEmail?.toLowerCase(),
        replyToEmail: input.replyToEmail?.toLowerCase(),
        status,
        composedBy: user.id,
        sentCount: 0,
        departmentId: input.departmentId,
        createdAt,
        isArchived: false,
    };

    const newRecipients = uniqueRecipients.map((email) => ({
        id: makeMemoryId("ebr"),
        blastId,
        email,
    }));

    memoryStore = {
        blasts: [newBlast, ...memoryStore.blasts],
        recipients: [...memoryStore.recipients, ...newRecipients],
        attachments: memoryStore.attachments,
    };

    return newBlast;
}

export async function updateEmailBlastDraft(input: z.infer<typeof updateDraftSchema>, user: User): Promise<DbEmailBlast> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(input.blastId);
            ensureDepartmentAccess(user, blast.departmentId);

            if (blast.composedBy !== user.id && user.role !== "admin") {
                throw new Error("Forbidden: only the composer can edit this blast");
            }

            if (blast.status !== "draft") {
                throw new Error("Invalid transition: only draft blasts can be edited");
            }

            const uniqueRecipients = Array.from(new Set(input.recipients.map((email) => email.trim().toLowerCase())));

            const updated = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: {
                    subject: input.subject,
                    body: input.body,
                    contentMode: input.contentMode,
                    senderName: input.senderName,
                    senderEmail: input.senderEmail?.toLowerCase(),
                    replyToEmail: input.replyToEmail?.toLowerCase(),
                    recipients: {
                        deleteMany: {},
                        create: uniqueRecipients.map((email) => ({ email })),
                    },
                },
                include: { recipients: true },
            });

            return toBlastDto(updated as BlastWithRecipients);
        },
        async () => {
            const blast = getMemoryBlastOrThrow(input.blastId);
            ensureDepartmentAccess(user, blast.departmentId);

            if (blast.composedBy !== user.id && user.role !== "admin") {
                throw new Error("Forbidden: only the composer can edit this blast");
            }

            if (blast.status !== "draft") {
                throw new Error("Invalid transition: only draft blasts can be edited");
            }

            const uniqueRecipients = Array.from(new Set(input.recipients.map((email) => email.trim().toLowerCase())));

            memoryStore = {
                blasts: memoryStore.blasts.map((current) => (
                    current.id === input.blastId
                        ? {
                            ...current,
                            subject: input.subject,
                            body: input.body,
                            contentMode: input.contentMode,
                            senderName: input.senderName,
                            senderEmail: input.senderEmail?.toLowerCase(),
                            replyToEmail: input.replyToEmail?.toLowerCase(),
                        }
                        : current
                )),
                recipients: [
                    ...memoryStore.recipients.filter((recipient) => recipient.blastId !== input.blastId),
                    ...uniqueRecipients.map((email) => ({
                        id: makeMemoryId("ebr"),
                        blastId: input.blastId,
                        email,
                    })),
                ],
                attachments: memoryStore.attachments,
            };

            return getMemoryBlastOrThrow(input.blastId);
        }
    );
}

function updateMemoryBlast(blastId: string, updater: (blast: DbEmailBlast) => DbEmailBlast): DbEmailBlast {
    const current = getMemoryBlastOrThrow(blastId);
    const updated = updater(current);

    memoryStore = {
        blasts: memoryStore.blasts.map((blast) => (blast.id === blastId ? updated : blast)),
        recipients: memoryStore.recipients,
        attachments: memoryStore.attachments,
    };

    return updated;
}

async function getBlastOrThrow(blastId: string): Promise<BlastWithRecipients> {
    const blast = await prisma.emailBlast.findUnique({
        where: { id: blastId },
        include: {
            recipients: {
                orderBy: { email: "asc" },
            },
        },
    });

    if (!blast) {
        throw new Error("Blast not found");
    }

    return blast as BlastWithRecipients;
}

async function getBlastAttachmentStats(blastId: string): Promise<{ count: number; totalBytes: number }> {
    const aggregated = await prisma.emailBlastAttachment.aggregate({
        where: { blastId },
        _count: { _all: true },
        _sum: { sizeBytes: true },
    });

    return {
        count: aggregated._count._all,
        totalBytes: aggregated._sum.sizeBytes ?? 0,
    };
}

function ensureBlastMutable(blastStatus: DbEmailBlast["status"] | BlastWithRecipients["status"]): void {
    if (blastStatus === "sent") {
        throw new Error("Invalid transition: cannot edit attachments after blast is sent");
    }
}

export async function listBlastAttachments(blastId: string, user: User): Promise<DbEmailBlastAttachment[]> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);

            const attachments = await prisma.emailBlastAttachment.findMany({
                where: { blastId: blast.id },
                orderBy: { createdAt: "desc" },
            });

            return attachments.map((attachment) => toAttachmentDto(attachment as BlastAttachmentRecord));
        },
        async () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            return getMemoryAttachmentsForBlast(blastId);
        }
    );
}

export async function addBlastAttachment(
    blastId: string,
    input: {
        filename: string;
        mimeType: string;
        data: Buffer;
        uploadedBy: string;
        publicBaseUrl?: string;
    },
    user: User
): Promise<DbEmailBlastAttachment> {
    validateAttachmentInput(input.filename, input.mimeType, input.data.byteLength);
    const checksumSha256 = createHash("sha256").update(input.data).digest("hex");

    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureBlastMutable(blast.status);

            const stats = await getBlastAttachmentStats(blastId);
            if (stats.count >= EMAIL_BLAST_ATTACHMENT_LIMITS.maxFilesPerBlast) {
                throw new Error("Validation failed: maximum 5 attachments are allowed per blast");
            }

            if (stats.totalBytes + input.data.byteLength > EMAIL_BLAST_ATTACHMENT_LIMITS.maxTotalBytes) {
                throw new Error("Payload too large: total attachment size exceeds 20 MB");
            }

            const duplicate = await prisma.emailBlastAttachment.findFirst({
                where: { blastId, checksumSha256 },
                select: { id: true },
            });
            if (duplicate) {
                throw new Error("Validation failed: duplicate attachment detected");
            }

            const stored = await saveUploadForBlast(blastId, input.filename, input.data, input.publicBaseUrl);

            const created = await prisma.emailBlastAttachment.create({
                data: {
                    blastId,
                    kind: getAttachmentKindFromMime(input.mimeType),
                    storageKey: stored.storageKey,
                    publicUrl: stored.publicUrl,
                    filename: normalizeAttachmentFilename(input.filename),
                    mimeType: input.mimeType,
                    sizeBytes: stored.sizeBytes,
                    checksumSha256,
                    uploadedBy: input.uploadedBy,
                },
            });

            return toAttachmentDto(created as BlastAttachmentRecord);
        },
        async () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureBlastMutable(blast.status);

            const currentAttachments = getMemoryAttachmentsForBlast(blastId);
            if (currentAttachments.length >= EMAIL_BLAST_ATTACHMENT_LIMITS.maxFilesPerBlast) {
                throw new Error("Validation failed: maximum 5 attachments are allowed per blast");
            }

            const totalBytes = currentAttachments.reduce((sum, attachment) => sum + attachment.sizeBytes, 0);
            if (totalBytes + input.data.byteLength > EMAIL_BLAST_ATTACHMENT_LIMITS.maxTotalBytes) {
                throw new Error("Payload too large: total attachment size exceeds 20 MB");
            }

            if (currentAttachments.some((attachment) => attachment.checksumSha256 === checksumSha256)) {
                throw new Error("Validation failed: duplicate attachment detected");
            }

            const stored = await saveUploadForBlast(blastId, input.filename, input.data, input.publicBaseUrl);
            const newAttachment: DbEmailBlastAttachment = {
                id: makeMemoryId("eba"),
                blastId,
                kind: getAttachmentKindFromMime(input.mimeType),
                storageKey: stored.storageKey,
                publicUrl: stored.publicUrl,
                filename: normalizeAttachmentFilename(input.filename),
                mimeType: input.mimeType,
                sizeBytes: stored.sizeBytes,
                checksumSha256,
                uploadedBy: input.uploadedBy,
                createdAt: new Date().toISOString(),
            };

            memoryStore = {
                blasts: memoryStore.blasts,
                recipients: memoryStore.recipients,
                attachments: [newAttachment, ...memoryStore.attachments],
            };

            return newAttachment;
        }
    );
}

export async function deleteBlastAttachment(blastId: string, attachmentId: string, user: User): Promise<void> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureBlastMutable(blast.status);

            const attachment = await prisma.emailBlastAttachment.findFirst({
                where: { id: attachmentId, blastId },
            });

            if (!attachment) {
                throw new Error("Attachment not found");
            }

            await prisma.emailBlastAttachment.delete({ where: { id: attachment.id } });
            await deleteStoredFile(attachment.storageKey);
        },
        async () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureBlastMutable(blast.status);

            const attachment = memoryStore.attachments.find((candidate) => candidate.id === attachmentId && candidate.blastId === blastId);
            if (!attachment) {
                throw new Error("Attachment not found");
            }

            memoryStore = {
                blasts: memoryStore.blasts,
                recipients: memoryStore.recipients,
                attachments: memoryStore.attachments.filter((candidate) => candidate.id !== attachmentId),
            };
            await deleteStoredFile(attachment.storageKey);
        }
    );
}

export async function listEmailBlasts(departmentId: string, user: User): Promise<{ blasts: DbEmailBlast[]; recipients: DbEmailBlastRecipient[] }> {
    ensureDepartmentAccess(user, departmentId);

    return withPrismaFallback(
        async () => {
            const blasts = (await prisma.emailBlast.findMany({
                where: {
                    departmentId,
                    isArchived: false,
                },
                include: {
                    recipients: {
                        orderBy: { email: "asc" },
                    },
                },
                orderBy: { createdAt: "desc" },
            })) as BlastWithRecipients[];

            const blastDtos = blasts.map((blast) => toBlastDto(blast));
            const recipientDtos = blasts.flatMap((blast) => toRecipientDtos(blast));

            return {
                blasts: blastDtos,
                recipients: recipientDtos,
            };
        },
        () => listEmailBlastsFromMemory(departmentId)
    );
}

export async function createEmailBlast(input: z.infer<typeof createBlastSchema>, user: User): Promise<DbEmailBlast> {
    ensureDepartmentAccess(user, input.departmentId);

    return withPrismaFallback(
        async () => {
            const status = input.saveAsDraft ? "draft" : "pending_approval";
            const uniqueRecipients = Array.from(
                new Set(input.recipients.map((email) => email.trim().toLowerCase()))
            );

            if (uniqueRecipients.length === 0) {
                throw new Error("Validation failed: at least one recipient is required");
            }

            const created = await prisma.emailBlast.create({
                data: {
                    subject: input.subject,
                    body: input.body,
                    contentMode: input.contentMode,
                    senderName: input.senderName,
                    senderEmail: input.senderEmail?.toLowerCase(),
                    replyToEmail: input.replyToEmail?.toLowerCase(),
                    status,
                    composedBy: user.id,
                    departmentId: input.departmentId,
                    recipients: {
                        create: uniqueRecipients.map((email) => ({ email })),
                    },
                },
                include: {
                    recipients: true,
                },
            });

            return toBlastDto(created as BlastWithRecipients);
        },
        () => createEmailBlastInMemory(input, user)
    );
}

export async function submitEmailBlast(blastId: string, user: User): Promise<DbEmailBlast> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);

            if (blast.composedBy !== user.id && user.role !== "admin") {
                throw new Error("Forbidden: only the composer can submit this blast");
            }

            if (blast.status !== "draft") {
                throw new Error("Invalid transition: only draft blasts can be submitted");
            }

            const updated = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: { status: "pending_approval" },
                include: { recipients: true },
            });

            return toBlastDto(updated as BlastWithRecipients);
        },
        () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);

            if (blast.composedBy !== user.id && user.role !== "admin") {
                throw new Error("Forbidden: only the composer can submit this blast");
            }

            if (blast.status !== "draft") {
                throw new Error("Invalid transition: only draft blasts can be submitted");
            }

            return updateMemoryBlast(blastId, (current) => ({
                ...current,
                status: "pending_approval",
            }));
        }
    );
}

export async function approveEmailBlast(blastId: string, user: User): Promise<DbEmailBlast> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "pending_approval") {
                throw new Error("Invalid transition: only pending blasts can be approved");
            }

            const updated = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: {
                    status: "approved",
                    approvedBy: user.id,
                    rejectedBy: null,
                    rejectionReason: null,
                },
                include: { recipients: true },
            });

            return toBlastDto(updated as BlastWithRecipients);
        },
        () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "pending_approval") {
                throw new Error("Invalid transition: only pending blasts can be approved");
            }

            return updateMemoryBlast(blastId, (current) => ({
                ...current,
                status: "approved",
                approvedBy: user.id,
                rejectedBy: undefined,
                rejectionReason: undefined,
            }));
        }
    );
}

export async function rejectEmailBlast(blastId: string, reason: string, user: User): Promise<DbEmailBlast> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "pending_approval") {
                throw new Error("Invalid transition: only pending blasts can be rejected");
            }

            const updated = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: {
                    status: "rejected",
                    rejectedBy: user.id,
                    rejectionReason: reason,
                },
                include: { recipients: true },
            });

            return toBlastDto(updated as BlastWithRecipients);
        },
        () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "pending_approval") {
                throw new Error("Invalid transition: only pending blasts can be rejected");
            }

            return updateMemoryBlast(blastId, (current) => ({
                ...current,
                status: "rejected",
                rejectedBy: user.id,
                rejectionReason: reason,
            }));
        }
    );
}

export async function sendEmailBlast(blastId: string, user: User): Promise<DbEmailBlast> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "approved") {
                throw new Error("Invalid transition: only approved blasts can be sent");
            }

            const sentCount = blast.recipients.length;
            const sentAt = new Date();

            const updated = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: {
                    status: "sent",
                    sentAt,
                    sentCount,
                },
                include: { recipients: true },
            });

            return toBlastDto(updated as BlastWithRecipients);
        },
        () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "approved") {
                throw new Error("Invalid transition: only approved blasts can be sent");
            }

            const sentCount = getMemoryRecipientsForBlast(blastId).length;

            return updateMemoryBlast(blastId, (current) => ({
                ...current,
                status: "sent",
                sentAt: new Date().toISOString(),
                sentCount,
            }));
        }
    );
}

export async function getSendPayload(blastId: string, user: User): Promise<{
    subject: string;
    body: string;
    contentMode: "text" | "html";
    recipients: string[];
    senderName?: string;
    senderEmail?: string;
    replyToEmail?: string;
    attachments: Array<{
        filename: string;
        mimeType: string;
        storageKey: string;
    }>;
}> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "approved") {
                throw new Error("Invalid transition: only approved blasts can be sent");
            }

            return {
                subject: blast.subject,
                body: blast.body,
                contentMode: blast.contentMode as "text" | "html",
                recipients: blast.recipients.map((recipient) => recipient.email),
                senderName: blast.senderName ?? undefined,
                senderEmail: blast.senderEmail ?? undefined,
                replyToEmail: blast.replyToEmail ?? undefined,
                attachments: (await prisma.emailBlastAttachment.findMany({
                    where: { blastId: blast.id },
                    orderBy: { createdAt: "asc" },
                })).map((attachment) => ({
                    filename: attachment.filename,
                    mimeType: attachment.mimeType,
                    storageKey: attachment.storageKey,
                })),
            };
        },
        () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            if (blast.status !== "approved") {
                throw new Error("Invalid transition: only approved blasts can be sent");
            }

            return {
                subject: blast.subject,
                body: blast.body,
                contentMode: blast.contentMode as "text" | "html",
                recipients: getMemoryRecipientsForBlast(blastId).map((recipient) => recipient.email),
                senderName: blast.senderName ?? undefined,
                senderEmail: blast.senderEmail ?? undefined,
                replyToEmail: blast.replyToEmail ?? undefined,
                attachments: getMemoryAttachmentsForBlast(blastId).map((attachment) => ({
                    filename: attachment.filename,
                    mimeType: attachment.mimeType,
                    storageKey: attachment.storageKey,
                })),
            };
        }
    );
}

export async function archiveEmailBlast(blastId: string, user: User): Promise<DbEmailBlast> {
    return withPrismaFallback(
        async () => {
            const blast = await getBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            const updated = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: { isArchived: true },
                include: { recipients: true },
            });

            return toBlastDto(updated as BlastWithRecipients);
        },
        () => {
            const blast = getMemoryBlastOrThrow(blastId);
            ensureDepartmentAccess(user, blast.departmentId);
            ensureManager(user);

            return updateMemoryBlast(blastId, (current) => ({
                ...current,
                isArchived: true,
            }));
        }
    );
}
