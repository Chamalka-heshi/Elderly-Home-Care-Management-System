import React, { useState, useEffect, useMemo } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

//  NEW API IMPORTS 
import { 
  getMySlots, 
  acceptChannelingSlot,
  rejectChannelingSlot 
} from "../../../../api/channeling/doctor-channeling.api";

import { 
  getMyDoctorProfile, 
  setDoctorAvailability 
} from "../../../../api/users/doctor-profile.api";

import { 
  type ChannelingSlot, 
  fmt12, 
  fmtDate 
} from "../../../../api/channeling/channeling.types";
// 

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ChannelingManager: React.FC = () => {
  const [slots, setSlots] = useState<ChannelingSlot[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slotsData, profileData] = await Promise.all([ getMySlots(), getMyDoctorProfile() ]);
      setSlots(slotsData);
      setDoctorInfo(profileData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ULTIMATE AGGRESSIVE PARSER (Protects Doctor Dashboard from crashing)
  const parsedAvailableDays = useMemo(() => {
    if (!doctorInfo || !doctorInfo.availableDays) return [];
    
    let rawData: any = doctorInfo.availableDays;
    
    if (Array.isArray(rawData)) return rawData;

    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch(e) {}
      try { if (typeof rawData === 'string') rawData = JSON.parse(rawData); } catch(e) {}

      if (Array.isArray(rawData)) return rawData;

      if (typeof rawData === 'string') {
        return String(doctorInfo.availableDays)
          .replace(/[\[\]"'\\]/g, '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  }, [doctorInfo]);

  const hasSetAvailability = parsedAvailableDays.length > 0 || (doctorInfo && doctorInfo.availableTimeStart);

  const handleSetAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) return alert("Please select at least one day.");
    
    try {
      const updatedProfile = await setDoctorAvailability({
        availableDays: selectedDays,
        availableTimeStart: startTime,
        availableTimeEnd: endTime,
      });
      setDoctorInfo(updatedProfile);
      alert("Availability successfully submitted to Admin.");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const toggleDay = (day: string) => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      const updatedSlot = action === 'accept' ? await acceptChannelingSlot(id) : await rejectChannelingSlot(id);
      setSlots(prev => prev.map(s => s.id === id ? updatedSlot : s));
    } catch (error: any) {
      alert(`Failed to ${action} slot: ${error.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your schedule...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Channeling Schedule</h1>
        <p className="text-sm text-slate-500">Manage your availability and approve admin-assigned slots.</p>
      </div>

      {!hasSetAvailability ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Set Your Availability (One-Time Setup)</h2>
          <p className="text-sm text-blue-700 mb-4">Indicate your preferred working days and times. The Admin will use this to assign your slots.</p>
          
          <form onSubmit={handleSetAvailability} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">Preferred Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button type="button" key={day} onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      selectedDays.includes(day) ? "bg-blue-600 text-white shadow-md" : "bg-white text-blue-700 border border-blue-200"
                    }`}>{day}</button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">Start Time</label>
                <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-xl border-blue-200 p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">End Time</label>
                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-xl border-blue-200 p-2.5 text-sm" />
              </div>
            </div>

            <button type="submit" className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700">
              Submit Availability to Admin
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Registered Availability</p>
            <p className="text-sm font-medium text-slate-800 mt-1">
              {parsedAvailableDays.length > 0 ? parsedAvailableDays.join(", ") : 'Any day'} &bull;{' '}
              {doctorInfo.availableTimeStart ? fmt12(doctorInfo.availableTimeStart) : ''} to{' '}
              {doctorInfo.availableTimeEnd ? fmt12(doctorInfo.availableTimeEnd) : ''}
            </p>
          </div>
          <span className="text-xs text-slate-400 italic">Contact admin to change</span>
        </div>
      )}

      <TableShell title="Assigned Slots" subtitle="Approve or reject slots created by the Admin.">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time Window</th>
                <th className="px-4 py-3">Max Patients</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No slots assigned yet.</td></tr>
              ) : slots.map((s) => (
                <tr key={s.id} className={`transition hover:bg-slate-50/60 ${s.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{fmtDate(s.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmt12(s.startTime)} - {fmt12(s.endTime)}</td>
                  <td className="px-4 py-3 text-slate-600">{s.maxPatients}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'pending' ? 'amber' : s.status === 'active' ? 'blue' : s.status === 'rejected' ? 'red' : 'slate'}>
                      {s.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleAction(s.id, 'accept')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700">
                          Accept
                        </button>
                        <button onClick={() => handleAction(s.id, 'reject')} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200">
                          Reject
                        </button>
                      </div>
                    )}
                    {s.status !== 'pending' && <span className="text-xs text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

export default ChannelingManager;