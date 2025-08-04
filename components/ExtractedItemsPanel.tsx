import React from 'react';
import type { ExtractedItem, ExtractedItemCategory } from '../types';
import { Icon } from './Icons';
import { categoryConfig } from '../constants';

interface ExtractedItemsPanelProps {
    items: ExtractedItem[];
    onAcceptAll: () => void;
    onDeclineItem: (itemId: string) => void;
}

export const ExtractedItemsPanel: React.FC<ExtractedItemsPanelProps> = ({ items, onAcceptAll, onDeclineItem }) => {

    const groupedItems = items.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {} as Record<ExtractedItemCategory, ExtractedItem[]>);

    const orderedCategories: ExtractedItemCategory[] = ['tasks', 'problems', 'insights', 'questions'];

    return (
        <div className="mt-4 border border-slate-200 rounded-lg bg-slate-50/50">
            <div className="p-3 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center space-x-2">
                    <Icon name="code-bracket" className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-sm text-slate-700">Detected elements ({items.length})</h4>
                </div>
                <button 
                    onClick={onAcceptAll}
                    className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-md hover:bg-green-600 transition-colors"
                >
                    Accept All
                </button>
            </div>
            <div className="p-3 space-y-3">
                {orderedCategories.map(category => {
                    if (!groupedItems[category] || groupedItems[category].length === 0) {
                        return null;
                    }
                    const { title, icon, iconClass } = categoryConfig[category];
                    return (
                        <div key={category}>
                            <h5 className="flex items-center font-semibold text-xs text-slate-600 mb-2">
                               <Icon name={icon} className={`w-4 h-4 mr-2 ${iconClass}`} />
                               {title}
                            </h5>
                            <ul className="space-y-2">
                                {groupedItems[category].map(item => (
                                    <li key={item.id} className="group flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md">
                                        <p className="text-sm text-slate-800">{item.text}</p>
                                        <button 
                                            onClick={() => onDeclineItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                            aria-label="Decline item"
                                        >
                                            <Icon name="x-circle" className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};