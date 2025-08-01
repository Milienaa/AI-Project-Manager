import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import type { Message } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { createChatSession, sendMessageStream } from './services/geminiService';
import { INITIAL_MESSAGES, AI_GREETING } from './constants';

function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(420);
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
      // Handle API key error gracefully in UI
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
        
        setMessages(prev => [...prev, {
            id: aiMessageId,
            sender: 'ai',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            aiResponseText += chunkText;
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg
            ));
        }

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
      />
    </div>
  );
}

export default App;
