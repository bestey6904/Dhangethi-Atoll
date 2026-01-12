
import React, { useState, useEffect } from 'react';
import { TransferStatus, SpeedboatBooking } from '../types';
import { STAFF } from '../constants';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SpeedboatBooking, 'id'>) => void;
  initialDate?: string;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onSubmit, initialDate }) => {
  const [guestName, setGuestName] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:45');
  const [hasReturn, setHasReturn] = useState(false);
  const [returnDate, setReturnDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('07:00');
  const [route, setRoute] = useState('Male to Dhangethi');
  const [seats, setSeats] = useState(1);
  const [status, setStatus] = useState<TransferStatus>(TransferStatus.PENDING);
  const [staffId, setStaffId] = useState(STAFF[0].id);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getDepartureTimes = (dateStr: string) => {
    if (!dateStr) return ["10:45", "16:00"];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay(); // 5=Fri
    if (day === 5) return ["09:45", "16:00"];
    return ["10:45", "16:00"];
  };

  const getReturnTimes = () => {
    return ["07:00", "14:00"];
  };

  const departureTimes = getDepartureTimes(date);
  const returnTimes = getReturnTimes();

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      if (initialDate) {
        setDate(initialDate);
        setReturnDate(initialDate);
      }
    }
  }, [isOpen, initialDate]);

  // Adjust time if current selection is not in valid list for day
  useEffect(() => {
    if (!departureTimes.includes(time)) {
      setTime(departureTimes[0]);
    }
  }, [date, departureTimes]);

  useEffect(() => {
    if (!returnTimes.includes(returnTime)) {
      setReturnTime(returnTimes[0]);
    }
  }, [returnDate, returnTimes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = STAFF.find(s => s.id === staffId);
    if (!staff || pin !== staff.pin) {
      setError("Incorrect Security PIN for " + (staff?.name || "Staff"));
      return;
    }

    onSubmit({
      guestName,
      date,
      time,
      returnDate: hasReturn ? returnDate : undefined,
      returnTime: hasReturn ? returnTime : undefined,
      route,
      seats,
      status,
      staffId
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-teal-50/30">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Assign Speedboat</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Logistics Management</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-bold">{error}</div>}
          
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest Name</label>
            <input 
              required 
              value={guestName} 
              onChange={e => setGuestName(e.target.value)} 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
              placeholder="Guest name for transport"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure Time</label>
              <select 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {departureTimes.map(t => (
                  <option key={t} value={t}>{t} {t === "16:00" ? "Evening" : "Morning"}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="hasReturn" 
              checked={hasReturn} 
              onChange={e => setHasReturn(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <label htmlFor="hasReturn" className="text-xs font-bold text-slate-600 cursor-pointer">Include Return Trip</label>
          </div>

          {hasReturn && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Return Date</label>
                <input 
                  type="date" 
                  required 
                  value={returnDate} 
                  onChange={e => setReturnDate(e.target.value)} 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Return Time</label>
                <select 
                  value={returnTime} 
                  onChange={e => setReturnTime(e.target.value)} 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {returnTimes.map(t => (
                    <option key={t} value={t}>{t} {t === "14:00" ? "Afternoon" : "Morning"}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Route & Transfer Status</label>
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={route} 
                onChange={e => setRoute(e.target.value)} 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="Male to Dhangethi">Male to Dhangethi</option>
                <option value="Dhangethi to Male">Dhangethi to Male</option>
                <option value="Airport to Dhangethi">Airport to Dhangethi</option>
              </select>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as TransferStatus)} 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {Object.values(TransferStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned By</label>
               <select 
                 value={staffId} 
                 onChange={e => setStaffId(e.target.value)} 
                 className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"
               >
                 {STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">PIN</label>
               <input 
                 type="password" 
                 required 
                 maxLength={4} 
                 value={pin} 
                 onChange={e => setPin(e.target.value)} 
                 className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm text-center tracking-[0.5em] font-black"
                 placeholder="••••"
               />
             </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all active:scale-95 mt-4"
          >
            Confirm Assignment
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
