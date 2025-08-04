export type Sender = 'user' | 'ai';

export type ExtractedItemCategory = 'tasks' | 'problems' | 'insights' | 'questions';

export interface ExtractedItem {
  id: string;
  text: string;
  category: ExtractedItemCategory;
}

export interface Message {
  id:string;
  text: string;
  sender: Sender;
  timestamp: string;
  isExtractionLoading?: boolean;
  extractedItems?: ExtractedItem[] | null;
  itemsAccepted?: boolean;
  isExtractable?: boolean;
  extractionText?: string;
}