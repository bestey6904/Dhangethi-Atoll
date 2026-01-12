import { RoomType, Room, Staff, RoomStatus } from './types';

export const ROOMS: Room[] = [
  // Twin Rooms
  { id: '101', name: 'Room 101', type: RoomType.TWIN, status: RoomStatus.READY },
  { id: '102', name: 'Room 102', type: RoomType.TWIN, status: RoomStatus.READY },
  { id: '103', name: 'Room 103', type: RoomType.TWIN, status: RoomStatus.READY },
  { id: '202', name: 'Room 202', type: RoomType.TWIN, status: RoomStatus.READY },
  { id: '203', name: 'Room 203', type: RoomType.TWIN, status: RoomStatus.READY },
  { id: '204', name: 'Room 204', type: RoomType.TWIN, status: RoomStatus.READY },
  // Double Bed Rooms
  { id: '104', name: 'Room 104', type: RoomType.DOUBLE, status: RoomStatus.READY },
  { id: '105', name: 'Room 105', type: RoomType.DOUBLE, status: RoomStatus.READY },
  { id: '106', name: 'Room 106', type: RoomType.DOUBLE, status: RoomStatus.READY },
  { id: '201', name: 'Room 201', type: RoomType.DOUBLE, status: RoomStatus.READY },
  { id: '205', name: 'Room 205', type: RoomType.DOUBLE, status: RoomStatus.READY },
  { id: '206', name: 'Room 206', type: RoomType.DOUBLE, status: RoomStatus.READY },
  { id: '301', name: 'Room 301', type: RoomType.DOUBLE, status: RoomStatus.READY },
];

export const STAFF: Staff[] = [
  { id: 's1', name: 'Bestey', pin: '6904' },
  { id: 's2', name: 'Faari', pin: '4712' },
  { id: 's3', name: 'Fazaal', pin: '9305' },
  { id: 's4', name: 'Sliver', pin: '2184' },
  { id: 's5', name: 'Aisha', pin: '6593' },
  { id: 's6', name: 'Fathu', pin: '1047' },
  { id: 's7', name: 'Bulky', pin: '3826' },
  { id: 's8', name: 'Zayan', pin: '7450' },
  { id: 's9', name: 'Mari', pin: '5918' },
  { id: 's10', name: 'Ibbe', pin: '0632' },
];

export const STAFF_COLORS: Record<string, { bg: string, text: string, solid: string, light: string }> = {
  's1': { bg: 'bg-indigo-500', text: 'text-indigo-600', solid: 'bg-indigo-600', light: 'bg-indigo-100' }, // Bestey
  's2': { bg: 'bg-emerald-500', text: 'text-emerald-600', solid: 'bg-emerald-600', light: 'bg-emerald-100' }, // Faari
  's3': { bg: 'bg-rose-500', text: 'text-rose-600', solid: 'bg-rose-600', light: 'bg-rose-100' }, // Fazaal
  's4': { bg: 'bg-amber-500', text: 'text-amber-600', solid: 'bg-amber-600', light: 'bg-amber-100' }, // Sliver
  's5': { bg: 'bg-sky-500', text: 'text-sky-600', solid: 'bg-sky-600', light: 'bg-sky-100' }, // Aisha
  's6': { bg: 'bg-violet-500', text: 'text-violet-600', solid: 'bg-violet-600', light: 'bg-violet-100' }, // Fathu
  's7': { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', solid: 'bg-fuchsia-600', light: 'bg-fuchsia-100' }, // Bulky
  's8': { bg: 'bg-lime-500', text: 'text-lime-600', solid: 'bg-lime-600', light: 'bg-lime-100' }, // Zayan
  's9': { bg: 'bg-orange-500', text: 'text-orange-600', solid: 'bg-orange-600', light: 'bg-orange-100' }, // Mari
  's10': { bg: 'bg-teal-500', text: 'text-teal-600', solid: 'bg-teal-600', light: 'bg-teal-100' }, // Ibbe
};

export const STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.READY]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [RoomStatus.OCCUPIED]: 'bg-blue-100 text-blue-700 border-blue-200',
  [RoomStatus.CLEANING]: 'bg-amber-100 text-amber-700 border-amber-200',
  [RoomStatus.OUT_OF_ORDER]: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const STATUS_INDICATOR: Record<RoomStatus, string> = {
  [RoomStatus.READY]: 'bg-emerald-500',
  [RoomStatus.OCCUPIED]: 'bg-blue-500',
  [RoomStatus.CLEANING]: 'bg-amber-500',
  [RoomStatus.OUT_OF_ORDER]: 'bg-rose-500',
};
