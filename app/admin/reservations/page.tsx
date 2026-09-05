"use client";

import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

interface Reservation {
  id: string;
  guest: string;
  room: string;
  dates: string;
  nights: number;
  guests: number;
  total: number;
  status: ReservationStatus;
  hold?: string; // mm:ss countdown, only for PENDING
}

const FILTERS: Array<"ALL" | ReservationStatus> = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
];

// ─────────────────────────────────────────────────────────────────────────
// Mock data — swap for a real fetch (e.g. useSWR / server component prop)
// ─────────────────────────────────────────────────────────────────────────

const RESERVATIONS: Reservation[] = [
  { id: "IKX-4831", guest: "Elena Duarte", room: "201 · Courtyard Deluxe", dates: "29 Aug → 31 Aug", nights: 2, guests: 2, total: 14336, status: "PENDING", hold: "13:42" },
  { id: "IKX-4820", guest: "Jordan Ellison", room: "402 · The Garret Suite", dates: "28 Aug → 31 Aug", nights: 3, guests: 2, total: 29904, status: "CHECKED_IN" },
  { id: "IKX-4823", guest: "Marisol Reyes", room: "104 · Harbor Standard", dates: "29 Aug → 30 Aug", nights: 1, guests: 1, total: 4704, status: "CONFIRMED" },
  { id: "IKX-4812", guest: "Aiko Tanaka", room: "305 · Loft Deluxe", dates: "24 Aug → 28 Aug", nights: 4, guests: 3, total: 31808, status: "CHECKED_OUT" },
  { id: "IKX-4801", guest: "Ben Ocampo", room: "103 · Archive Standard", dates: "30 Aug → 1 Sep", nights: 2, guests: 1, total: 8064, status: "CANCELLED" },
];

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const peso = (n: number) => "₱" + n.toLocaleString("en-PH");

const TAG_CLASSES: Record<ReservationStatus, string> = {
  PENDING: "border border-[#ec3013] bg-[#ec3013]/10 text-[#b8250e]",
  CONFIRMED: "bg-[#ec3013] text-[#f3f2f2]",
  CHECKED_IN: "bg-[#e15b47] text-[#f3f2f2]",
  CHECKED_OUT: "bg-[#eae9e9] text-[#201e1d]/70",
  CANCELLED: "border border-[#201e1d]/40 text-[#201e1d]/45 line-through",
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "HOLD",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED IN",
  CHECKED_OUT: "CHECKED OUT",
  CANCELLED: "CANCELLED",
};

function ClockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function StatusTag({ r }: { r: Reservation }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-extrabold tracking-widest ${TAG_CLASSES[r.status]}`}>
      {r.status === "PENDING" && <ClockIcon />}
      {STATUS_LABEL[r.status]}
      {r.status === "PENDING" && r.hold && (
        <span className="tabular-nums tracking-wider">{r.hold}</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [filter, setFilter] = useState<"ALL" | ReservationStatus>("ALL");
  const [search, setSearch] = useState("");

  const pendingCount = useMemo(
    () => RESERVATIONS.filter((r) => r.status === "PENDING").length,
    []
  );

  const rows = useMemo(() => {
    const byStatus =
      filter === "ALL" ? RESERVATIONS : RESERVATIONS.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (r) => r.guest.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );
  }, [filter, search]);

  const filterEmpty = RESERVATIONS.length > 0 && rows.length === 0;

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#ec3013]">
        Bookings
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 font-heading text-[42px] font-extrabold leading-none tracking-tight">
          Reservations
        </h1>
        <div className="text-[13px] tabular-nums text-[#201e1d]/55">
          {RESERVATIONS.length ? `${rows.length} of ${RESERVATIONS.length} shown` : "No reservations"}
        </div>
      </div>
      <hr className="mt-6 h-0.5 border-0 bg-[#201e1d]/40" />

      {/* Toolbar: status filters + search */}
      <div className="mt-6 flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex self-start border border-[#201e1d]/40">
          {FILTERS.map((f, i) => {
            const active = f === filter;
            const showCount = f === "PENDING" && pendingCount > 0;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  "inline-flex items-center justify-center whitespace-nowrap px-3 py-2.5 text-xs tracking-wide",
                  i > 0 ? "border-l-2 border-[#201e1d]/40" : "",
                  active ? "bg-[#ec3013] font-extrabold text-[#f3f2f2]" : "font-semibold text-[#201e1d]/70",
                ].join(" ")}
              >
                {f.replace("_", " ")}
                {showCount && (
                  <span
                    className={[
                      "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center px-1 text-[9.5px] font-extrabold tabular-nums",
                      active ? "bg-[#f3f2f2] text-[#ec3013]" : "bg-[#ec3013] text-[#f3f2f2]",
                    ].join(" ")}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guest or IKX code"
          className="min-w-[220px] flex-1 border border-[#201e1d]/40 bg-[#f3f2f2] px-3 py-2.5 text-[13px] text-[#201e1d]"
        />
      </div>

      {/* Hold notice */}
      {pendingCount > 0 && (
        <div className="mt-4 flex items-start gap-2.5 border-l-2 border-[#ec3013] bg-[#ec3013]/[.07] p-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8250e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-px flex-none">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div className="text-[12.5px] leading-relaxed text-[#201e1d]/75">
            {pendingCount === 1
              ? "One reservation is on a 15-minute hold while the guest pays. The room stays blocked until the timer runs out, then the hold is released automatically."
              : `${pendingCount} reservations are on 15-minute holds while guests pay. Those rooms stay blocked until the timers run out.`}
          </div>
        </div>
      )}

      {/* Table (desktop) */}
      {rows.length > 0 && (
        <div className="mt-6 hidden overflow-x-auto border border-[#201e1d]/40 md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#201e1d]/40 bg-[#eae9e9]">
                {["Confirmation", "Guest", "Room", "Dates", "Guests", "Total", "Status", ""].map(
                  (h, i) => (
                    <th
                      key={h + i}
                      className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#201e1d]/60 ${
                        h === "Guests" || h === "Total" ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#201e1d]/20 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-extrabold tabular-nums">{r.id}</td>
                  <td className="px-4 py-3 text-sm font-extrabold">{r.guest}</td>
                  <td className="px-4 py-3 text-[13px] text-[#201e1d]/70">{r.room}</td>
                  <td className="px-4 py-3 text-[13px] tabular-nums">
                    {r.dates}
                    <span className="ml-1.5 text-[11px] text-[#201e1d]/50">{r.nights}n</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums">{r.guests}</td>
                  <td className="px-4 py-3 text-right text-sm font-extrabold tabular-nums">
                    {peso(r.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusTag r={r} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#ec3013] hover:text-[#b8250e]"
                      onClick={() => {
                        // navigate to /folio?id=r.id in a real app
                      }}
                    >
                      {r.status === "PENDING" ? "View hold" : "Folio"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards (mobile) */}
      {rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 md:hidden">
          {rows.map((r) => (
            <div key={r.id} className="border border-[#201e1d]/40">
              <div className="flex items-start justify-between gap-3 border-b-2 border-[#201e1d]/40 p-4">
                <div>
                  <div className="text-[15px] font-extrabold">{r.guest}</div>
                  <div className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#201e1d]/55">
                    {r.id}
                  </div>
                </div>
                <StatusTag r={r} />
              </div>
              <div className="grid grid-cols-3 border-b-2 border-[#201e1d]/40">
                <div className="border-r-2 border-[#201e1d]/40 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#201e1d]/55">
                    Dates
                  </div>
                  <div className="mt-1 text-[13px] font-extrabold tabular-nums">{r.dates}</div>
                  <div className="mt-0.5 text-[11px] text-[#201e1d]/55">
                    {r.nights} {r.nights === 1 ? "night" : "nights"}
                  </div>
                </div>
                <div className="border-r-2 border-[#201e1d]/40 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#201e1d]/55">
                    Guests
                  </div>
                  <div className="mt-1 text-base font-extrabold tabular-nums">{r.guests}</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#201e1d]/55">
                    Total
                  </div>
                  <div className="mt-1 text-base font-extrabold tabular-nums">{peso(r.total)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="text-xs text-[#201e1d]/60">{r.room}</div>
                <button
                  type="button"
                  className="border border-[#201e1d]/40 px-3 py-2 text-xs font-semibold text-[#201e1d]"
                >
                  {r.status === "PENDING" ? "View hold" : "Folio"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state: no reservations at all */}
      {RESERVATIONS.length === 0 && (
        <div className="mt-6 border border-[#201e1d]/40 p-10 text-center">
          <div className="text-xl font-extrabold tracking-tight">No reservations yet</div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#201e1d]/60">
            Bookings taken on the guest site land here the moment a hold is placed. Check your
            rooms are listed and available so guests can find them.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 bg-[#ec3013] px-4 py-3 font-heading text-[13px] font-extrabold text-[#f3f2f2] hover:bg-[#d32a10]"
          >
            Review rooms
          </button>
        </div>
      )}

      {/* Empty state: filter matched nothing */}
      {filterEmpty && (
        <div className="mt-6 border border-[#201e1d]/40 p-8">
          <div className="text-[17px] font-extrabold tracking-tight">
            No {filter.replace("_", " ").toLowerCase()} reservations
          </div>
          <div className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[#201e1d]/60">
            {filter === "PENDING"
              ? "No guest is mid-payment right now. Holds appear here for 15 minutes while a booking is being paid for, then clear themselves."
              : "Nothing matches this status. Other reservations may still exist under a different one."}
          </div>
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className="mt-4 inline-flex items-center gap-2 border border-[#201e1d]/40 px-3.5 py-2.5 text-[13px] font-semibold text-[#201e1d] hover:bg-[#ec3013]/10 hover:text-[#b8250e]"
          >
            Show all reservations
          </button>
        </div>
      )}
    </div>
  );
}