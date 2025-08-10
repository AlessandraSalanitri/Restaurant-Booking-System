import React from 'react';

interface Props { from: 'user' | 'agent'; text: string; }

export default function MessageBubble({ from, text }: Props) {
  return <div className={`message-bubble ${from}`}>{text}</div>;
}
