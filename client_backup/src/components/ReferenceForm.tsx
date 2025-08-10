import React, { useState } from 'react';

interface Props {
  label: string;
  onSubmit: (reference: string) => void;
}

export default function ReferenceForm({ label, onSubmit }: Props) {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const handleLookup = () => {
    if (!reference.trim()) {
      setError('Please enter your booking reference number.');
      return;
    }
    setError('');
    onSubmit(reference.trim());
  };

  return (
    <div className="reference-form">
      <div className="reference-form__header">{label}</div>
      {error && <div className="reference-form__error">{error}</div>}
      <div className="reference-form__body">
        <input
          className="reference-form__input"
          type="text"
          placeholder="e.g. ABC1234"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
        <button
          className="reference-form__submit"
          onClick={handleLookup}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
