import React, { useState } from 'react';

export interface CustomerInfo {
  firstName: string;
  surname: string;
}

interface Props {
  onSubmit: (info: CustomerInfo) => void;
}

export default function CustomerForm({ onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!firstName.trim() || !surname.trim()) {
      setError('Please fill out both your first name and surname.');
      return;
    }
    setError('');
    onSubmit({ firstName: firstName.trim(), surname: surname.trim() });
  };

  return (
    <div className="customer-form">
      <div className="customer-form__header">Your Name</div>
      {error && <div className="customer-form__error">{error}</div>}
      <div className="customer-form__body">
        <input
          className="customer-form__input"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
        />
        <input
          className="customer-form__input"
          type="text"
          placeholder="Surname"
          value={surname}
          onChange={e => setSurname(e.target.value)}
        />
        <button
          className="customer-form__submit"
          onClick={handleSubmit}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
