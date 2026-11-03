/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Approved Administrator Google Accounts (Maximum 5 Accounts)
 * Single Source of Truth for approved admin emails across the frontend application.
 * All checks are performed lowercase and trimmed.
 */
export const APPROVED_ADMIN_EMAILS: readonly string[] = [
  'admin1@glmevangelism.com',
  'admin2@glmevangelism.com',
  'admin3@glmevangelism.com',
  'admin4@glmevangelism.com',
  'admin5@glmevangelism.com',
] as const;

/**
 * Checks whether an email address belongs to an approved administrator.
 * Both the target and configured emails are compared in lowercase and trimmed.
 */
export function isApprovedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return APPROVED_ADMIN_EMAILS.some((adminEmail) => adminEmail.trim().toLowerCase() === cleanEmail);
}

/**
 * State flag indicating whether an admin Google sign-in flow is currently resolving.
 * Prevents onAuthStateChanged from prematurely setting regular worker state.
 */
let isPendingAdminSignIn = false;

export function setPendingAdminSignIn(pending: boolean): void {
  isPendingAdminSignIn = pending;
}

export function getPendingAdminSignIn(): boolean {
  return isPendingAdminSignIn;
}
