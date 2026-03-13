# Feature Research: Push Notifications for Memories

**Votes:** 182 (15th most requested)
**Status:** Not implemented — no push notification infrastructure exists
**Upstream Work:** None found for push; memory system and in-app notifications fully implemented

## Overview

Send push notifications to mobile devices when new memories are generated (e.g., "Photos from 3 years ago today"). Currently, memories are generated nightly but users only discover them when they open the app.

## Current State in Immich

### Memory System

**Generation** (`server/src/services/memory.service.ts`):

- "OnThisDay" memories generated nightly via `JobName.MemoryGenerate`
- Runs during configurable nightly task window (e.g., 2:00 AM)
- Looks back ±3 days, finds assets from previous years on same date
- Creates one `memory` record per year with matching assets
- Tracks last processed date via `SystemMetadataKey.MemoriesState`
- Cleanup: removes unsaved memories after 30 days

**Schema** (`memory` table):

- `showAt`/`hideAt` timestamps for visibility control
- `isSaved` flag (user can save memories permanently)
- `seenAt` tracking (when user viewed it)
- `memory_asset` junction table linking memories to assets
- `data` JSON: stores year metadata

**User Control:**

- `memories.enabled` preference toggle
- `memories.duration` setting (how many days memories span, default 5)

### Existing Notification Infrastructure

**In-App Notifications:**

- `notification` table with types: `JobFailed`, `BackupFailed`, `SystemMessage`, `AlbumInvite`, `AlbumUpdate`, `Custom`
- Levels: Error, Warning, Info, Success
- Web: `notification-manager.svelte.ts` fetches from `/api/notifications`

**Socket.IO Real-Time:**

- NestJS `@WebSocketGateway` at `/api/socket.io`
- Events: `on_notification`, `on_asset_update`, `on_upload_success`, etc.
- JWT-based auth, users auto-join rooms by `userId`
- Services emit via `websocketRepository.clientSend(event, userId, data)`
- Web client listens and refreshes notification list

**Email Notifications:**

- Album invite/update emails via BullMQ job queue
- SMTP configuration in system settings
- Respects user `emailNotifications` preferences

**Mobile Local Notifications:**

- `flutter_local_notifications` package (v17.2.1)
- Only used for manual upload progress
- Permission handling exists (iOS request, Android auto-granted)
- **No remote push (FCM/APNs) integration**

### What's Missing

1. No device token registration/storage
2. No FCM/APNs SDK integration
3. No push notification job
4. No memory creation event emission
5. No push notification preferences

## Proposed Implementation

### Phase 1: Device Token Registration

**New Table:**

```sql
CREATE TABLE device_push_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- 'android', 'ios', 'web'
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now(),
  UNIQUE(token)
);
CREATE INDEX device_push_token_userId_idx ON device_push_token(userId);
```

**API Endpoints:**

- `POST /notifications/device-tokens` — register token (auth required)
- `DELETE /notifications/device-tokens/:token` — unregister on logout
- Token refresh: mobile clients re-register on token change

### Phase 2: Memory Event + Notification

**Memory Service Change:**
After `memoryRepository.create()`, emit event:

```typescript
this.eventRepository.emit('onMemoryCreated', { userId, memoryId, year, assetCount });
```

**Notification Service Handler:**

```typescript
@OnEvent('onMemoryCreated')
async handleMemoryCreated({ userId, memoryId, year, assetCount }) {
  const user = await this.userRepository.get(userId);
  if (!user.preferences.notifications?.memoryReminder) return;

  const tokens = await this.deviceTokenRepository.getByUserId(userId);
  for (const token of tokens) {
    await this.pushNotificationQueue.add({
      token: token.token,
      platform: token.platform,
      title: `Memories from ${year}`,
      body: `You have ${assetCount} photos from this day ${new Date().getFullYear() - year} years ago`,
      data: { type: 'memory', memoryId },
    });
  }
}
```

**User Preferences:**

- Add `notifications.memoryReminder` boolean (default: true)
- UI toggle in notification settings

### Phase 3: FCM Integration (Android)

**Server-Side:**

- Add `firebase-admin` SDK dependency
- Configure service account credentials (environment variable or admin settings)
- Push job: `JobName.SendPushNotification`
- Uses FCM v1 API: `messaging.send({ token, notification, data })`

**Mobile-Side:**

- Add `firebase_messaging` to `pubspec.yaml`
- Initialize Firebase in app startup
- Request notification permission
- Get FCM token → register with server
- Handle `onMessage` (foreground) and `onMessageOpenedApp` (background tap)
- Deep link: navigate to `/memory/{memoryId}` on tap

### Phase 4: APNs Integration (iOS)

