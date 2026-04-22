import { useCallback, useEffect, useMemo, useState } from "react";
import type { DbEmailBlast, DbEmailBlastAttachment, DbEmailBlastRecipient, User } from "@/types";
import {
  getEmailBlasts,
  getPendingBlasts,
  getRecipientsForBlast as getRecipientsSelector,
  getSentBlasts,
  validateEmailList,
} from "@/lib/emailBlast";
import { getFinanceRole, isFinanceManager } from "@/lib/finance";
import { useToast } from "@/components/shared/ToastProvider";
import {
  approveBlastRequest,
  archiveBlastRequest,
  createBlast,
  deleteBlastAttachmentRequest,
  fetchAuthorizedFromAddresses,
  fetchEmailBlasts,
  listBlastAttachments,
  rejectBlastRequest,
  sendBlastRequest,
  submitBlast,
  updateBlastDraft,
  uploadBlastAttachment,
} from "@/lib/api/emailBlasts";

export function useEmailBlast(user: User) {
  const { addToast } = useToast();
  const [blasts, setBlasts] = useState<DbEmailBlast[]>([]);
  const [recipients, setRecipients] = useState<DbEmailBlastRecipient[]>([]);
  const [composerRecipients, setComposerRecipients] = useState<string[]>([]);
  const [composerDraftId, setComposerDraftId] = useState<string | null>(null);
  const [composerAttachments, setComposerAttachments] = useState<DbEmailBlastAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [composerSubject, setComposerSubject] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerContentMode, setComposerContentMode] = useState<"text" | "html">("text");
  const [composerSenderName, setComposerSenderName] = useState(user.name);
  const [composerSenderEmail, setComposerSenderEmail] = useState("");
  const [composerReplyToEmail, setComposerReplyToEmail] = useState(user.email);
  const [authorizedFromEmails, setAuthorizedFromEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  const financeRole = useMemo(() => getFinanceRole(user), [user]);
  const isManager = useMemo(() => isFinanceManager(user), [user]);

  const deptId = user.departmentId ?? "d_finance";

  const refreshBlasts = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);

    try {
      const [payload, fromAddresses] = await Promise.all([
        fetchEmailBlasts(user, deptId),
        fetchAuthorizedFromAddresses().catch(() => [] as string[]),
      ]);
      setBlasts(payload.blasts);
      setRecipients(payload.recipients);
      setFallbackWarning(payload.warning ?? null);
      setAuthorizedFromEmails(fromAddresses);
      // Pre-select the first authorized address if composer hasn't been touched
      setComposerSenderEmail((prev) => prev || (fromAddresses[0] ?? ""));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load email blasts";
      setActionError(message);
      addToast({
        type: "error",
        title: "Unable to Load Email Blasts",
        message,
      });
      setBlasts([]);
      setRecipients([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, deptId, addToast]);

  useEffect(() => {
    void refreshBlasts();
  }, [refreshBlasts]);

  const allBlasts = useMemo(
    () => getEmailBlasts(deptId, blasts),
    [deptId, blasts]
  );
  const pendingBlasts = useMemo(() => getPendingBlasts(allBlasts), [allBlasts]);
  const sentBlasts = useMemo(() => getSentBlasts(allBlasts), [allBlasts]);

  const addComposerRecipient = useCallback((email: string) => {
    const { valid } = validateEmailList([email]);
    if (valid.length === 0) return;
    const trimmed = email.trim();
    setComposerRecipients((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
  }, []);

  const removeComposerRecipient = useCallback((email: string) => {
    setComposerRecipients((prev) => prev.filter((e) => e !== email));
  }, []);

  const resetComposer = useCallback(() => {
    setComposerSubject("");
    setComposerBody("");
    setComposerContentMode("text");
    setComposerRecipients([]);
    setComposerDraftId(null);
    setComposerAttachments([]);
    setComposerSenderName(user.name);
    setComposerSenderEmail((prev) => prev); // keep selected FROM
    setComposerReplyToEmail(user.email);
  }, [user.name, user.email]);

  const ensureAttachmentDraftId = useCallback(async (): Promise<string> => {
    if (composerDraftId) return composerDraftId;

    if (!composerSubject.trim() || !composerBody.trim() || composerRecipients.length === 0) {
      throw new Error("Please add subject, body, and at least one recipient before uploading attachments.");
    }

    const created = await createBlast(user, {
      subject: composerSubject,
      body: composerBody,
      contentMode: composerContentMode,
      senderName: composerSenderName,
      senderEmail: composerSenderEmail,
      replyToEmail: composerReplyToEmail,
      recipients: composerRecipients,
      departmentId: deptId,
      saveAsDraft: true,
    });

    setComposerDraftId(created.id);
    return created.id;
  }, [composerDraftId, composerSubject, composerBody, composerContentMode, composerSenderName, composerSenderEmail, composerReplyToEmail, composerRecipients, user, deptId]);

  const uploadComposerAttachment = useCallback((file: File) => {
    void (async () => {
      try {
        setActionError(null);
        setIsUploadingAttachment(true);
        const draftId = await ensureAttachmentDraftId();
        const attachment = await uploadBlastAttachment(user, draftId, file);
        setComposerAttachments((prev) => [attachment, ...prev]);
        addToast({
          type: "success",
          title: "Attachment Uploaded",
          message: `${attachment.filename} is ready.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload attachment";
        setActionError(message);
        addToast({
          type: "error",
          title: "Upload Failed",
          message,
        });
      } finally {
        setIsUploadingAttachment(false);
      }
    })();
  }, [ensureAttachmentDraftId, user, addToast]);

  const removeComposerAttachment = useCallback((attachmentId: string) => {
    if (!composerDraftId) return;

    void (async () => {
      try {
        setActionError(null);
        await deleteBlastAttachmentRequest(user, composerDraftId, attachmentId);
        setComposerAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to remove attachment";
        setActionError(message);
        addToast({
          type: "error",
          title: "Remove Failed",
          message,
        });
      }
    })();
  }, [composerDraftId, user, addToast]);

  const insertImageIntoComposerBody = useCallback((attachmentId: string) => {
    const attachment = composerAttachments.find((item) => item.id === attachmentId);
    if (!attachment || attachment.kind !== "image" || !attachment.publicUrl) return;

    const safeAlt = attachment.filename.replace(/"/g, "");
    setComposerBody((prev) => `${prev}<p><img src="${attachment.publicUrl}" alt="${safeAlt}" /></p>`);
  }, [composerAttachments]);

  const saveDraft = useCallback(() => {
    void (async () => {
      try {
        setActionError(null);
        const created = composerDraftId
          ? await updateBlastDraft(user, composerDraftId, {
            subject: composerSubject,
            body: composerBody,
            contentMode: composerContentMode,
            senderName: composerSenderName,
            senderEmail: composerSenderEmail,
            replyToEmail: composerReplyToEmail,
            recipients: composerRecipients,
          })
          : await createBlast(user, {
            subject: composerSubject,
            body: composerBody,
            contentMode: composerContentMode,
            senderName: composerSenderName,
            senderEmail: composerSenderEmail,
            replyToEmail: composerReplyToEmail,
            recipients: composerRecipients,
            departmentId: deptId,
            saveAsDraft: true,
          });
        setComposerDraftId(created.id);
        const attachments = await listBlastAttachments(user, created.id);
        setComposerAttachments(attachments);
        await refreshBlasts();
        addToast({
          type: "success",
          title: "Draft Saved",
          message: `"${composerSubject}" has been saved as a draft.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save draft";
        setActionError(message);
        addToast({
          type: "error",
          title: "Save Failed",
          message,
        });
      }
    })();
  }, [composerSubject, composerBody, composerContentMode, composerSenderName, composerSenderEmail, composerReplyToEmail, composerRecipients, user, deptId, refreshBlasts, addToast, composerDraftId]);

  const submitForApproval = useCallback(() => {
    if (
      !composerSubject.trim() ||
      !composerBody.trim() ||
      composerRecipients.length === 0
    )
      return;

    void (async () => {
      try {
        setActionError(null);
        const blastId = composerDraftId ?? (await createBlast(user, {
          subject: composerSubject,
          body: composerBody,
          contentMode: composerContentMode,
          senderName: composerSenderName,
          senderEmail: composerSenderEmail,
          replyToEmail: composerReplyToEmail,
          recipients: composerRecipients,
          departmentId: deptId,
          saveAsDraft: true,
        })).id;

        await submitBlast(user, blastId);
        if (isManager) {
          await approveBlastRequest(user, blastId);
          await sendBlastRequest(user, blastId);
        }
        await refreshBlasts();
        resetComposer();
        addToast({
          type: "success",
          title: isManager ? "Blast Sent" : "Submitted for Approval",
          message: isManager
            ? `Your email blast "${composerSubject}" has been sent.`
            : `Your email blast "${composerSubject}" has been submitted for manager approval.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit blast for approval";
        setActionError(message);
        addToast({
          type: "error",
          title: "Submission Failed",
          message,
        });
      }
    })();
  }, [composerSubject, composerBody, composerContentMode, composerSenderName, composerSenderEmail, composerReplyToEmail, composerRecipients, user, deptId, isManager, refreshBlasts, resetComposer, addToast, composerDraftId]);

  useEffect(() => {
    if (!composerDraftId) return;
    void (async () => {
      try {
        const attachments = await listBlastAttachments(user, composerDraftId);
        setComposerAttachments(attachments);
      } catch {
        setComposerAttachments([]);
      }
    })();
  }, [composerDraftId, user]);

  const approveBlast = useCallback(
    (blastId: string) => {
      if (!isFinanceManager(user)) return;
      void (async () => {
        try {
          setActionError(null);
          await approveBlastRequest(user, blastId);
          await sendBlastRequest(user, blastId);
          await refreshBlasts();
          addToast({
            type: "success",
            title: "Blast Approved",
            message: "The email blast has been approved and sent.",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to approve and send blast";
          setActionError(message);
          addToast({
            type: "error",
            title: "Approval Failed",
            message,
          });
        }
      })();
    },
    [user, refreshBlasts, addToast]
  );

  const rejectBlast = useCallback(
    (blastId: string, reason: string) => {
      if (!isFinanceManager(user)) return;
      void (async () => {
        try {
          setActionError(null);
          await rejectBlastRequest(user, blastId, reason);
          await refreshBlasts();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to reject blast";
          setActionError(message);
          addToast({
            type: "error",
            title: "Rejection Failed",
            message,
          });
        }
      })();
    },
    [user, refreshBlasts, addToast]
  );

  const getRecipientsForBlast = useCallback(
    (blastId: string) => getRecipientsSelector(blastId, recipients),
    [recipients]
  );

  const archiveBlast = useCallback((blastId: string) => {
    void (async () => {
      try {
        setActionError(null);
        await archiveBlastRequest(user, blastId);
        await refreshBlasts();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to archive blast";
        setActionError(message);
        addToast({
          type: "error",
          title: "Archive Failed",
          message,
        });
      }
    })();
  }, [user, refreshBlasts, addToast]);

  const duplicateBlast = useCallback((blast: DbEmailBlast) => {
    void (async () => {
      try {
        setActionError(null);
        await createBlast(user, {
          subject: blast.subject,
          body: blast.body,
          contentMode: blast.contentMode as "text" | "html",
          senderName: blast.senderName,
          senderEmail: blast.senderEmail,
          recipients: getRecipientsForBlast(blast.id).map((recipient) => recipient.email),
          departmentId: blast.departmentId,
          saveAsDraft: true,
        });
        await refreshBlasts();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to duplicate blast";
        setActionError(message);
        addToast({
          type: "error",
          title: "Duplicate Failed",
          message,
        });
      }
    })();
  }, [user, getRecipientsForBlast, refreshBlasts, addToast]);

  const resendBlast = useCallback((blast: DbEmailBlast) => {
    void (async () => {
      try {
        setActionError(null);
        const created = await createBlast(user, {
          subject: blast.subject,
          body: blast.body,
          contentMode: blast.contentMode as "text" | "html",
          senderName: blast.senderName,
          senderEmail: blast.senderEmail,
          recipients: getRecipientsForBlast(blast.id).map((recipient) => recipient.email),
          departmentId: blast.departmentId,
          saveAsDraft: true,
        });
        await submitBlast(user, created.id);
        if (isManager) {
          await approveBlastRequest(user, created.id);
          await sendBlastRequest(user, created.id);
        }
        await refreshBlasts();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend blast";
        setActionError(message);
        addToast({
          type: "error",
          title: "Resend Failed",
          message,
        });
      }
    })();
  }, [user, getRecipientsForBlast, isManager, refreshBlasts, addToast]);

  return {
    blasts,
    recipients,
    isLoading,
    actionError,
    fallbackWarning,
    composerRecipients,
    composerAttachments,
    isUploadingAttachment,
    composerSubject,
    composerBody,
    composerContentMode,
    composerSenderName,
    composerSenderEmail,
    composerReplyToEmail,
    authorizedFromEmails,
    allBlasts,
    pendingBlasts,
    sentBlasts,
    financeRole,
    isManager,
    addComposerRecipient,
    removeComposerRecipient,
    uploadComposerAttachment,
    removeComposerAttachment,
    insertImageIntoComposerBody,
    setComposerSubject,
    setComposerBody,
    setComposerContentMode,
    setComposerSenderName,
    setComposerSenderEmail,
    setComposerReplyToEmail,
    resetComposer,
    saveDraft,
    submitForApproval,
    approveBlast,
    rejectBlast,
    archiveBlast,
    duplicateBlast,
    resendBlast,
    getRecipientsForBlast,
  };
}
