import type { DbEmailBlast, DbEmailBlastAttachment, DbEmailBlastRecipient, User } from "@/types";

interface ApiEnvelope<T> {
    success: boolean;
    data: T | null;
    error: string | null;
    warning?: string;
}

interface ListEmailBlastsResponse {
    blasts: DbEmailBlast[];
    recipients: DbEmailBlastRecipient[];
    warning?: string;
}

interface CreateBlastPayload {
    subject: string;
    body: string;
    contentMode?: "text" | "html";
    senderName?: string;
    senderEmail?: string;
    replyToEmail?: string;
    recipients: string[];
    departmentId: string;
    saveAsDraft?: boolean;
}

function getHeaders(): HeadersInit {
    return {
        "Content-Type": "application/json",
    };
}

async function parseEnvelope<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || !payload.success || payload.data == null) {
        throw new Error(payload.error ?? "Unexpected API error");
    }
    return payload.data;
}

async function parseEnvelopeWithWarning<T>(
    response: Response
): Promise<{ data: T; warning?: string }> {
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || !payload.success || payload.data == null) {
        throw new Error(payload.error ?? "Unexpected API error");
    }
    return { data: payload.data, warning: payload.warning };
}

export async function fetchEmailBlasts(user: User, departmentId: string): Promise<ListEmailBlastsResponse> {
    const query = new URLSearchParams({ departmentId });
    const response = await fetch(`/api/email-blasts?${query.toString()}`, {
        method: "GET",
        headers: getHeaders(),
    });

    const result = await parseEnvelopeWithWarning<{ blasts: DbEmailBlast[]; recipients: DbEmailBlastRecipient[] }>(response);
    return { ...result.data, warning: result.warning };
}

export async function createBlast(user: User, payload: CreateBlastPayload): Promise<DbEmailBlast> {
    const response = await fetch("/api/email-blasts", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function updateBlastDraft(user: User, blastId: string, payload: Omit<CreateBlastPayload, "departmentId" | "saveAsDraft">): Promise<DbEmailBlast> {
    const response = await fetch(`/api/email-blasts/${blastId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function submitBlast(user: User, blastId: string): Promise<DbEmailBlast> {
    const response = await fetch(`/api/email-blasts/${blastId}/submit`, {
        method: "POST",
        headers: getHeaders(),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function approveBlastRequest(user: User, blastId: string): Promise<DbEmailBlast> {
    const response = await fetch(`/api/email-blasts/${blastId}/approve`, {
        method: "POST",
        headers: getHeaders(),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function rejectBlastRequest(user: User, blastId: string, reason: string): Promise<DbEmailBlast> {
    const response = await fetch(`/api/email-blasts/${blastId}/reject`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function sendBlastRequest(user: User, blastId: string): Promise<DbEmailBlast> {
    const response = await fetch(`/api/email-blasts/${blastId}/send`, {
        method: "POST",
        headers: getHeaders(),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function archiveBlastRequest(user: User, blastId: string): Promise<DbEmailBlast> {
    const response = await fetch(`/api/email-blasts/${blastId}/archive`, {
        method: "POST",
        headers: getHeaders(),
    });

    return parseEnvelope<DbEmailBlast>(response);
}

export async function fetchAuthorizedFromAddresses(): Promise<string[]> {
    const response = await fetch("/api/email-blasts/from-addresses", {
        method: "GET",
        headers: getHeaders(),
    });

    const result = await parseEnvelope<{ addresses: string[] }>(response);
    return result.addresses;
}

export async function listBlastAttachments(user: User, blastId: string): Promise<DbEmailBlastAttachment[]> {
    const response = await fetch(`/api/email-blasts/${blastId}/attachments`, {
        method: "GET",
        headers: getHeaders(),
    });

    const result = await parseEnvelope<{ attachments: DbEmailBlastAttachment[] }>(response);
    return result.attachments;
}

export async function uploadBlastAttachment(user: User, blastId: string, file: File): Promise<DbEmailBlastAttachment> {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch(`/api/email-blasts/${blastId}/attachments`, {
        method: "POST",
        body,
    });

    const result = await parseEnvelope<{ attachment: DbEmailBlastAttachment }>(response);
    return result.attachment;
}

export async function deleteBlastAttachmentRequest(user: User, blastId: string, attachmentId: string): Promise<void> {
    const response = await fetch(`/api/email-blasts/${blastId}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    await parseEnvelope<{ deleted: boolean }>(response);
}
