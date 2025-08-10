import React from 'react';
import ChatWindow from './components/ChatWindow';

export default function App() {
  return (
    <>
      {/* full-screen background behind the app */}
      <div className="app-bg" style={{ backgroundImage: 'url(/assets/background.svg)' }}/>

      {/* centered content on top */}
      <div className="container">
        <div className="chat-panel">
          <div className="header">
            <img src="/assets/Logo.svg" alt="Logo" />
            <h1>The Hungry Unicorn Restaurant</h1>
          </div>
          <ChatWindow />
        </div>
      </div>
    </>
  );
}
