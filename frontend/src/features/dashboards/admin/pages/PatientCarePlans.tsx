import React, { useEffect, useState } from "react";
import { fmtDate } from '../../../../utils/dateTime';
import { getAllBookings } from "../../../../api/bookings/admin-booking.api";
import type { Booking, BookingStatus } from "../../../../api/bookings/booking.types";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import Pagination from "../../common/Pagination";
import { IconHeart } from "../../common/icons";

const PAGE_SIZE = 10;

interface Props {
  addToast: (kind: "success" | "error", message: string) => void;
}

// Choose the badge color based on the booking status
const statusTone = (status: BookingStatus) => {
  switch (status) {
    case "active":
      return "emerald";
    case "pending_payment":
      return "amber";
    case "cancelled":
      return "slate";
    default:
      return "slate";
  }
};

// PatientCarePlans
// Page for admins to see all care plan purchases and their details
const PatientCarePlans: React.FC<Props> = ({ addToast }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Loads all care plan bookings from the server
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      // Sort bookings by creation date descending
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(data);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load care plan bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const paginated = bookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <TableShell
      title="Patient Care Plans"
      subtitle="View all care plan subscriptions purchased by family members."
      right={
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          <IconHeart className="h-4 w-4 text-emerald-500" />
          {bookings.length} Total Subscriptions
        </div>
      }
    >
      {/* Show loading spinner while fetching data */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Purchased By</th>
                  <th className="px-4 py-3">Care Plan</th>
                  <th className="px-4 py-3">Price / Duration</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {booking.patient?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {booking.user?.user?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {booking.carePlanSnapshot?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Rs {booking.carePlanSnapshot?.price?.toFixed(2) || "0.00"} /{" "}
                      {booking.carePlanSnapshot?.duration} {booking.carePlanSnapshot?.durationUnit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {fmtDate(booking.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(booking.status)}>
                        {booking.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => addToast("success", "Viewing details (coming soon)")}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No care plan bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={bookings.length}
                pageSize={PAGE_SIZE}
                itemLabel="subscriptions"
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </TableShell>
  );
};

export default PatientCarePlans;