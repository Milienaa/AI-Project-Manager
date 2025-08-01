
import React, { useState } from 'react';
import { Icon } from './Icons';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="w-full pl-16 pr-12 py-3 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex space-x-2">
            <Icon name="attachment" className="w-5 h-5 text-slate-500 cursor-pointer" />
            <Icon name="emoji" className="w-5 h-5 text-slate-500 cursor-pointer" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-2 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Icon name="send" className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
