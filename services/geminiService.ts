import { GoogleGenAI, Chat, type GenerateContentResponse } from "@google/genai";
import { AI_SYSTEM_PROMPT } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function createChatSession(): Chat {
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: AI_SYSTEM_PROMPT,
        },
    });
    return chat;
}

export async function sendMessageStream(chat: Chat, message: string): Promise<AsyncGenerator<GenerateContentResponse>> {
    const result = await chat.sendMessageStream({ message });
    return result;
}