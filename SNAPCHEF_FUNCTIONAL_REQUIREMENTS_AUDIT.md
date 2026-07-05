# SnapChef Functional Requirements Audit

## Project overview

SnapChefSocial is a React Native + Expo mobile app for a cooking social network. The active data layer is Supabase, with the Node.js backend folder kept as an older/optional API layer. Core modules already present in the app:

- Auth, register, OTP, Google sign-in, password reset.
- Profile, follow/friend discovery, settings, theme persistence.
- Feed, post CRUD, likes, comments, report/moderation.
- Recipe creation, saved recipes, recipe search and categories.
- Groups, group posts, join/leave, member management, group chat entry.
- Notifications, conversations, realtime-ish chat hooks.
- Reels, video playback, reel upload, likes, comments, sharing.
- Offline/network state, React Query cache persistence, upload queue.

## PDF requirement mapping

The PDFs mainly require a mobile app to demonstrate these functional groups:

- UI layout and controls: screens, forms, buttons, image views, tabs, modals/dialogs, toolbar/header, list rendering.
- List behavior: FlatList/RecyclerView equivalent, refresh, pagination, item actions.
- Event handling: click, long/action menus, form validation, disable repeated submit, user feedback.
- Local storage and state: draft persistence, settings, auth/session storage, query cache, restoring work after app restart.
- Background work: avoid blocking UI for upload/network/media tasks, continue or retry work safely.
- Networking/API: REST/Supabase calls, JSON mapping, loading/error/empty states, cache and offline awareness.
- Multimedia: image picker, camera, image compression, video/Reels upload and playback.
- Communication/share: native share and chat/conversation flows.
- Permissions and privacy: request media/camera permission only when needed and handle denial.

## Current implementation status

- UI/control requirements: covered by React Navigation stack/tabs, AppHeader, BottomTabBar, modals, forms, FlatList screens.
- Event/validation requirements: covered in auth, recipe/post forms, destructive action confirmations, disabled submit states.
- Local state requirements: covered by SecureStore session chunks, AsyncStorage settings/search/feed/drafts, persisted React Query cache.
- Background/network requirements: covered by upload queue, NetInfo offline banner, React Query retry/cache.
- API requirements: covered through Supabase services/repositories for posts, comments, groups, notifications, chat, reels and profiles.
- Multimedia requirements: covered through Expo ImagePicker/ImageManipulator and Expo Video/FileSystem.
- Social app requirements: feed, recipe, saved content, groups, reels, reports, admin/moderation, notifications and chat are implemented.

## Changes applied in this pass

- Saved recipes now use the existing saved-post repository fallback, so the app works whether the database has `saved_recipes` or `saved_posts`.
- Upload queue now checks network availability before uploading, and restores interrupted `uploading` tasks back to `pending` after app restart.
- App provider now resumes queued uploads automatically when the device comes back online.
- Reel upload now uses the Supabase `reels` storage bucket defined in the SQL setup.
- Reel creation now runs through the upload queue instead of blocking the create screen while waiting for a long video upload.
- Create post and create recipe now sanitize text, validate media limits, and guard against repeated submit.
- Search tabs now scroll horizontally so all tabs remain reachable on small screens.

## Verification

Run:

```powershell
npm.cmd exec tsc -- --noEmit
```

Result: TypeScript check passes.

## Recommended next checks

- Run the Supabase SQL setup against the active project if the live database is missing `saved_recipes` or `saved_posts`.
- Test on device: create post with images, create recipe, save/unsave recipe, upload Reel while offline then reconnect.
- Review mojibake text in existing UI files and normalize file encoding to UTF-8 in a dedicated cleanup pass.
