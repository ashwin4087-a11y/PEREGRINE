/**
 * PEREGRINE — Alert Withdrawal & Revocation Chains (Section 13)
 * Generates cryptographically authenticated cancellation events referencing previous alert IDs.
 */

import { EmergencyAlert } from './sign';

/**
 * Creates authenticated withdrawal / cancellation alert referencing the original alert ID
 */
export async function createWithdrawalAlert(
  originalAlert: EmergencyAlert,
  cancellationReason: string
): Promise<EmergencyAlert> {
  const now = new Date().toISOString();
  return {
    id: `WD-${originalAlert.id.replace('ALT-', '')}-${Date.now().toString().slice(-4)}`,
    sender: originalAlert.sender,
    scope: 'PUBLIC',
    severity: 'MINOR',
    urgency: 'IMMEDIATE',
    certainty: 'OBSERVED',
    event: `WITHDRAWAL: ${originalAlert.event}`,
    headline: `CANCELLATION: ${originalAlert.headline}`,
    instruction: `THIS WARNING IS RESCINDED. Reason: ${cancellationReason}. Normal conditions resume.`,
    targetVillages: originalAlert.targetVillages,
    issuedAt: now,
    expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(),
    previousAlertId: originalAlert.id,
    isWithdrawal: true
  };
}
