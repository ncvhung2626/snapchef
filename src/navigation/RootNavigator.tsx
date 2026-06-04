import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/AuthLoadingScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReelsScreen } from '../screens/ReelsScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { CommentScreen } from '../screens/CommentScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { PostManagementScreen } from '../screens/PostManagementScreen';
import { MemberManagementScreen } from '../screens/MemberManagementScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { NewChatScreen } from '../screens/NewChatScreen';
import { BottomTabBar } from '../components/BottomTabBar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      initialRouteName="Feed"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Feed" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Reels" component={ReelsScreen} options={{ tabBarLabel: 'Reels' }} />
      <Tab.Screen name="Inbox" component={InboxScreen} options={{ tabBarLabel: 'Thông báo' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="RootStack"
        key={user ? 'app' : 'guest'}
        initialRouteName={user ? 'MainTabs' : 'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="Comment" component={CommentScreen} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="PostManagement" component={PostManagementScreen} />
        <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="NewChat" component={NewChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
