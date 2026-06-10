import React, { useState, useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../socket/client.js';

const DEMO_FEED = [
  { type: 'drop',  user: 'RatKing99',  rarity: 'legendary', item: 'Crown of Filth',  ago: '2m ago' },
  { type: 'drop',  user: 'MudLurker',  rarity: 'rare',      item: 'Chrome Board',    ago: '5m ago' },
  { type: 'prestige', user: 'GutterKing', prestige: 3,       ago: '12m ago' },
  { type: 'drop',  user: 'SewrDweller', rarity: 'epic',     item: 'Sewer Trident',   ago: '18m ago' },
];

export default function CommunityPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [feed]                  = useState(DEMO_FEED);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Try to connect socket (will fail gracefully if backend not running)
    try {
      const s = connectSocket();
      s.on('connect', ()         => setConnected(true));
      s.on('disconnect', ()      => setConnected(false));
      s.on('chat:message', msg   => {
        setMessages(prev => [...prev.slice(-99), msg]);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } catch (e) { /* backend not running */ }

    return () => disconnectSocket();
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (connected) {
      connectSocket().emit('chat:message', { text: input.trim() });
    } else {
      setMessages(prev => [...prev, { user: 'You', text: input.trim(), local: true }]);
    }
    setInput('');
  };

  return (
    <div className="community-panel">
      <div className="community-panel__hd">
        <span>SEWER CHAT</span>
        {connected
          ? <span style={{ color: 'var(--toxic)', fontSize: 10 }}>● LIVE</span>
          : <span style={{ color: '#86a05f', fontSize: 10 }}>● LOCAL</span>
        }
        <button className="community-panel__close" onClick={onClose}>✕</button>
      </div>

      <div className="community-panel__feed">
        <div className="community-panel__feed-title">ACTIVITY</div>
        {feed.map((e, i) => (
          <div key={i} className={`feed-event feed-event--${e.type}`}>
            {e.type === 'drop' && (
              <>
                <span className="feed-event__user">{e.user}</span>
                {' snagged '}
                <span style={{ color: rarityColor(e.rarity) }}>{e.item}</span>
                <span className="feed-event__ago">{e.ago}</span>
              </>
            )}
            {e.type === 'prestige' && (
              <>
                <span className="feed-event__user">{e.user}</span>
                {` reached Prestige ${e.prestige}!`}
                <span className="feed-event__ago">{e.ago}</span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="community-panel__chat">
        <div className="community-panel__msgs">
          {messages.length === 0 && (
            <div style={{ color: '#5a6450', fontFamily: 'var(--fnt-pixel)', fontSize: 11, padding: 10 }}>
              No messages yet. Say something!
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="chat-msg">
              <span className="chat-msg__user">{m.user || 'Anon'}</span>
              <span className="chat-msg__text">{m.text}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form className="community-panel__input" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={connected ? 'Send a message...' : 'Chat (offline)'}
            maxLength={120}
          />
          <button type="submit">▶</button>
        </form>
      </div>
    </div>
  );
}

function rarityColor(r) {
  const map = { common:'#9aa68b', uncommon:'#7bdc1f', rare:'#3d9bff', epic:'#b06bff', legendary:'#f6c544', mythic:'#ff4dff' };
  return map[r] || '#fff';
}
