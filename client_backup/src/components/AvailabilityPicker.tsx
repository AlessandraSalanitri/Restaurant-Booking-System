import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import React, { useState } from 'react'

interface Props { onSubmit: (date: Date, partySize: number) => void }

export default function AvailabilityPicker({ onSubmit }: Props) {
  const [date, setDate] = useState<Date | null>(new Date())
  const [partySize, setPartySize] = useState(2)

  return (
    <div className="availability-picker">
      <DatePicker
        selected={date}
        onChange={d => setDate(d)}
        minDate={new Date()}
      />
      <input
        type="number"
        min={1}
        max={20}
        value={partySize}
        onChange={e => setPartySize(+e.target.value)}
      />
      <button
        onClick={() => date && onSubmit(date, partySize)}
      >
        Check
      </button>
    </div>
  )
}
