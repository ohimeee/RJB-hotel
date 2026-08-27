import { redirect } from "next/navigation";

import { getReservationByCode } from "@/lib/reservations";

/**
 * Code lookup, which is the whole of "my bookings" when guests have no
 * accounts. The code is the only thing tying a person to a reservation.
 */
const FindBookingPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ notFound?: string }>;
}) => {
  const missed = Boolean((await searchParams).notFound);

  const lookUp = async (formData: FormData) => {
    "use server";

    const code = String(formData.get("code") ?? "")
      .trim()
      .toUpperCase();

    // Bounce back with a flag rather than throwing: a mistyped code is a typo,
    // not an error page. This also keeps the response identical whether the
    // code exists or not, so the form cannot be used to enumerate bookings.
    if (!code || !(await getReservationByCode(code))) {
      redirect("/find-booking?notFound=1");
    }

    redirect(`/booking/${encodeURIComponent(code)}`);
  };

  return (
    <div className="flex-col">
      <div className="border-b-2 py-5">
        <p className="text-xs font-medium text-orange-500">GUEST LOOKUP</p>
        <h1 className="text-4xl font-bold">Find your booking</h1>
      </div>

      <form action={lookUp} className="my-8 flex-col">
        <label htmlFor="code" className="text-xs text-gray-500">
          Confirmation code
        </label>
        <div className="mt-2 flex w-full max-w-md">
          <input
            id="code"
            name="code"
            required
            placeholder="IKX-4820"
            className="flex-1 border-2 border-gray-400 bg-gray-200 p-3 tracking-widest uppercase"
          />
          <button
            type="submit"
            className="bg-orange-500 px-6 text-sm font-bold tracking-wider text-white"
          >
            Find
          </button>
        </div>

        {missed ? (
          <p role="alert" className="mt-3 text-sm text-orange-700">
            No booking matches that code. Check it against your confirmation
            email.
          </p>
        ) : null}
      </form>
    </div>
  );
};

export default FindBookingPage;
