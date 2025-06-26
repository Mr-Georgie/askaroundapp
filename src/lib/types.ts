export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  user: User;
  votes: number;
  timestamp: Date;
  photoUrl?: string;
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
