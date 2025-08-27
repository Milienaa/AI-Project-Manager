

import { GoogleGenAI, Chat, type GenerateContentResponse, Type } from "@google/genai";
import { AI_SYSTEM_PROMPT } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createActionPointTool = {
    functionDeclarations: [
        {
            name: "CreateActionPointTool",
            description: "Detect and Extract all of action points from the generated result. Call this when your response contains a tasks, problems, insights or questions.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The text of the action point without emojis or bullet markers." },
                    type: { 
                        type: Type.STRING,
                        enum: ["TASK", "PROBLEM", "QUESTION", "INSIGHTS"],
                        description: "The type of the action point."
                    },
                },
                required: ["title", "type"]
            }
        }
    ]
};


export function createChatSession(): Chat {
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: AI_SYSTEM_PROMPT,
            tools: [createActionPointTool],
        },
    });
    return chat;
}

export async function sendMessageStream(chat: Chat, message: string): Promise<AsyncGenerator<GenerateContentResponse>> {
    const result = await chat.sendMessageStream({ message });
    return result;
}
