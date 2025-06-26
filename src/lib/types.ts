export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Keyword {
  id: string;
  count: number;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  user: User;
  votes: number;
  timestamp: Date;
  photoUrl?: string;
  status: "active" | "deleted";
  isFlagged: boolean;
}

export interface Question {
  id: string;
  text: string;
  user: User;
  votes: number;
  answersCount: number;
  distance: string;
  categoryEmoji: string;
  timestamp: Date;
  answers: Answer[];
  keywords: string[];
  status: "active" | "deleted";
  isFlagged: boolean;
}

export interface SageConversation {
  id: string;
  userId: string;
  title: string;
  timestamp?: string;
  lastMessageText: string;
}

export interface SageMessage {
  id: string;
  conversationId: string;
  sender: "user" | "sage";
  text: string;
  timestamp: string; // Changed from Date to string
}

export interface AppNotification {
  id: string;
  type: "NEW_ANSWER";
  read: boolean;
  questionId: string;
  questionText: string;
  actor: User;
  timestamp: Date;
}
