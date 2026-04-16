import type { User, DbEmailBlast, DbEmailBlastRecipient } from "@/types";
import { isFinanceManager } from "@/lib/finance";

export function getEmailBlasts(
  departmentId: string,
  blasts: DbEmailBlast[]
): DbEmailBlast[] {
  return blasts
    .filter((b) => b.departmentId === departmentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPendingBlasts(blasts: DbEmailBlast[]): DbEmailBlast[] {
  return blasts.filter((b) => b.status === "pending_approval");
}

export function getSentBlasts(blasts: DbEmailBlast[]): DbEmailBlast[] {
  return blasts.filter((b) => b.status === "sent");
}

export function getRecipientsForBlast(
  blastId: string,
  recipients: DbEmailBlastRecipient[]
): DbEmailBlastRecipient[] {
  return recipients.filter((r) => r.blastId === blastId);
}

export function canApproveBlast(user: User): boolean {
  return isFinanceManager(user);
}

export function validateEmailList(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const email of emails) {
    if (emailRegex.test(email.trim())) {
      valid.push(email.trim());
    } else {
      invalid.push(email.trim());
    }
  }
  return { valid, invalid };
}
