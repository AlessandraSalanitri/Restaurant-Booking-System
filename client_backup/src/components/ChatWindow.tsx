import React from 'react';
import { useChatAgent } from '../hooks/useChatAgent';
import { MessageList } from './MessageList';
import ChatInput from './ChatInput';
import OptionButtons from './OptionButtons';
import CustomerForm from './CustomerForm';
import ReferenceForm from './ReferenceForm';
import AvailabilityFlow from './flows/AvailabilityFlow';
import CreateFlow from './flows/CreateFlow';
import UpdateFlow from './flows/UpdateFlow';
import { humanTime } from '../utils/time';

const BEARER_TOKEN =
  process.env.REACT_APP_API_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFwcGVsbGErYXBpQHJlc2RpYXJ5LmNvbSIsIm5iZiI6MTc1NDQzMDgwNSwiZXhwIjoxNzU0NTE3MjA1LCJpYXQiOjE3NTQ0MzA4MDUsImlzcyI6IlNlbGYiLCJhdWQiOiJodHRwczovL2FwaS5yZXNkaWFyeS5jb20ifQ.g3yLsufdk8Fn2094SB3J3XW-KdBc0DY9a2Jiu_56ud8';

export default function ChatWindow() {
  const {
    messages, mode, showOptions, chipOffer, pendingBooking, bookingToEdit, endRef,
    setMessages, setMode, setShowOptions, setChipOffer, setPendingBooking, setBookingToEdit,
    handleSend, handleOptionClick,
  } = useChatAgent();

  return (
    <div className="chat-panel">
      <MessageList messages={messages} endRef={endRef} />

      {mode === 'availability' && (
        <AvailabilityFlow
          chipOffer={chipOffer}
          onPickDate={(iso, party) => {
            setChipOffer({ date: iso, partySize: party, times: [] });
            setMessages(m => [...m, { from:'user', text:`Checking availability for ${party} people on ${iso}…` }]);
            handleSend(`VisitDate: ${iso}, PartySize: ${party}, ChannelCode: ONLINE`, true);
          }}
          onPickTime={(t) => {
            if (!chipOffer) return;
            setPendingBooking({ date: chipOffer.date, time: t, partySize: chipOffer.partySize });
            setMessages(m => [...m, { from:'user', text:`I’ll take ${humanTime(t)} on ${chipOffer.date}.` }]);
            setMode('createCustomer'); setShowOptions(false);
          }}
        />
      )}

      {mode === 'create' && (
        <CreateFlow
          onSubmit={(iso, time, party) => {
            setPendingBooking({ date: iso, time, partySize: party });
            setMessages(m => [...m, { from:'user', text:`Booking ${party} people on ${iso} at ${time}…` }]);
            setMode('createCustomer'); setShowOptions(false);
          }}
        />
      )}

      {mode === 'createCustomer' && pendingBooking && (
        <CustomerForm
          onSubmit={info => {
            const cmd = [
              `VisitDate: ${pendingBooking.date}`,
              `VisitTime: ${pendingBooking.time}`,
              `PartySize: ${pendingBooking.partySize}`,
              `ChannelCode: ONLINE`,
              `Customer[FirstName]: ${info.firstName}`,
              `Customer[Surname]: ${info.surname}`,
            ].join(', ');
            setMessages(m => [...m, { from:'user', text:`My details: ${info.firstName} ${info.surname}` }]);
            handleSend(cmd, true);
            setPendingBooking(null);
            setChipOffer(null);
          }}
        />
      )}

      {mode === 'get' && (
        <ReferenceForm
          label="Enter your booking reference"
          onSubmit={ref => handleSend(`Booking_Reference: ${ref}`, true)}
        />
      )}

      {mode === 'update' && (
        <UpdateFlow
          booking={bookingToEdit}
          onAskRef={async ref => {
            setMessages(m => [...m, { from:'user', text: ref }]);
            const resp = await fetch(`/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/${ref}`, {
              headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
            });
            if (!resp.ok) {
              setMessages(m => [...m, { from:'agent', text:'Could not find a booking with that reference.' }]);
              setMode('options'); setShowOptions(true); return;
            }
            const b = await resp.json();
            setBookingToEdit(b);
            setMessages(m => [...m, { from:'agent', text:`Got it—your current reservation is on ${b.visit_date} at ${b.visit_time} for ${b.party_size} people. What would you like to change?` }]);
          }}
          onSubmit={(iso, time, party) => {
            if (!bookingToEdit) return;
            setMessages(m => [...m, { from:'user', text:`Updating to ${iso} at ${time} for ${party}…` }]);
            handleSend(`Booking_Reference: ${bookingToEdit.booking_reference}, VisitDate: ${iso}, VisitTime: ${time}, PartySize: ${party}`, true);
            setBookingToEdit(null);
          }}
        />
      )}

      {mode === 'cancel' && (
        <ReferenceForm
          label="Booking reference to cancel"
          onSubmit={ref => handleSend(`Booking_Reference: ${ref}, CancellationReasonId: 1`, true)}
        />
      )}

      <ChatInput onSend={handleSend} />

      {!showOptions && (
        <button className="show-options-btn" onClick={() => setShowOptions(true)}>
          Show Options
        </button>
      )}
      {showOptions && <OptionButtons selected={mode} onSelect={handleOptionClick} />}
    </div>
  );
}
