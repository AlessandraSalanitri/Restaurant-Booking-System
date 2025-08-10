import React from 'react';
import { ChipOffer } from '../types';
import { humanTime } from '../utils/time';

export default function TimeChips({
  offer, onPick,
}: {
  offer: ChipOffer;
  onPick: (t: string) => void;
}) {
  if (!offer.times.length) return null;
  return (
    <div className="time-chips">
      {offer.times.map(t => (
        <button key={t} className="time-chip" onClick={() => onPick(t)}>
          {humanTime(t)}
        </button>
      ))}
    </div>
  );
}
