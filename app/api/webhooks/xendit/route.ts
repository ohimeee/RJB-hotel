import { recordPayment } from "@/lib/billing";
import {
  toPaymentMethod,
  verifyCallbackToken,
  type XenditInvoiceEvent,
} from "@/lib/payments";
import { confirmReservation, getReservation } from "@/lib/reservations";

/**
 * The only place a booking becomes CONFIRMED.
 *
 * The guest's browser arriving at `success_redirect_url` proves nothing — it is
 * a URL anyone can type, bookmark or share. Confirming from the redirect would
 * mean anybody could navigate straight to it and walk away with a real
 * reservation, a blocked room and no payment. So confirmation happens here,
 * on a request that came from Xendit, and nowhere else.
 *
 * This endpoint is public. Every request is authenticated before a single field
 * of the body is read.
 */
export const POST = async (request: Request): Promise<Response> => {
  if (!verifyCallbackToken(request.headers.get("x-callback-token"))) {
    return new Response("unauthorized", { status: 401 });
  }

  let event: XenditInvoiceEvent;

  try {
    event = (await request.json()) as XenditInvoiceEvent;
  } catch {
    return new Response("bad request", { status: 400 });
  }

  // "PAID" — not COMPLETED, not SUCCEEDED. Confirmed against a real test
  // invoice on 2026-08-27. Anything else (EXPIRED, PENDING) is acknowledged so
  // Xendit stops retrying, but changes nothing.
  if (event.status !== "PAID") {
    return Response.json({ received: true, ignored: event.status ?? null });
  }

  const reservationId = event.external_id;

  if (!reservationId) {
    return new Response("missing external_id", { status: 400 });
  }

  const reservation = await getReservation(reservationId);

  // The id is not one of ours. Take the 200 — retrying cannot make this
  // succeed. The payment cannot be recorded either, since Payment hangs off a
  // reservation, so the log line is the only trace; it should never fire.
  if (!reservation) {
    console.error(
      `[xendit] paid invoice for unknown reservation ${reservationId}`,
    );

    return Response.json({ received: true, matched: false });
  }

  // The invoice callback carries no separate event id, so the invoice id is
  // the dedupe key — one invoice is paid once, and a redelivery repeats it.
  // The unique index on providerEventId is what makes that safe.
  const recorded = await recordPayment({
    reservationId: reservation.id,
    amount: reservation.totalAmount,
    method: toPaymentMethod(event),
    // From the payload, not now(): a webhook redelivered an hour later would
    // otherwise stamp the wrong time on the folio.
    paidAt: event.paid_at ? new Date(event.paid_at) : new Date(),
    providerInvoiceId: event.id ?? null,
    providerEventId: event.id ?? null,
  });

  // Only promotes a PENDING row, so a duplicate delivery leaves an already
  // confirmed booking exactly as it is.
  const confirmed = await confirmReservation(reservation.id);

  if (!confirmed && reservation.status !== "CONFIRMED") {
    // Paid, but the hold had already been released and the room may have been
    // resold. Nothing to do automatically — this needs a human and possibly a
    // refund, so make it loud.
    console.error(
      `[xendit] payment for ${reservation.confirmationCode} arrived with status ${reservation.status}`,
    );
  }

  return Response.json({
    received: true,
    duplicate: !recorded,
    confirmed: Boolean(confirmed),
  });
};
