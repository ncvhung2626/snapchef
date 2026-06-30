export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  _id: string;
  fullname: string;
  username?: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationData {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface Post {
  _id: string;
  author: User;
  title?: string;
  content: string;
  images: string[];
  videos: string[];
  likes: string[];
  commentsCount: number;
  shares: number;
  hashtags: string[];
  visibility: 'public' | 'friends' | 'group';
  groupId?: string;
  category?: string;
  ingredients?: string[];
  steps?: string[];
  cookTimeMinutes?: number;
  isRecipe?: boolean;
  isSaved?: boolean;
  location?: LocationData;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  parentComment?: string;
  likes: number;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  ownerId: string;
  privacy?: 'public' | 'private';
  memberCanPost?: boolean;
  memberCanInvite?: boolean;
  admins: string[];
  members: string[];
  membersCount?: number;
  postsCount: number;
  createdAt: string;
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'group'
  | 'system'
  | 'premium';

export interface Notification {
  _id: string;
  sender?: string;
  senderName?: string;
  senderAvatar?: string;
  receiver: string;
  type: NotificationType;
  title: string;
  description: string;
  postId?: string;
  groupId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  groupId?: string;
  groupTitle?: string;
  isGroupChat?: boolean;
  lastMessage: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  senderName: string;
  content: string;
  createdAt: string;
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  readByOthers?: boolean;
}

export interface Reel {
  _id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  recipePostId?: string;
  createdAt: string;
}

export interface SavedRecipe {
  _id: string;
  userId: string;
  postId: string;
  createdAt: string;
}
