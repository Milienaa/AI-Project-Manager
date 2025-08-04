
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import type { Message, ExtractedItem } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { createChatSession, sendMessageStream, extractActionItems } from './services/geminiService';
import { INITIAL_MESSAGES, AI_GREETING } from './constants';

interface FunctionCall {
  name: string;
  args: { [key: string]: any; };
}

function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [extractionPanelMessageId, setExtractionPanelMessageId] = useState<string | null>(null);
  const [acceptedItems, setAcceptedItems] = useState<ExtractedItem[]>([]);
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
  };
  
  const handleMouseUp = () => {
    isResizing.current = false;
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
        const newWidth = e.clientX;
        if (newWidth >= 280 && newWidth <= 600) {
            setSidebarWidth(newWidth);
        }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);


  useEffect(() => {
    try {
      const session = createChatSession();
      setChatSession(session);
      
      const greetingMessage: Message = {
        id: 'ai-greeting',
        sender: 'ai',
        text: AI_GREETING,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([greetingMessage]);

    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      const errorMessage: Message = {
        id: 'error-init',
        sender: 'ai',
        text: "Error: Could not connect to the AI assistant. Please ensure the API key is configured correctly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatSession) {
        console.error("Chat session not initialized.");
        return;
    }
    setExtractionPanelMessageId(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        const stream = await sendMessageStream(chatSession, text);
        
        let aiResponseText = '';
        const aiMessageId = `ai-${Date.now()}`;
        let functionCalls: FunctionCall[] = [];
        
        setMessages(prev => [...prev, {
            id: aiMessageId,
            sender: 'ai',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        for await (const chunk of stream) {
            if (chunk.text) {
                aiResponseText += chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg
                ));
            }
            
            // HACK: The `functionCalls` property may exist on the chunk object directly as an array.
            // We access it through `any` to bypass strict type checking, as SDK versions can vary.
            const calls = (chunk as any).functionCalls;
            if (calls && Array.isArray(calls)) {
                functionCalls.push(...calls);
            }
        }
        
        let isExtractable = false;
        let extractionText = '';
        const extractionCall = functionCalls.find(call => call.name === 'proposeActionItemsExtraction');

        if (extractionCall) {
            isExtractable = true;
            extractionText = extractionCall.args.textToExtract as string || aiResponseText;
        }

        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: aiResponseText, isExtractable, extractionText } : msg
        ));


    } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
            id: `error-${Date.now()}`,
            sender: 'ai',
            text: "Sorry, I encountered an error while processing your request. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [chatSession]);

  const handleExtractItems = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.extractionText) return;

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isExtractionLoading: true } : m));
    
    const items = await extractActionItems(message.extractionText);

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isExtractionLoading: false, extractedItems: items.length > 0 ? items : null } : m));
    if (items.length > 0) {
        setExtractionPanelMessageId(messageId);
    }
  }, [messages]);

  const handleAcceptAll = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.extractedItems) {
      setAcceptedItems(prev => [...prev, ...message.extractedItems!]);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, extractedItems: null, itemsAccepted: true, isExtractable: false } : m
      ));
    }
    setExtractionPanelMessageId(null);
  }, [messages]);

  const handleDeclineItem = useCallback((messageId: string, itemId: string) => {
    setMessages(prev => {
        const newMessages = prev.map(m => {
            if (m.id === messageId && m.extractedItems) {
                const newItems = m.extractedItems.filter(item => item.id !== itemId);
                if (newItems.length === 0) {
                    setExtractionPanelMessageId(null);
                }
                return { ...m, extractedItems: newItems.length > 0 ? newItems : null };
            }
            return m;
        });
        return newMessages;
    });
  }, []);


  return (
    <div className="flex h-screen font-sans antialiased overflow-hidden">
      <Sidebar width={sidebarWidth} />
      <div 
        className="w-1.5 h-full cursor-col-resize bg-slate-200 hover:bg-blue-400 transition-colors duration-200"
        onMouseDown={handleMouseDown}
      />
      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        extractionPanelMessageId={extractionPanelMessageId}
        onExtractItems={handleExtractItems}
        onAcceptAll={handleAcceptAll}
        onDeclineItem={handleDeclineItem}
      />
    </div>
  );
}

export default App;
