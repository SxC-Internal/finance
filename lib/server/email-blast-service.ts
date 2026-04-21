import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isFinanceManager } from "@/lib/finance";
import { DB_EMAIL_BLASTS, DB_EMAIL_BLAST_RECIPIENTS } from "@/constants";
import type { DbEmailBlast, DbEmailBlastRecipient, User } from "@/types";

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

type EmailBlastMemoryStore = {
    blasts: DbEmailBlast[];
    recipients: DbEmailBlastRecipient[];
};

const initialMemoryStore: EmailBlastMemoryStore = {
    blasts: DB_EMAIL_BLASTS.map((blast) => ({ ...blast })),
    recipients: DB_EMAIL_BLAST_RECIPIENTS.map((recipient) => ({ ...recipient })),
};

let memoryStore: EmailBlastMemoryStore = {
    blasts: initialMemoryStore.blasts,
    recipients: initialMemoryStore.recipients,
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
    fallbackOperation: () => T
): Promise<T> {
    if (allowMemoryFallback && Date.now() < nextPrismaRetryAt) {
        return fallbackOperation();
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

        return fallbackOperation();
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
    };

    return newBlast;
}

function updateMemoryBlast(blastId: string, updater: (blast: DbEmailBlast) => DbEmailBlast): DbEmailBlast {
    const current = getMemoryBlastOrThrow(blastId);
    const updated = updater(current);

    memoryStore = {
        blasts: memoryStore.blasts.map((blast) => (blast.id === blastId ? updated : blast)),
        recipients: memoryStore.recipients,
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

export async function getSendPayload(blastId: string, user: User): Promise<{ subject: string; body: string; contentMode: "text" | "html"; recipients: string[]; senderName?: string; senderEmail?: string; replyToEmail?: string }> {
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
