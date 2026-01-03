
export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  audioChunks?: string[]; // Pour la relecture instantanée
}
