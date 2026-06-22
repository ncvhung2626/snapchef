import React, { useMemo } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/AuthLoadingScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ReelsScreen } from '../screens/ReelsScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { CreateRecipeScreen } from '../screens/CreateRecipeScreen';
import { SavedRecipesScreen } from '../screens/SavedRecipesScreen';
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
import { AdminModerationScreen } from '../screens/AdminModerationScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditPostScreen } from '../screens/EditPostScreen';
import { EditRecipeScreen } from '../screens/EditRecipeScreen';
import { EditGroupScreen } from '../screens/EditGroupScreen';
import { CreateReelScreen } from '../screens/CreateReelScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { useTheme } from '../theme/ThemeContext';

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
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Tìm kiếm' }} />
      <Tab.Screen name="Inbox" component={InboxScreen} options={{ tabBarLabel: 'Thông báo' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isBootstrapping } = useAuth();
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo<Theme>(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.onSurface,
        border: colors.outlineVariant,
      },
    }),
    [colors, isDark]
  );

  if (isBootstrapping) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
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
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
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
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen
          name="CreateRecipe"
          component={CreateRecipeScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} />
        <Stack.Screen name="Reels" component={ReelsScreen} />
        <Stack.Screen name="AdminModeration" component={AdminModerationScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditPost" component={EditPostScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="EditGroup" component={EditGroupScreen} />
        <Stack.Screen name="CreateReel" component={CreateReelScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
