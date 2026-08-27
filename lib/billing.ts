import { query } from "@/lib/db";
import type { PaymentMethod } from "@/lib/types";

export type NewPayment = {
  reservationId: string;
  amount: string;
  method: PaymentMethod;
  paidAt: Date;
  providerInvoiceId?: string | null;
  /** Xendit's event id. Null for cash taken at the front desk. */
  providerEventId?: string | null;
};

/**
 * Record money received against a reservation.
 *
 * Returns false when this exact gateway event has already been recorded, which
 * is the normal case rather than an error: Xendit retries a failed webhook with
 * exponential backoff, so the same event will arrive twice sooner or later. The
 * `Payment_providerEventId_key` unique index is what makes the duplicate a
 * no-op, and `ON CONFLICT DO NOTHING` is how that shows up here.
 */
export const recordPayment = async ({
  reservationId,
  amount,
  method,
  paidAt,
  providerInvoiceId = null,
  providerEventId = null,
}: NewPayment): Promise<boolean> => {
  const rows = await query<{ id: string }>(
    `
    INSERT INTO "Payment" (
      "reservationId", "amount", "method", "paidAt",
      "providerInvoiceId", "providerEventId"
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT ("providerEventId") WHERE "providerEventId" IS NOT NULL
      DO NOTHING
    RETURNING "id"
    `,
    [reservationId, amount, method, paidAt, providerInvoiceId, providerEventId],
  );

  return rows.length > 0;
};
