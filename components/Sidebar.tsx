import React from 'react';
import { Icon } from './Icons';

interface SidebarProps {
  width: number;
}

const AiAssistantChat: React.FC = () => (
  <div className="bg-blue-100 border-l-4 border-blue-600 px-4 py-3 cursor-pointer mx-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
            <Icon name="bot" className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">AI Assistant</p>
          <p className="text-sm text-slate-600">AI Assistant</p>
        </div>
      </div>
      <span className="text-xs font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">0</span>
    </div>
  </div>
);


export const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  return (
    <aside 
        style={{ width: `${width}px` }} 
        className="bg-slate-50 border-r border-slate-200 h-screen shrink-0 flex flex-col"
    >
        <div className="pt-4">
            <AiAssistantChat />
        </div>
    </aside>
  );
};
