
import React, { useState, useMemo, useEffect } from 'react';
import { ROOMS, STAFF, STATUS_INDICATOR, STAFF_COLORS } from './constants';
import { Room, Booking, RoomStatus, RoomType, TransferStatus, SpeedboatBooking } from './types';
import { getDaysInMonth, isSameDay, isDateInRange } from './utils';
import RoomStatusBadge from './components/RoomStatusBadge';
import BookingModal from './components/BookingModal';
import TransferModal from './components/TransferModal';
import VoiceAssistant from './components/VoiceAssistant';
import { getSmartSummary } from './geminiService';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [speedboatBookings, setSpeedboatBookings] = useState<SpeedboatBooking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<string | undefined>();
  const [selectedDateForTransfer, setSelectedDateForTransfer] = useState<string | undefined>();
  const [smartSummary, setSmartSummary] = useState<string>("Loading smart status...");
  const [activeStaffId, setActiveStaffId] = useState<string>(STAFF[0].id);

  const days = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const staffBookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAFF.forEach(s => (counts[s.id] = 0));
    bookings.forEach(b => {
      if (counts[b.staffId] !== undefined) counts[b.staffId]++;
    });
    speedboatBookings.forEach(b => {
      if (counts[b.staffId] !== undefined) counts[b.staffId]++;
    });
    return counts;
  }, [bookings, speedboatBookings]);

  const upcomingTransfers = useMemo(() => {
    const allTransfers = [
      ...bookings.filter(b => b.hasTransfer).map(b => ({
        id: b.id,
        guestName: b.guestName,
        time: b.transferDetails?.time || 'N/A',
        returnTime: b.transferDetails?.returnTime,
        date: b.startDate,
        status: b.transferDetails?.status
      })),
      ...speedboatBookings.map(b => ({
        id: b.id,
        guestName: b.guestName,
        time: b.time,
        returnTime: b.returnTime,
        date: b.date,
        status: b.status
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return allTransfers.slice(0, 8);
  }, [bookings, speedboatBookings]);

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getSmartSummary(bookings, rooms);
      setSmartSummary(summary);
    };
    fetchSummary();
  }, [bookings, rooms]);

  const handleAddBooking = (data: {
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
  }) => {
    const newBookings: Booking[] = data.roomIds.map(roomId => ({
      id: Math.random().toString(36).substr(2, 9),
      roomId,
      guestName: data.guestName,
      startDate: data.startDate,
      endDate: data.endDate,
      staffId: data.staffId,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      hasTransfer: data.hasTransfer,
      transferDetails: data.transferDetails
    }));
    
    setBookings(prev => [...prev, ...newBookings]);
    
    const today = new Date();
    setRooms(prev => prev.map(r => 
      data.roomIds.includes(r.id) && isDateInRange(today, data.startDate, data.endDate)
        ? { ...r, status: RoomStatus.OCCUPIED }
        : r
    ));
  };

  const handleAddTransfer = (data: Omit<SpeedboatBooking, 'id'>) => {
    const newTransfer: SpeedboatBooking = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    };
    setSpeedboatBookings(prev => [...prev, newTransfer]);
  };

  const updateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
  };

  const toggleRoomStatus = (roomId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const statuses = Object.values(RoomStatus);
        const currentIndex = statuses.indexOf(r.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...r, status: statuses[nextIndex] };
      }
      return r;
    }));
  };

  const navigateMonth = (direction: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + direction);
    setCurrentDate(next);
  };

  const twinRooms = rooms.filter(r => r.type === RoomType.TWIN);
  const doubleRooms = rooms.filter(r => r.type === RoomType.DOUBLE);

  const RoomSection = ({ title, roomList }: { title: string, roomList: Room[] }) => (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-4">{title}</h3>
      {roomList.map(room => (
        <div key={room.id} className="flex border-b border-slate-100 group">
          <div className="w-48 flex-shrink-0 p-3 bg-white border-r border-slate-100 flex items-center justify-between sticky left-0 z-10 shadow-sm">
            <div>
              <div className="font-semibold text-slate-700 text-sm">{room.name}</div>
              <RoomStatusBadge status={room.status} onClick={() => toggleRoomStatus(room.id)} />
            </div>
            <button 
              onClick={() => { setSelectedRoomForBooking(room.id); setIsModalOpen(true); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-slate-100 text-teal-600 transition-all"
              title="Add Booking"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1">
            {days.map(day => {
              const booking = bookings.find(b => b.roomId === room.id && isDateInRange(day, b.startDate, b.endDate));
              const isStart = booking && isSameDay(day, new Date(booking.startDate));
              const isToday = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              let staffColors = { bg: 'bg-teal-500', solid: 'bg-teal-600', light: 'bg-teal-100' };
              let stayDuration = 0;
              
              if (booking) {
                stayDuration = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
                staffColors = STAFF_COLORS[booking.staffId] || staffColors;
              }

              return (
                <div 
                  key={day.getTime()} 
                  className={`w-12 h-14 flex-shrink-0 border-r border-slate-50 relative group/cell flex items-center justify-center
                    ${isWeekend ? 'bg-slate-50/50' : 'bg-white'} 
                    ${isToday ? 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-500' : ''}
                  `}
                >
                  {booking ? (
                    <div className={`
                      absolute inset-y-2 inset-x-0.5 rounded-sm z-1
                      ${isStart ? `${staffColors.solid} rounded-l-md ml-1 shadow-md` : `${staffColors.bg}/80`}
                      group-hover/cell:z-20 group-hover/cell:scale-105 transition-all cursor-pointer
                    `}>
                      {isStart && (
                        <div className="flex flex-col px-1.5 py-0.5 overflow-hidden relative">
                          <span className="text-[9px] text-white font-bold leading-tight truncate">
                            {booking.guestName.split(' ')[0]}
                          </span>
                          <span className="text-[8px] text-white/70 font-medium leading-tight flex items-center gap-1">
                            {stayDuration}d 
                            {booking.hasTransfer && (
                              <svg className="w-2.5 h-2.5 text-teal-200" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            )}
                          </span>
                        </div>
                      )}
                      
                      <div className="invisible group-hover/cell:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 border border-white/10">
                        <div className="flex justify-between items-start mb-1.5 border-b border-white/10 pb-1.5">
                          <span className="font-bold text-sm">{booking.guestName}</span>
                          <span className={`${staffColors.solid} px-1.5 py-0.5 rounded text-[10px]`}>{stayDuration} Nights</span>
                        </div>
                        
                        {booking.hasTransfer && (
                          <div className="bg-teal-500/20 p-2 rounded-lg mb-2 border border-teal-500/30">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-300">
                              <span>Speedboat Transfer</span>
                              <span className="bg-teal-500/40 px-1 rounded">{booking.transferDetails?.status}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium mt-1">
                              <p>Departure: {booking.transferDetails?.time}</p>
                              {booking.transferDetails?.returnTime && <p>Return: {booking.transferDetails?.returnTime}</p>}
                            </div>
                          </div>
                        )}

                        <p className="opacity-70 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(booking.startDate).toLocaleDateString()} — {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                        <p className="mt-2 border-t border-white/10 pt-2 flex items-center justify-between">
                          <span className="opacity-60 italic">Res. by {STAFF.find(s => s.id === booking.staffId)?.name}</span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]">{room.name}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setSelectedRoomForBooking(room.id); setIsModalOpen(true); }}
                      className="opacity-0 group-hover/cell:opacity-100 text-slate-200 hover:text-teal-400 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-100 group overflow-hidden">
            <svg className="w-8 h-8 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="10" r="4" fill="currentColor" fillOpacity="0.3" />
               <path d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" />
               <path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" strokeOpacity="0.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Dhangethi <span className="text-teal-600">Atoll</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Active Staff:</span>
          <select 
            value={activeStaffId} 
            onChange={(e) => setActiveStaffId(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-700 outline-none"
          >
            {STAFF.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" /></svg></button>
          <div className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600 shadow-sm"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Assign Boat
          </button>
          <button 
            onClick={() => { setSelectedRoomForBooking(undefined); setIsModalOpen(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-100 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" /></svg>
            New Booking
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 p-4 rounded-2xl text-white shadow-xl shadow-teal-100 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Intelligent Overview</h4>
              <p className="text-sm font-medium leading-relaxed">{smartSummary}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center overflow-y-auto max-h-[140px] no-scrollbar">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-white">Upcoming Logistics</h4>
            {upcomingTransfers.length > 0 ? (
              <div className="space-y-2">
                {upcomingTransfers.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 truncate w-24">{t.guestName}</span>
                      <span className="text-[8px] text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-black px-1.5 py-0.5 rounded text-[9px] ${t.status === TransferStatus.CONFIRMED ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-500'}`}>
                        {t.time}{t.returnTime ? ` / ${t.returnTime}` : ''}
                      </span>
                      <span className="text-[8px] font-bold opacity-40 uppercase">{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">No transfers scheduled</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logistics Key:</span>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">
                <svg className="w-3 h-3 text-teal-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Boat Transfer
             </div>
           </div>
        </div>

        <div className="flex-1 bg-slate-100/50 rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-inner">
          <div className="overflow-x-auto no-scrollbar bg-white">
            <div className="min-w-max">
              <div className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                <div className="w-48 flex-shrink-0 p-4 text-xs font-bold text-slate-400 border-r border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span>SCHEDULE</span>
                </div>
                <div className="flex flex-1">
                  {days.map(day => {
                    const isToday = isSameDay(day, new Date());
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div 
                        key={day.getTime()} 
                        className={`w-12 h-14 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100
                          ${isWeekend ? 'bg-slate-100/50' : 'bg-slate-50'}
                          ${isToday ? 'bg-teal-50 text-teal-600 relative' : ''}
                        `}
                      >
                        {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-teal-600" />}
                        <span className="text-[10px] font-bold opacity-60 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className={`text-sm font-black ${isToday ? 'text-teal-600' : 'text-slate-700'}`}>{day.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logistics Grid (Boat Schedule Row) */}
              <div className="flex border-b border-slate-200 bg-slate-50/30">
                <div className="w-48 flex-shrink-0 p-3 bg-white border-r border-slate-100 flex items-center sticky left-0 z-10 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider leading-none">Boat Transport</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">Assignments</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1">
                  {days.map(day => {
                    const dayStr = day.toISOString().split('T')[0];
                    const dayTransfers = [
                      ...bookings.filter(b => b.hasTransfer && b.startDate === dayStr),
                      ...speedboatBookings.filter(b => b.date === dayStr)
                    ];
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div 
                        key={day.getTime()} 
                        onClick={() => { setSelectedDateForTransfer(dayStr); setIsTransferModalOpen(true); }}
                        className={`w-12 h-12 flex-shrink-0 border-r border-slate-50 relative group/logistics cursor-pointer hover:bg-teal-50 transition-colors
                          ${isToday ? 'bg-teal-50/30' : ''}
                        `}
                      >
                        <div className="flex flex-col gap-0.5 p-0.5 items-center">
                           {dayTransfers.map((t, idx) => (
                             <div key={idx} className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-sm" />
                           ))}
                        </div>
                        
                        {dayTransfers.length > 0 && (
                          <div className="invisible group-hover/logistics:visible absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50">
                            <p className="font-bold border-b border-white/10 pb-1 mb-1">{dayTransfers.length} Transfer(s) Scheduled</p>
                            {dayTransfers.map((t: any, idx) => (
                              <div key={idx} className="flex justify-between py-0.5 opacity-80 border-b border-white/5 last:border-0">
                                <span>{t.guestName}</span>
                                <div className="text-right">
                                  <span className="text-teal-400 font-black block">{t.time || t.transferDetails?.time}{t.returnTime || t.transferDetails?.returnTime ? ` ⇄ ${t.returnTime || t.transferDetails?.returnTime}` : ''}</span>
                                  <span className="text-[8px] opacity-60 uppercase">{(t.status || t.transferDetails?.status)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="max-h-[calc(100vh-450px)] overflow-y-auto no-scrollbar pb-8">
                <RoomSection title="Twin Rooms" roomList={twinRooms} />
                <RoomSection title="Double Bed Rooms" roomList={doubleRooms} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <VoiceAssistant rooms={rooms} onBook={handleAddBooking} onUpdateStatus={updateRoomStatus} activeStaffId={activeStaffId} />

      <footer className="bg-white border-t border-slate-200 p-4 flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider uppercase">
        <div className="flex items-center gap-4">
          <span>Logistics Engine v2.8.0</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"/>
          <a href="https://ai.studio/apps/drive/1jSpcNhbJ417q2i6JiZG6clNBhunUJcHM" target="_blank" rel="noopener noreferrer" className="hover:text-teal-500">System Drive (Save Location)</a>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400"/> Operational</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded">© 2024 DHANGETHI ATOLL INC.</span>
        </div>
      </footer>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddBooking} selectedRoomId={selectedRoomForBooking} rooms={rooms} />
      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => { setIsTransferModalOpen(false); setSelectedDateForTransfer(undefined); }} 
        onSubmit={handleAddTransfer} 
        initialDate={selectedDateForTransfer} 
      />
    </div>
  );
};

export default App;
