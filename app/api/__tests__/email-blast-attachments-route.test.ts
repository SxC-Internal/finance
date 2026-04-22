import { NextRequest } from "next/server";
import { GET as listAttachments, POST as uploadAttachment } from "@/app/api/email-blasts/[blastId]/attachments/route";
import { DELETE as deleteAttachment } from "@/app/api/email-blasts/[blastId]/attachments/[attachmentId]/route";

jest.mock("@/lib/server/request-user", () => ({
    getRequestUser: jest.fn(() => ({
        id: "u_fin_head",
        role: "finance",
        departmentId: "d_finance",
    })),
    RequestAuthError: class extends Error {
        statusCode = 401;
    },
}));

jest.mock("@/lib/server/email-blast-service", () => ({
    blastIdSchema: {
        safeParse: jest.fn((value: { blastId: string }) => ({
            success: true,
            data: { blastId: value.blastId },
        })),
    },
    listBlastAttachments: jest.fn(async () => [
        {
            id: "att_1",
            blastId: "eb_1",
            kind: "file",
            storageKey: "blasts/eb_1/a.pdf",
            filename: "a.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1024,
            checksumSha256: "abc",
            uploadedBy: "u_fin_head",
            createdAt: "2026-04-22T00:00:00Z",
        },
    ]),
    addBlastAttachment: jest.fn(async () => ({
        id: "att_2",
        blastId: "eb_1",
        kind: "image",
        storageKey: "blasts/eb_1/image.png",
        publicUrl: "http://localhost:3000/api/email-blasts/assets/blasts/eb_1/image.png",
        filename: "image.png",
        mimeType: "image/png",
        sizeBytes: 2048,
        checksumSha256: "def",
        uploadedBy: "u_fin_head",
        createdAt: "2026-04-22T00:00:00Z",
    })),
    deleteBlastAttachment: jest.fn(async () => undefined),
}));

describe("email blast attachment routes", () => {
    it("lists attachments for a blast", async () => {
        const request = new NextRequest("http://localhost:3000/api/email-blasts/eb_1/attachments");
        const response = await listAttachments(request, { params: Promise.resolve({ blastId: "eb_1" }) });
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(payload.data.attachments).toHaveLength(1);
    });

    it("uploads an attachment via multipart form data", async () => {
        const form = new FormData();
        form.append("file", new File(["hello"], "image.png", { type: "image/png" }));
        const request = new NextRequest("http://localhost:3000/api/email-blasts/eb_1/attachments", {
            method: "POST",
            body: form,
        });

        const response = await uploadAttachment(request, { params: Promise.resolve({ blastId: "eb_1" }) });
        const payload = await response.json();

        expect(response.status).toBe(201);
        expect(payload.success).toBe(true);
        expect(payload.data.attachment.filename).toBe("image.png");
    });

    it("deletes an attachment", async () => {
        const request = new NextRequest("http://localhost:3000/api/email-blasts/eb_1/attachments/att_1", {
            method: "DELETE",
        });

        const response = await deleteAttachment(request, {
            params: Promise.resolve({ blastId: "eb_1", attachmentId: "att_1" }),
        });
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(payload.data.deleted).toBe(true);
    });
});