- Firebase handles APNs via FCM (single SDK for both platforms)
- Or: use native APNs for iOS-only deployments
- Requires APNs certificate/key in Firebase project settings

### Phase 5: Web Push (Optional)

- Service Workers + Web Push API
- Register via `navigator.serviceWorker` + `PushManager.subscribe()`
- Server sends via web-push npm package
- Lower priority than mobile push

## Self-Hosted Considerations

**The biggest challenge:** FCM requires a Firebase project and credentials.

**Options for self-hosted users:**

1. **Firebase (recommended):** Free tier supports unlimited push notifications. User creates Firebase project, adds credentials to Immich config.

2. **UnifiedPush:** Open standard for self-hosted push. Android-only via `org.unifiedpush.android` library. Requires separate push relay (e.g., ntfy.sh).

3. **Gotify/ntfy:** Direct push without Firebase. Requires separate push server setup. No iOS support (iOS requires APNs).

4. **Hybrid:** Support multiple push providers. Default to Firebase, allow alternatives via configuration.

**Recommendation:** Firebase as primary (works on both platforms, free, well-documented). Optional UnifiedPush support for privacy-focused users.

## Design Decisions Needed

1. **Push provider**: Firebase only, or support alternatives (UnifiedPush, ntfy)?
   - Recommendation: Firebase primary, UnifiedPush as optional alternative

2. **Notification timing**: Send immediately when memory generated (2 AM), or delay to morning?
   - Recommendation: Configurable "quiet hours" or send at user's preferred time (e.g., 8 AM local)

3. **Frequency control**: Daily notification per memory, or batch all memories?
   - Recommendation: One daily notification summarizing all new memories

4. **Opt-in vs opt-out**: Enable by default?
   - Recommendation: Opt-in — users must enable push notifications explicitly

5. **Other notification types**: Should this infrastructure support other push notifications (album invites, upload complete)?
   - Recommendation: Yes — build generic push infrastructure, memories is first use case

6. **Web push**: Include browser notifications?
   - Recommendation: Phase 5 — lower priority than mobile

## Effort Estimate

| Component                | Effort       | Notes                                             |
| ------------------------ | ------------ | ------------------------------------------------- |
| Device token table + API | Small        | Standard CRUD                                     |
| Memory event emission    | Small        | Add event after create                            |
| Push notification job    | Medium       | FCM SDK integration, error handling               |
| Firebase setup docs      | Small        | Admin guide for credentials                       |
| User preferences UI      | Small        | Toggle in notification settings                   |
| Mobile FCM integration   | Medium       | Firebase init, token management, deep linking     |
| Quiet hours / scheduling | Small-Medium | Delay job based on user timezone                  |
| APNs (via Firebase)      | Small        | Handled by FCM SDK                                |
| Web push (optional)      | Medium       | Service Worker setup                              |
| Tests                    | Medium       | Job handling, token management, preference checks |

**Total: Medium-Large effort (~3-4 weeks)**

The infrastructure is general-purpose — once built, other notification types (album updates, upload complete, shared link access) are trivial to add.

## Key Technical Challenges

1. **Firebase credentials management**: Self-hosted users need to create and configure their own Firebase project. This is a UX barrier.
2. **Token lifecycle**: FCM tokens can expire or change. Mobile clients must re-register periodically. Server must handle invalid tokens gracefully.
3. **Timezone handling**: Memory generation is server-time. Push delivery should be user-local-time. Need timezone-aware scheduling.
4. **Rate limiting**: Don't spam users with multiple notifications for multiple memories. Batch into single daily summary.
5. **Privacy concerns**: FCM routes through Google servers. Privacy-focused self-hosters may object. UnifiedPush alternative addresses this.
6. **iOS background restrictions**: iOS limits background processing. FCM handles this via APNs, but requires Apple Developer account for APNs certificate.

## Key Files

**Server (new):**

- `server/src/schema/tables/device-push-token.table.ts`
- `server/src/repositories/device-token.repository.ts`
- `server/src/services/push-notification.service.ts`

**Server (modify):**

- `server/src/services/memory.service.ts` — emit event on create
- `server/src/services/notification.service.ts` — handle memory event
- `server/src/controllers/notification.controller.ts` — token endpoints
- `server/src/enum.ts` — add `NotificationType.MemoryReminder`
- `server/src/dtos/notification.dto.ts` — extend preferences

**Mobile (modify):**

- `mobile/pubspec.yaml` — add `firebase_messaging`
- `mobile/lib/providers/notification_permission.provider.dart` — FCM token
- `mobile/lib/services/` — push notification service
- `mobile/lib/pages/memory_page.dart` — deep link handling

**Web:**

- `web/src/lib/stores/user-preferences.dto.ts` — notification toggle
- Minor notification manager updates
