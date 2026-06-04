# CookCircle Social Network - Design System & Implementation Guide

## Overview
Read DESIGN.md first and follow it strictly.
Do not generate the whole app at once.
Before editing, inspect the current project structure and package.json.
Use Expo React Native TypeScript.
Use Stitch UI as the source of truth.
Use mock data only unless I explicitly ask for backend.
After coding, explain any possible errors and how to test.

## App Purpose
**SnapChef (CookCircle)** is a social cooking mobile application designed to connect food enthusiasts, home cooks, and professional chefs. The app allows users to share recipes, post short-form videos (Reels), interact in groups, and manage their culinary profiles. The goal is to build an engaging, visually appealing, and highly interactive community around food.

## Visual Style
The app employs a modern, clean, and appetizing visual style. It uses a light mode-first design with soft surfaces, distinct card separations, and a vibrant primary brand color to stimulate appetite and engagement. The UI emphasizes high-quality imagery, rounded corners (glassmorphism or soft UI feel), and clear typographical hierarchy.

## Color Palette
The color system is based on Material Design 3 (M3) principles, utilizing a warm, food-centric palette:

**Primary Colors (Brand: Orange/Rust)**
- `primary`: `#9b4500` (Main brand color, interactive elements)
- `onPrimary`: `#ffffff` (Text on primary)
- `primaryContainer`: `#f17a28`
- `onPrimaryContainer`: `#572400`

**Secondary & Tertiary Colors**
- `secondary`: `#565e74` (Muted actions, secondary text/icons)
- `tertiary`: `#795900`

**Surface & Background**
- `background`: `#f7f9fb` (App background)
- `surface`: `#f7f9fb` (Card and component backgrounds)
- `surfaceContainerLow/High`: Variations of `#f2f4f6` and `#e6e8ea` for layering
- `onSurface`: `#191c1e` (Primary text)
- `onSurfaceVariant`: `#574237` (Secondary/Subtitle text)

**Semantic Colors**
- `error`: `#ba1a1a`
- `outline`: `#8a7265` (Borders and dividers)

## Typography
The primary font family is **Be Vietnam Pro**.

- `headlineXl`: 32px, Bold (700), Line Height: 40px (Hero titles)
- `headlineLg`: 24px, Bold (700), Line Height: 32px (Screen titles, App headers)
- `headlineMd`: 20px, SemiBold (600), Line Height: 28px (Section titles)
- `bodyLg`: 16px, Regular (400), Line Height: 24px (Main body text, descriptions)
- `bodyMd`: 14px, Regular (400), Line Height: 20px (Secondary text, metadata, timestamps)
- `labelMd`: 12px, SemiBold (600), Line Height: 16px (Buttons, badges, tags)

## Spacing System
A strict 4-point and 8-point grid system is utilized to ensure consistency:
- `2xs`: 4px
- `xs`: 8px
- `sm`: 12px
- `md`: 16px (Default screen padding)
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

## Border Radius
Soft, approachable corners for all interactive and structural elements:
- `sm`: 4px (Checkboxes, small tags)
- `md`: 8px (Small cards, inputs)
- `lg`: 12px / 16px (Main content cards, modal sheets)
- `full`: 9999px (Avatars, pill buttons, floating action buttons)

## Shadows
- **Card Shadow:** Subtle drop shadow for elevation (e.g., `elevation: 2`, `shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4`).
- **FAB Shadow:** Pronounced shadow for the central "Post" button on the bottom tab bar.

## Icons
Use scalable vector icons (e.g., `lucide-react-native` or `@expo/vector-icons/Feather`).
- Icon colors should adapt to `onSurface` or `primary` based on active state.
- Standard sizes: 20px (inline), 24px (standard actionable), 32px (hero actions).

