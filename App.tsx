
import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: import FunctionCall type from @google/genai to resolve type mismatch with function calls in the stream response.
import type { Chat, FunctionCall } from '@google/genai';
import type { Message, ExtractedItem, ExtractedItemCategory } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { createChatSession, sendMessageStream } from './services/geminiService';
import { INITIAL_MESSAGES, AI_GREETING, AI_SYSTEM_PROMPT } from './constants';

function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [extractionPanelMessageId, setExtractionPanelMessageId] = useState<string | null>(null);
  const [acceptedItems, setAcceptedItems] = useState<ExtractedItem[]>([]);
  const isResizing = useRef(false);
  const chatIdRef = useRef(`chat-${Math.random().toString(36).substring(2, 9)}`);

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

    } catch (e) {
      console.error("Failed to initialize chat session:", e);
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
      // FIX: Removed redundant 'new' keyword which was causing a syntax error.
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const logPayload = (payload: object) => {
      console.debug('WS DEBUG', {
        chatId: chatIdRef.current,
        payload: { ...payload, type: 'DEBUG_EVENT' }
      });
    };

    logPayload({ stage: 'systemPrompt', input: AI_SYSTEM_PROMPT });
    logPayload({ stage: 'messageBuffer', input: 'Відповідь до розмови, що містить повідомлення.' });

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
            
            const calls = chunk.functionCalls;
            if (calls) {
                calls.forEach(call => {
                    logPayload({ 
                        stage: 'TOOL_CALL', 
                        toolName: call.name, 
                        input: call.args,
                        txtId: `txt-${Math.random().toString(36).substring(2, 9)}`
                    });
                });
                functionCalls.push(...calls);
            }
        }
        
        const extractedItems: ExtractedItem[] = [];

        functionCalls.forEach(call => {
            if (call.name === 'CreateActionPointTool' && call.args) {
                const { title, type } = call.args;

                if (title && typeof title === 'string' && type && typeof type === 'string') {
                    let category: ExtractedItemCategory | null = null;
                    switch(type.toUpperCase()) {
                        case 'TASK':
                            category = 'tasks';
                            break;
                        case 'PROBLEM':
                            category = 'problems';
                            break;
                        case 'INSIGHTS':
                             category = 'insights';
                            break;
                        case 'QUESTION':
                             category = 'questions';
                            break;
                    }

                    if (category) {
                        extractedItems.push({
                            id: `${category}-${Math.random().toString(36).substring(2, 9)}`,
                            category: category,
                            text: title,
                        });
                    }
                }
            }
        });

        setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, text: aiResponseText.trim(), extractedItems } : msg
        ));
        
        if (extractedItems.length > 0) {
            setExtractionPanelMessageId(aiMessageId);
        }

    } catch (e) {
        console.error("Error sending message:", e);
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

  const handleAcceptAll = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.extractedItems) {
      setAcceptedItems(prev => [...prev, ...message.extractedItems!]);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, extractedItems: null, itemsAccepted: true } : m
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
        onAcceptAll={handleAcceptAll}
        onDeclineItem={handleDeclineItem}
      />
    </div>
  );
}

export default App;