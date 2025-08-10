import React from 'react';
import DateTimePartyPicker from '../DateTimePartyPicker';

export default function CreateFlow({
  onSubmit,
}: {
  onSubmit: (iso: string, time: string, party: number) => void;
}) {
  return (
    <div className="picker-wrapper">
      <DateTimePartyPicker
        onSubmit={(date, time, party) => onSubmit(date.toISOString().slice(0,10), time, party)}
      />
    </div>
  );
}
