
export enum RoomType {
  TWIN = 'Twin Room',
  DOUBLE = 'Double Bed'
}

export enum RoomStatus {
  READY = 'Ready',
  OCCUPIED = 'Occupied',
  CLEANING = 'Cleaning',
  OUT_OF_ORDER = 'Out of Order'
}

export enum TransferStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  ARRIVED = 'Arrived',
  DEPARTED = 'Departed',
  CANCELLED = 'Cancelled'
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
}

export interface Staff {
  id: string;
  name: string;
  pin: string; // 4-digit security code
}

export interface SpeedboatBooking {
  id: string;
  bookingId?: string; // Optional link to room booking
  guestName: string;
  date: string;
  time: string;
  returnTime?: string;
  returnDate?: string;
  route: string;
  seats: number;
  status: TransferStatus;
  staffId: string;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  staffId: string;
  notes?: string;
  createdAt: string;
  hasTransfer?: boolean;
  transferDetails?: {
    time: string;
    returnTime?: string;
    status: TransferStatus;
  };
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  formatted: string;
}
