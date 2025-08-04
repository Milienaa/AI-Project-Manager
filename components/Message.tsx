import React from 'react';
import type { Message as MessageType } from '../types';
import { Icon } from './Icons';
import { ExtractedItemsPanel } from './ExtractedItemsPanel.tsx';

interface MessageProps {
  message: MessageType;
  isExtractionPanelOpen: boolean;
  onExtractItems: (messageId: string) => void;
  onAcceptAll: (messageId: string) => void;
  onDeclineItem: (messageId: string, itemId: string) => void;
}

export const AiAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
     <Icon name="bot" className="w-5 h-5" />
  </div>
);

export const UserAvatar: React.FC = () => (
   <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center flex-shrink-0">
     <Icon name="user" className="w-5 h-5" />
  </div>
);

const ParsedContent: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const renderLine = (line: string, index: number) => {
        if (line.startsWith('✅ Task:')) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2"><Icon name="task" className="w-5 h-5 text-green-500"/>{line.replace('✅ ', '')}</p>;
        }
        if (line.startsWith('⚠️ Problem:')) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2"><Icon name="problem" className="w-5 h-5 text-yellow-500"/>{line.replace('⚠️ ', '')}</p>;
        }
        if (line.startsWith('🎯 Insight:')) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2"><Icon name="insight" className="w-5 h-5 text-blue-500"/>{line.replace('🎯 ', '')}</p>;
        }
        if (line.startsWith('❓ Questions:')) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2"><Icon name="question" className="w-5 h-5 text-purple-500"/>{line.replace('❓ ', '')}</p>;
        }
        if (line.match(/^\d+\.\s.*:$/)) { // Matches "1. Step Title:"
            return <h3 key={index} className="font-bold text-lg mt-4 mb-2">{line}</h3>
        }
        if (line.startsWith('- ')) {
            return <li key={index} className="ml-8 list-disc marker:text-slate-400">{line.substring(2)}</li>
        }

        return <p key={index}>{line}</p>;
    }
    
    return <div className="space-y-1">{lines.map(renderLine)}</div>;
};


export const Message: React.FC<MessageProps> = ({ message, isExtractionPanelOpen, onExtractItems, onAcceptAll, onDeclineItem }) => {
  const isAI = message.sender === 'ai';
  const showExtractionButton = message.isExtractable && !message.itemsAccepted;

  return (
    <div className="flex items-start space-x-4 py-4">
      {isAI ? <AiAvatar /> : <UserAvatar />}
      <div className="flex-1">
        <div className="flex items-baseline space-x-2">
          <p className="font-semibold text-slate-900">{isAI ? 'AI Assistant' : 'You'}</p>
          <p className="text-xs text-slate-500">{message.timestamp}</p>
        </div>
        <div className="text-slate-700 mt-1 prose prose-sm max-w-none">
            <ParsedContent text={message.text} />
        </div>
        <div className="mt-2">
            {message.isExtractionLoading && (
                 <div className="inline-flex items-center space-x-2 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                </div>
            )}
            {showExtractionButton && !message.isExtractionLoading && (
                 <button 
                    onClick={() => onExtractItems(message.id)}
                    className="inline-flex items-center space-x-2 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                    aria-label="Extract action items"
                >
                    <Icon name="bot" className="w-4 h-4" />
                    <span>AI</span>
                </button>
            )}
            {isExtractionPanelOpen && message.extractedItems && (
                <ExtractedItemsPanel 
                    items={message.extractedItems}
                    onAcceptAll={() => onAcceptAll(message.id)}
                    onDeclineItem={(itemId) => onDeclineItem(message.id, itemId)}
                />
            )}
        </div>
      </div>
    </div>
  );
};