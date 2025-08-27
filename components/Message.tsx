
import React from 'react';
import type { Message as MessageType } from '../types';
import { Icon } from './Icons';
import { ExtractedItemsPanel } from './ExtractedItemsPanel';

interface MessageProps {
  message: MessageType;
  isExtractionPanelOpen: boolean;
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
    const lines = text.split('\n').filter(line => line.trim() !== '' || line.includes('---'));
    
    const renderLine = (line: string, index: number) => {
        // Category headers
        if (line.match(/^✅\s*Tasks?:/i)) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2 mt-3"><Icon name="task" className="w-5 h-5 text-green-500"/>{line.replace(/^✅\s*/, '')}</p>;
        }
        if (line.match(/^⚠️\s*Problems?:/i)) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2 mt-3"><Icon name="problem" className="w-5 h-5 text-yellow-500"/>{line.replace(/^⚠️\s*/, '')}</p>;
        }
        if (line.match(/^🎯\s*Insights?:/i)) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2 mt-3"><Icon name="insight" className="w-5 h-5 text-blue-500"/>{line.replace(/^🎯\s*/, '')}</p>;
        }
        if (line.match(/^❓\s*Questions?:/i)) {
            return <p key={index} className="font-semibold text-slate-800 flex items-center gap-2 mt-3"><Icon name="question" className="w-5 h-5 text-purple-500"/>{line.replace(/^❓\s*/, '')}</p>;
        }

        // Step Title (e.g., "1. **Title**:")
        if (line.match(/^\d+\.\s.*:$/)) {
            const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');
            return <h3 key={index} className="font-bold text-lg mt-4 mb-2">{cleanLine}</h3>
        }

        // List items
        if (line.startsWith('- ')) {
            return <li key={index} className="ml-8 list-disc marker:text-slate-400">{line.substring(2)}</li>
        }
        
        // Suggestions section
        if (line.trim() === '---') {
            return <hr key={index} className="my-4 border-slate-200" />;
        }
        if (line.match(/^(💬|📋|🏁)/)) {
             return <p key={index} className="mt-1">{line}</p>;
        }

        return <p key={index}>{line}</p>;
    }
    
    return <div className="space-y-1">{lines.map(renderLine)}</div>;
};


export const Message: React.FC<MessageProps> = ({ message, isExtractionPanelOpen, onAcceptAll, onDeclineItem }) => {
  const isAI = message.sender === 'ai';

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
            {isExtractionPanelOpen && message.extractedItems && message.extractedItems.length > 0 && (
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