import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { email: string };
  MainTabs: undefined;
  CreatePost: { groupId?: string } | undefined;
  PostDetail: { postId: string; initialImageIndex?: number };
  Comment: { postId: string };
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  PostManagement: { groupId: string };
  MemberManagement: { groupId: string };
  EditProfile: undefined;
  Chat: { conversationId: string; title?: string; isGroupChat?: boolean };
  NewChat: undefined;
  ForgotPassword: undefined;
  VerifyPasswordOtp: { email: string };
  CreateNewPassword: { email: string; token: string };
  CreateRecipe: undefined;
  SavedRecipes: undefined;
  Reels: undefined;
  AdminModeration: undefined;
  Friends: { userId?: string; tab?: 'followers' | 'following' | 'suggested' | 'requests' } | undefined;
  UserProfile: { userId: string };
  Settings: undefined;
  EditPost: { postId: string };
  EditRecipe: { postId: string };
  EditGroup: { groupId: string };
  CreateReel: undefined;
  Achievements: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabParamList = {
  Feed: undefined;
  Search: undefined;
  Inbox: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  NativeStackScreenProps<MainTabParamList, T>;
