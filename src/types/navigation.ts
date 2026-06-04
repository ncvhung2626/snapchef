import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  CreatePost: { groupId?: string } | undefined;
  PostDetail: { postId: string };
  Comment: { postId: string };
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  PostManagement: { groupId: string };
  MemberManagement: { groupId: string };
  EditProfile: undefined;
  Chat: { conversationId: string; title?: string };
  NewChat: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabParamList = {
  Feed: undefined;
  Reels: undefined;
  Inbox: undefined;
  Profile: undefined;
};
