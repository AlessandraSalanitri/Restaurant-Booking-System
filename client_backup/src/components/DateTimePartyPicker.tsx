import React, { useState } from 'react';

interface Props {
  initialDate?: Date;
  initialTime?: string;
  initialPartySize?: number;
  onSubmit: (date: Date, time: string, partySize: number) => void;
}

// Format YYYY-MM-DD for date input
// can be adjusted for local timezone
const formatLocalDate = (d: Date) => {
  const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return dt.toISOString().slice(0, 10);
};

export default function DateTimePartyPicker({
  initialDate,
  initialTime,
  initialPartySize,
  onSubmit,
}: Props) {
  const [date, setDate] = useState<Date>(initialDate ?? new Date());
  const [time, setTime] = useState<string>(initialTime ?? '');
  const [partySize, setPartySize] = useState<number>(initialPartySize ?? 1);

  return (
    <div className="dtp">
      <input
        className="dtp__input dtp__input--date"
        type="date"
        value={formatLocalDate(date)}
        onChange={(e) => setDate(new Date(`${e.target.value}T00:00:00`))}
        aria-label="Visit date"
      />

      <input
        className="dtp__input dtp__input--time"
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        placeholder="19:00"
        aria-label="Visit time"
      />

      <input
        className="dtp__input dtp__input--num"
        type="number"
        min={1}
        value={partySize}
        onChange={(e) => setPartySize(Number(e.target.value))}
        aria-label="Party size"
      />

      <button
        className="dtp__btn"
        onClick={() => onSubmit(date, time, partySize)}
      >
        Confirm
      </button>
    </div>
  );
}
