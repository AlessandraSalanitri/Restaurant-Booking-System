import React from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

export const MessageList = ({
  messages,
  endRef,
}: {
  messages: Message[];
  endRef?: React.RefObject<HTMLDivElement | null>;
}) => (
  <div className="chat-window">
    {messages.map((m, i) => (
      <MessageBubble key={i} from={m.from} text={m.text} />
    ))}
    <div ref={endRef} />
  </div>
);