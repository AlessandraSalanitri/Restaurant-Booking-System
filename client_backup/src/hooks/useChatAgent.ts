import { useEffect, useRef, useState } from 'react';
import { ChipOffer, Message, Mode, Booking } from '../types';
import {
  extractTimes,
  extractFirstDateISO,
  extractPartySize,
} from '../utils/time';

const BEARER_TOKEN =
  process.env.REACT_APP_API_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFwcGVsbGErYXBpQHJlc2RpYXJ5LmNvbSIsIm5iZiI6MTc1NDQzMDgwNSwiZXhwIjoxNzU0NTE3MjA1LCJpYXQiOjE3NTQ0MzA4MDUsImlzcyI6IlNlbGYiLCJhdWQiOiJodHRwczovL2FwaS5yZXNkaWFyeS5jb20ifQ.g3yLsufdk8Fn2094SB3J3XW-KdBc0DY9a2Jiu_56ud8';

export function useChatAgent() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'agent', text: 'Welcome to The Hungry Unicorn! How can I help you today?' }
  ]);
  const [mode, setMode] = useState<Mode>('options');
  const [showOptions, setShowOptions] = useState(true);

  const [chipOffer, setChipOffer] = useState<ChipOffer | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{
    date: string; time: string; partySize: number;
  } | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text: string, skipUserBubble = false) => {
    if (!text.trim()) {
      setMessages(m => [...m, { from: 'agent', text: 'Please click one of the options or type your request.' }]);
      setMode('options'); setShowOptions(true);
      return;
    }
    if (!skipUserBubble) setMessages(m => [...m, { from: 'user', text }]);

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BEARER_TOKEN}` },
        body: JSON.stringify({ message: text })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { reply } = await res.json();
      setMessages(m => [...m, { from: 'agent', text: reply }]);

      // chip extraction 
      const times = extractTimes(reply);

      let newChipOffer: typeof chipOffer = null;
      if (times.length) {
        const dateIso =
          extractFirstDateISO(reply) ||
          chipOffer?.date || // seeded by AvailabilityFlow
          null;

        const recentUserText = `${text} ${messages.slice(-3).map(m => m.text).join(' ')}`;
        const partyGuess =
          chipOffer?.partySize ??
          extractPartySize(`${recentUserText} ${reply}`) ??
          2;

        if (dateIso) {
          newChipOffer = { date: dateIso, partySize: partyGuess, times };
        }
      }
      setChipOffer(newChipOffer);
      var hasChips = !!newChipOffer; 

      // Decide options visibility based on chips
      setShowOptions(!hasChips);
      if (!hasChips) setMode('options');

    } catch (e) {
      console.error(e);
      setMessages(m => [...m, { from: 'agent', text: 'Sorry, something went wrong. Please try again.' }]);
      setMode('options'); setShowOptions(true);
    }
  };
  const handleOptionClick = (m: Mode) => {
    const labels: Record<Mode, string> = {
      options:'', chat:'', availability:'Check Availability', create:'Book a Table',
      createCustomer:'', get:'View Your Booking', update:'Edit Your Booking', cancel:'Cancel Booking'
    };
    const prompts: Partial<Record<Mode, string>> = {
      availability:'Absolutely! When would you like to check availability? Pick a date and party size.',
      create:'Great! Let’s book a table for you. First, pick date, time, and party size.',
      get:'Okay! What’s your booking reference number?',
      update:'Let’s update your reservation. Please provide your booking reference.',
      cancel:'To cancel, I’ll need your booking reference.'
    };

    setMessages(prev => {
      const out = [...prev];
      if (labels[m]) out.push({ from: 'user', text: labels[m] });
      if (prompts[m]) out.push({ from: 'agent', text: prompts[m]! });
      return out;
    });

    if (m === 'update') setBookingToEdit(null);
    setMode(m); setShowOptions(false); setChipOffer(null);
  };

  return {
    // state
    messages, mode, showOptions, chipOffer, pendingBooking, bookingToEdit, endRef,
    // setters
    setMessages, setMode, setShowOptions, setChipOffer, setPendingBooking, setBookingToEdit,
    // actions
    handleSend, handleOptionClick,
  };
}
