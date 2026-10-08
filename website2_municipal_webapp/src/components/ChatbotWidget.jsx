import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your EcoCity Assistant 🌿. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Only show for Citizens
  if (user?.role !== 'citizen') return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/chatbot', { message: userText });
      const newMsg = { text: res.data.reply, isBot: true };
      
      if (res.data.action === 'prefill_report') {
          newMsg.action = res.data.action;
          newMsg.extractedData = res.data.extractedData;
      }
      
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to the server.", isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action, data) => {
      if (action === 'prefill_report') {
          // Dispatch a custom event to the window so the dashboard can pick it up
          window.dispatchEvent(new CustomEvent('chatbot_prefill', { detail: data }));
          setIsOpen(false); // smoothly close chat to reveal the form
      }
  };

  const quickReplies = ["How to report?", "Rewards?", "Recycling tips"];

  return (
    <div className="position-fixed" style={{ bottom: '20px', right: '20px', zIndex: 1050 }}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn rounded-circle shadow d-flex align-items-center justify-content-center"
          style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.05)' } }}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="card shadow-lg border-0 d-flex flex-column" style={{ width: '350px', height: '500px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          {/* Header */}
          <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '15px 20px' }}>
            <div className="d-flex align-items-center gap-2">
              <Bot size={24} />
              <h5 className="mb-0 fw-bold">EcoCity Guide</h5>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-link text-white p-0">
              <X size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="card-body overflow-auto" style={{ backgroundColor: '#f9fafb', padding: '20px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`d-flex mb-3 ${msg.isBot ? 'justify-content-start' : 'justify-content-end'}`}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  backgroundColor: msg.isBot ? 'white' : '#10b981',
                  color: msg.isBot ? '#1f2937' : 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {/* Format newlines from backend */}
                  {msg.text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                  
                  {msg.action && (
                      <button 
                          onClick={() => handleActionClick(msg.action, msg.extractedData)}
                          className="btn btn-sm mt-3 w-100 fw-bold shadow-sm"
                          style={{ backgroundColor: '#10b981', color: 'white', borderRadius: '8px' }}
                      >
                         📋 Open Prepared Report
                      </button>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="d-flex justify-content-start mb-3">
                <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div className="typing-indicator d-flex gap-1">
                    <span className="dot" style={{width: 6, height: 6, background: '#cbd5e1', borderRadius: '50%', animation: 'blink 1.4s infinite ease-in-out both'}}></span>
                    <span className="dot" style={{width: 6, height: 6, background: '#cbd5e1', borderRadius: '50%', animation: 'blink 1.4s infinite ease-in-out both', animationDelay: '0.2s'}}></span>
                    <span className="dot" style={{width: 6, height: 6, background: '#cbd5e1', borderRadius: '50%', animation: 'blink 1.4s infinite ease-in-out both', animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-3 pb-2 pt-2 bg-white border-top d-flex gap-2 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                onClick={() => setInput(qr)}
                className="btn btn-sm rounded-pill"
                style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="card-footer bg-white border-0 p-3">
            <form onSubmit={handleSend} className="d-flex gap-2">
              <input
                type="text"
                className="form-control rounded-pill border-0 bg-light"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ paddingLeft: '20px' }}
              />
              <button 
                type="submit" 
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                disabled={!input.trim() || isTyping}
                style={{ width: '42px', height: '42px', backgroundColor: '#10b981', color: 'white', minWidth: '42px' }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}} />
    </div>
  );
};

export default ChatbotWidget;
