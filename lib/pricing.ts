import { formatPeso } from "@/lib/money";

/** Philippine VAT, as a whole percent so the math stays in integers. */
export const VAT_PERCENT = 12;

export type Quote = {
  nights: number;
  nightlyRate: string;
  roomTotal: string;
  tax: string;
  total: string;
  nightlyRateLabel: string;
  roomTotalLabel: string;
  taxLabel: string;
  totalLabel: string;
};

/**
 * Money is counted in centavos as plain integers. Pesos-as-floats would drift —
 * 0.1 + 0.2 is the classic — and a bill that is off by a centavo is a bill the
 * front desk has to explain.
 */
const toCentavos = (amount: string): number =>
  Math.round(Number(amount) * 100);

const toAmount = (centavos: number): string => {
  const negative = centavos < 0;
  const absolute = Math.abs(centavos);
  const whole = Math.trunc(absolute / 100);
  const cents = String(absolute % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${cents}`;
};

/**
 * Room subtotal, VAT and grand total for a stay.
 *
 * VAT applies to the room charge only. Incidentals posted to a folio later are
 * treated as already VAT-inclusive — see IMPLEMENTATION.md, Section 13.
 */
export const quoteStay = (nightlyRate: string, nights: number): Quote => {
  const rateCentavos = toCentavos(nightlyRate);
  const roomCentavos = rateCentavos * nights;
  const taxCentavos = Math.round((roomCentavos * VAT_PERCENT) / 100);
  const totalCentavos = roomCentavos + taxCentavos;

  const roomTotal = toAmount(roomCentavos);
  const tax = toAmount(taxCentavos);
  const total = toAmount(totalCentavos);

  return {
    nights,
    nightlyRate,
    roomTotal,
    tax,
    total,
    nightlyRateLabel: formatPeso(nightlyRate),
    roomTotalLabel: formatPeso(roomTotal),
    taxLabel: formatPeso(tax),
    totalLabel: formatPeso(total),
  };
};
