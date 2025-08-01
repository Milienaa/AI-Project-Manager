import React, { useRef, useEffect } from 'react';
import type { Message as MessageType } from '../types';
import { Message, AiAvatar } from './Message';
import { InputBar } from './InputBar';

interface ChatWindowProps {
  messages: MessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatHeader: React.FC = () => (
    <div className="p-4 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-800">AI Assistant</h1>
    </div>
)

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <main className="flex-1 flex flex-col h-screen bg-white">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length-1]?.sender === 'user' && (
             <div className="flex items-start space-x-4 py-4">
                <AiAvatar />
                <div className="flex-1">
                    <div className="flex items-baseline space-x-2">
                        <p className="font-semibold text-slate-900">AI Assistant</p>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <InputBar onSendMessage={onSendMessage} isLoading={isLoading} />
    </main>
  );
};