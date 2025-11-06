export type ConversationType = 'private' | 'group';

export interface ChatUserSummary {
  id: number;
  userName?: string | null;
  displayName?: string | null;
  imageUrl?: string | null;
}

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface MessageStatus {
  id: number;
  messageId: number;
  userId: number;
  status: MessageDeliveryStatus;
  createdAt: string;
  updatedAt: string;
  user?: ChatUserSummary | null;
}

export type MessageType = 'text' | 'image' | 'file';

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content?: string | null;
  attachmentUrl?: string | null;
  messageType: MessageType;
  createdAt: string;
  updatedAt: string;
  sender?: ChatUserSummary | null;
  statuses?: MessageStatus[];
}

export interface ConversationMember {
  id: number;
  conversationId: number;
  userId: number;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: ChatUserSummary | null;
}

export interface Conversation {
  id: number;
  name?: string | null;
  type: ConversationType;
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
  members?: ConversationMember[];
  messages?: ChatMessage[];
  creator?: ChatUserSummary | null;
}

export interface ConversationListItem extends Conversation {
  latestMessage?: ChatMessage | null;
  unreadCount?: number;
}

export interface ConversationPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  pagination: ConversationPagination;
}
