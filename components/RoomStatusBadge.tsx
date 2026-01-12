
import React from 'react';
import { RoomStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface RoomStatusBadgeProps {
  status: RoomStatus;
  onClick?: () => void;
}

const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ status, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[status]} transition-all active:scale-95`}
    >
      {status}
    </button>
  );
};

export default RoomStatusBadge;
