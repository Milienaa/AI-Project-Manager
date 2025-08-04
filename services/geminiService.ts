
import { GoogleGenAI, Chat, type GenerateContentResponse, Type } from "@google/genai";
import { AI_SYSTEM_PROMPT, EXTRACTION_PROMPT } from '../constants';
import type { ExtractedItem, ExtractedItemCategory } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractionTool = {
    functionDeclarations: [
        {
            name: "proposeActionItemsExtraction",
            description: "Proposes the extraction of action items from a given text. Call this when your response contains a structured plan, tasks, problems, or questions.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    textToExtract: {
                        type: Type.STRING,
                        description: "The full text content of the message from which items should be extracted."
                    }
                },
                required: ["textToExtract"]
            }
        }
    ]
};

export function createChatSession(): Chat {
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: AI_SYSTEM_PROMPT,
            tools: [extractionTool],
        },
    });
    return chat;
}

export async function sendMessageStream(chat: Chat, message: string): Promise<AsyncGenerator<GenerateContentResponse>> {
    const result = await chat.sendMessageStream({ message });
    return result;
}

export async function extractActionItems(text: string): Promise<ExtractedItem[]> {
    const schema = {
        type: Type.OBJECT,
        properties: {
            tasks: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'List of actionable tasks.' 
            },
            problems: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'List of identified problems or risks.' 
            },
            insights: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'List of key insights or suggestions.' 
            },
            questions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'List of questions to be answered.' 
            },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
            config: {
                systemInstruction: EXTRACTION_PROMPT,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        const extractedItems: ExtractedItem[] = [];

        Object.keys(parsedJson).forEach(key => {
            const category = key as ExtractedItemCategory;
            const items = parsedJson[key] as string[];
            if (Array.isArray(items)) {
                items.forEach(itemText => {
                    extractedItems.push({
                        id: `${category}-${Math.random().toString(36).substring(2, 9)}`,
                        category,
                        text: itemText,
                    });
                });
            }
        });

        return extractedItems;
    } catch (error) {
        console.error("Error extracting action items:", error);
        return [];
    }
}