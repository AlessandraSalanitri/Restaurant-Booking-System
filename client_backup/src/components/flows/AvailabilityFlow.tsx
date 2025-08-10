import React from 'react';
import AvailabilityPicker from '../AvailabilityPicker';
import TimeChips from '../TimeChips';
import { ChipOffer } from '../../types';

export default function AvailabilityFlow({
  onPickDate, chipOffer, onPickTime,
}: {
  onPickDate: (iso: string, party: number) => void;
  chipOffer: ChipOffer | null;
  onPickTime: (time: string) => void;
}) {
  return (
    <div className="picker-wrapper">
      <AvailabilityPicker
        onSubmit={(date, partySize) => {
          const iso = date.toISOString().slice(0,10);
          onPickDate(iso, partySize);
        }}
      />
      {chipOffer && <TimeChips offer={chipOffer} onPick={onPickTime} />}
    </div>
  );
}
