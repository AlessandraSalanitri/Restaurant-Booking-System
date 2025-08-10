import React from 'react';
import { Mode } from '../types';

interface Props {
  selected: Mode;
  onSelect: (mode: Mode) => void;
}

export default function OptionButtons({ selected, onSelect }: Props) {
  const options: { value: Mode; label: string }[] = [
    { value: 'availability', label: 'Check Availability' },
    { value: 'create',       label: 'Book a Table' },
    { value: 'get',          label: 'View Your Booking' },
    { value: 'update',       label: 'Edit Your Booking' },
    { value: 'cancel',       label: 'Cancel Booking' },
  ];

  return (
    <div className="options-bar">
      {options.map(({ value, label }) => (
        <button
          key={value}
          className={selected === value ? 'active' : ''}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
