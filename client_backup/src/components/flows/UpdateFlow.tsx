import React from 'react';
import DateTimePartyPicker from '../DateTimePartyPicker';
import ReferenceForm from '../ReferenceForm';
import { Booking } from '../../types';

export default function UpdateFlow({
  booking, onAskRef, onSubmit,
}: {
  booking: Booking | null;
  onAskRef: (ref: string) => void;
  onSubmit: (iso: string, time: string, party: number) => void;
}) {
  if (!booking) {
    return (
      <ReferenceForm
        label="Enter your booking reference to edit your booking"
        onSubmit={onAskRef}
      />
    );
  }
  return (
    <div className="picker-wrapper">
      <DateTimePartyPicker
        initialDate={new Date(booking.visit_date)}
        initialTime={booking.visit_time}
        initialPartySize={booking.party_size}
        onSubmit={(d, t, p) => onSubmit(d.toISOString().slice(0,10), t, p)}
      />
    </div>
  );
}
