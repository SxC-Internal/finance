import { Resend } from "resend";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";

interface SendBlastInput {
    subject: string;
    body: string;
    contentMode?: "text" | "html";
    recipients: string[];
    /** Display name shown in the From header, e.g. "SxC Finance" */
    senderName?: string;
    /**
     * The FROM email address chosen by the user.
     * Must be present in SMTP_AUTHORIZED_FROM_EMAILS (or RESEND_AUTHORIZED_FROM_EMAILS).
     * Defaults to SMTP_FROM_EMAIL / RESEND_FROM_EMAIL when not provided.
     */
    senderEmail?: string;
    /** Reply-To address (optional, separate from FROM) */
    replyToEmail?: string;
    attachments?: Array<{
        filename: string;
        mimeType: string;
        content: Buffer;
    }>;
}

const DEFAULT_BATCH_SIZE = 50;

const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'a', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'span', 'div', 'img',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['style'],
};

function sanitizeEmailHtml(html: string): string {
    const placeholders: string[] = [];
    const tempHtml = html.replace(/<<([A-Z0-9_]+)>>/g, (match) => {
        const id = `__PLACEHOLDER_${placeholders.length}__`;
        placeholders.push(match);
        return id;
    });

    const sanitized = sanitizeHtml(tempHtml, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedSchemes: ['http', 'https', 'mailto'],
    });

    return sanitized.replace(/__PLACEHOLDER_(\d+)__/g, (_, idx) => placeholders[Number(idx)]);
}

function wrapEmailHtml(content: string): string {
    return `
<!doctype html>
<html>
    <body style="margin:0;padding:0;background:#f6f8fb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f8fb;padding:24px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                        <tr>
                            <td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
                                ${content}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`.trim();
}

function sanitizeHeaderValue(input: string): string {
    return input.replace(/[\r\n]/g, "").trim();
}

function getResendClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    return new Resend(apiKey);
}

function getDefaultFromEmail(): string {
    const from = process.env.SMTP_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL;
    if (!from) {
        throw new Error("SMTP_FROM_EMAIL or RESEND_FROM_EMAIL must be configured");
    }

    return from;
}

/**
 * Returns the list of email addresses that users are permitted to send FROM.
 * Always includes the default SMTP/Resend FROM address.
 * Additional addresses are read from SMTP_AUTHORIZED_FROM_EMAILS (comma-separated).
 *
 * Example .env:
 *   SMTP_AUTHORIZED_FROM_EMAILS=kenny.t4ng@gmail.com,finance@sxc.ac.id
 */
export function getAuthorizedFromEmails(): string[] {
    const defaultFrom = getDefaultFromEmail()
        .replace(/^.*<(.+)>$/, "$1")  // strip display name if present
        .trim()
        .toLowerCase();

    const extra = (process.env.SMTP_AUTHORIZED_FROM_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    const all = Array.from(new Set([defaultFrom, ...extra]));
    return all;
}

/**
 * Validates that `email` is in the authorized FROM list.
 * Throws if not authorized.
 */
function assertAuthorizedFromEmail(email: string): void {
    const normalized = email.trim().toLowerCase();
    const authorized = getAuthorizedFromEmails();
    if (!authorized.includes(normalized)) {
        throw new Error(
            `FROM address "${email}" is not in the authorized sender list. ` +
            `Authorized addresses: ${authorized.join(", ")}`
        );
    }
}

/**
 * Build the display From header: "Display Name <email@example.com>"
 */
function buildFromHeader(displayName: string | undefined, email: string): string {
    const name = displayName ? sanitizeHeaderValue(displayName) : "";
    return name ? `${name} <${email}>` : email;
}

function canUseSmtp(): boolean {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

async function sendViaSmtp(
    from: string,
    replyTo: string | undefined,
    batch: string[],
    subject: string,
    body: string,
    html: string,
    attachments: SendBlastInput["attachments"]
): Promise<void> {
    const port = Number(process.env.SMTP_PORT ?? "0");
    if (!port) {
        throw new Error("SMTP_PORT is invalid");
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from,
        to: batch,
        replyTo,
        subject,
        text: body,
        html,
        attachments: attachments?.map((attachment) => ({
            filename: attachment.filename,
            contentType: attachment.mimeType,
            content: attachment.content,
        })),
    });
}

export function validateEmailProviderConfig(): void {
    const hasResend =
        Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.RESEND_FROM_EMAIL);
    const hasSmtp =
        Boolean(process.env.SMTP_HOST) &&
        Boolean(process.env.SMTP_PORT) &&
        Boolean(process.env.SMTP_USER) &&
        Boolean(process.env.SMTP_PASS) &&
        Boolean(process.env.SMTP_FROM_EMAIL);

    if (!hasResend && !hasSmtp) {
        throw new Error(
            "Email provider not configured: set RESEND_API_KEY + RESEND_FROM_EMAIL " +
            "for Resend, or SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS + SMTP_FROM_EMAIL for SMTP"
        );
    }
}

export async function sendBlastEmail(input: SendBlastInput): Promise<void> {
    const defaultFromEmail = getDefaultFromEmail()
        .replace(/^.*<(.+)>$/, "$1")
        .trim();

    // Resolve and authorize the FROM address
    const fromEmail = input.senderEmail
        ? sanitizeHeaderValue(input.senderEmail).trim().toLowerCase()
        : defaultFromEmail.toLowerCase();

    assertAuthorizedFromEmail(fromEmail);

    const from = buildFromHeader(input.senderName, fromEmail);
    const replyTo = input.replyToEmail
        ? sanitizeHeaderValue(input.replyToEmail).toLowerCase()
        : undefined;

    const uniqueRecipients = Array.from(
        new Set(input.recipients.map((email) => email.trim().toLowerCase()).filter(Boolean))
    );

    if (uniqueRecipients.length === 0) {
        throw new Error("No recipients provided");
    }

    // Branch rendering by contentMode
    let textBody: string;
    let finalHtmlBody: string;

    if (input.contentMode === "html") {
        textBody = input.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        finalHtmlBody = wrapEmailHtml(sanitizeEmailHtml(input.body));
    } else {
        textBody = input.body;
        // Basic conversion of newlines to breaks for text-mode emails viewed in HTML clients
        const escaped = input.body
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        finalHtmlBody = wrapEmailHtml(`<p style="white-space: pre-wrap; font-family: sans-serif;">${escaped}</p>`);
    }

    for (let i = 0; i < uniqueRecipients.length; i += DEFAULT_BATCH_SIZE) {
        const batch = uniqueRecipients.slice(i, i + DEFAULT_BATCH_SIZE);

        if (canUseSmtp()) {
            await sendViaSmtp(from, replyTo, batch, input.subject, textBody, finalHtmlBody, input.attachments);
            continue;
        }

        const resend = getResendClient();
        const result = await resend.emails.send({
            from,
            to: batch,
            replyTo,
            subject: input.subject,
            text: textBody,
            html: finalHtmlBody,
            attachments: input.attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.mimeType,
            })),
        });

        if (result.error) {
            throw new Error(`Resend send failed: ${result.error.message}`);
        }

        if (!result.data?.id) {
            throw new Error("Resend send failed: missing provider message id");
        }
    }
}
