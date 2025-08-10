import React, { useState, KeyboardEvent } from 'react';

interface Props { onSend: (text: string) => void; }

export default function ChatInput({ onSend }: Props) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="input-bar">
      <input
        type="text"
        placeholder="Type your message..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={() => { onSend(input); setInput(''); }}>Send</button>
    </div>
  );
}