## Reusable Components
1. **`AppHeader`**: Top navigation header supporting a large title, back button, and contextual actions (e.g., Search, Menu).
2. **`BottomTabBar`**: Custom React Navigation tab bar with a prominent, elevated central "+" button for creating posts.
3. **`PostCard`**: Component displaying user recipes/posts, including avatar, author name, timestamp, image, title, action buttons (Like, Comment, Share).
4. **`NotificationItem`**: List item for the Inbox screen supporting different notification types (likes, follows, system alerts) with dynamic icons and unread states.
5. **`GroupCard`**: Card representing a cooking community/group.

## Screen List (Project ID: 1469296620971870690)
1. `f3910eac15414fc6b4efb01baad36e7b`: SnapChef Culinary Social App (Welcome/Splash)
2. `24540a46c9ff446598d0d498ab9a8951`: Đăng nhập (Login)
3. `6f41e49cc70f4ec0a989c654aa52d8c0`: Trang chủ (Home/Feed)
4. `af3f0b123a32432dbe47dcc983cd6e45`: Reels
5. `63430163bf6947309d37bbdda0c90f09`: Đăng bài (Create Post)
6. `3679e8306d144b6cb39de2a631e9db55`: Hộp thư (Inbox)
7. `29c2dfd11d8d418f905c232a1ede36ec`: Cá nhân (Profile)
8. `06d14baaec1d49399e55756df6bdac32`: Chi tiết bài đăng (Post Details)
9. `8e6f1aaea82c493ea322a9d593dbc730`: Bình luận (Comments)
10. `ee2de73afccb4069841a813a18470384`: Tạo nhóm (Create Group)
11. `08436d09bf2a4a348d9c09e3ad694f02`: Chi tiết Nhóm (Group Details)
12. `c170d7413dcb4ae5ba00f13069039a40`: Quản lý bài đăng (Post Management)
13. `6188bfbac0484a8681e75f4c0dd89a22`: Quản lý thành viên (Member Management)

## Navigation Rules
- **Root Navigation:** Handled via `@react-navigation/native` and `SafeAreaProvider`.
- **Main App Flow:** Uses `createBottomTabNavigator` (`@react-navigation/bottom-tabs`) linking Home, Reels, (Post), Inbox, and Profile.
- **Central Action Button:** The middle tab button ("+") does not navigate to a standard tab screen. Instead, it triggers a Modal or Stack screen overlay (`63430163bf6947309d37bbdda0c90f09` - Đăng bài).
- **Stack Navigation:** Tapping an item in a list (e.g., a post in the Feed or a notification) pushes a new screen onto a Stack Navigator (e.g., `Post Details`).

## UI Implementation Rules for React Native
1. **Component Primitives:** strictly use React Native components (`View`, `Text`, `Image`, `TouchableOpacity`, `FlatList`, `ScrollView`). DO NOT use web primitives (`div`, `span`, `button`).
2. **Styling:**
   - Use `StyleSheet.create` for all styling.
   - Absolutely NO hard-coded hex colors, font sizes, or spacing values within components.
   - All style values MUST be sourced from `src/theme/colors.ts`, `src/theme/typography.ts`, `src/theme/spacing.ts`, and `src/theme/radius.ts`.
3. **Safe Area Management:** Use `react-native-safe-area-context` (`useSafeAreaInsets`) to handle device notches and home indicators dynamically, especially in Headers and Tab Bars.
4. **Lists:** Use `FlatList` with `keyExtractor` for any scrollable collections (Feeds, Notifications). Implement `refreshControl` (pull-to-refresh) and `ListEmptyComponent` for better UX.
5. **Types:** Use TypeScript. Define interfaces for component props and mock data models. Use functional components (`React.FC`).
6. **Modularity:** Keep files small. Break complex screens into smaller, reusable UI components located in `src/components/`.

Read DESIGN.md first and follow it strictly.
Do not generate the whole app at once.
Before editing, inspect the current project structure and package.json.
Use Expo React Native TypeScript.
Use Stitch UI as the source of truth.
Use mock data only unless I explicitly ask for backend.
After coding, explain any possible errors and how to test.