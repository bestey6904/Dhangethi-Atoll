
import React, { useState, useEffect } from 'react';
import { Room, Staff, TransferStatus } from '../types';
import { STAFF } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: {
    roomIds: string[];
    guestName: string;
    startDate: string;
    endDate: string;
    staffId: string;
    notes: string;
    hasTransfer?: boolean;
    transferDetails?: {
      time: string;
      returnTime?: string;
      status: TransferStatus;
    };
  }) => void;
  selectedRoomId?: string;
  rooms: Room[];
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedRoomId,
  rooms
}) => {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [duration, setDuration] = useState(1);
  const [staffId, setStaffId] = useState(STAFF[0].id);
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Speedboat states
  const [hasTransfer, setHasTransfer] = useState(false);
  const [transferTime, setTransferTime] = useState('10:45');
  const [returnTime, setReturnTime] = useState('07:00');
  const [transferStatus, setTransferStatus] = useState<TransferStatus>(TransferStatus.PENDING);

  const getDepartureTimes = (dateStr: string) => {
    if (!dateStr) return ["10:45", "16:00"];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay();
    if (day === 5) return ["09:45", "16:00"];
    return ["10:45", "16:00"];
  };

  const getReturnTimes = () => {
    return ["07:00", "14:00"];
  };

  const departureTimes = getDepartureTimes(startDate);
  const returnTimes = getReturnTimes();

  useEffect(() => {
    if (isOpen) {
      setSelectedRoomIds(selectedRoomId ? [selectedRoomId] : []);
      setPin('');
      setError(null);
      setHasTransfer(false);
    }
  }, [isOpen, selectedRoomId]);

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      setDuration(diffDays);
    }
  }, [startDate, endDate]);

  // Adjust times if selections become invalid after date change
  useEffect(() => {
    if (!departureTimes.includes(transferTime)) {
      setTransferTime(departureTimes[0]);
    }
  }, [startDate, departureTimes]);

  useEffect(() => {
    if (!returnTimes.includes(returnTime)) {
      setReturnTime(returnTimes[0]);
    }
  }, [endDate, returnTimes]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setDuration(val);
    const start = new Date(startDate);
    start.setDate(start.getDate() + val);
    setEndDate(start.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!guestName || !startDate || !endDate || selectedRoomIds.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }

    const selectedStaff = STAFF.find(s => s.id === staffId);
    if (!selectedStaff) return;

    if (pin !== selectedStaff.pin) {
      setError("Invalid Security PIN for " + selectedStaff.name);
      return;
    }

    onSubmit({ 
      roomIds: selectedRoomIds, 
      guestName, 
      startDate, 
      endDate, 
      staffId, 
      notes,
      hasTransfer,
      transferDetails: hasTransfer ? { time: transferTime, returnTime, status: transferStatus } : undefined
    });
    onClose();
  };

  const toggleRoom = (id: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">New Guest Booking</h3>
            <p className="text-xs text-slate-500">Includes Room and Transfer management</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold animate-pulse">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  placeholder="Full name of guest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Stay Duration (Nights)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={handleDurationChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Rooms</label>
              <div className="flex-1 border border-slate-200 rounded-lg overflow-y-auto max-h-[180px] p-2 space-y-1 bg-slate-50">
                {rooms.map(room => (
                  <label 
                    key={room.id} 
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      selectedRoomIds.includes(room.id) ? 'bg-teal-50 border-teal-100 border' : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedRoomIds.includes(room.id)}
                        onChange={() => toggleRoom(room.id)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700">{room.name}</span>
                        <span className="block text-[10px] text-slate-400 uppercase">{room.type}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Speedboat Section */}
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-teal-500 p-1.5 rounded-lg text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-800">Speedboat Transfer</h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={hasTransfer} onChange={(e) => setHasTransfer(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {hasTransfer && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Departure Time</label>
                    <select 
                      value={transferTime} 
                      onChange={(e) => setTransferTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      {departureTimes.map(t => (
                        <option key={t} value={t}>{t} {t === "16:00" ? "Evening" : "Morning"}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Return Time</label>
                    <select 
                      value={returnTime} 
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      {returnTimes.map(t => (
                        <option key={t} value={t}>{t} {t === "14:00" ? "Afternoon" : "Morning"}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Transfer Status</label>
                  <select 
                    value={transferStatus} 
                    onChange={(e) => setTransferStatus(e.target.value as TransferStatus)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {Object.values(TransferStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Staff Member</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              >
                {STAFF.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Security PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-center tracking-[0.5em] font-black"
                placeholder="••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Requests</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none h-16 resize-none"
              placeholder="Any special details..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedRoomIds.length === 0 || pin.length < 4}
              className="flex-[2] px-4 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify & Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
