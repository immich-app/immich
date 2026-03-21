# User Groups Design

## Problem

When sharing albums or inviting members to Spaces, users must select people one at a time. For users managing multiple family branches or friend circles, this is tedious and error-prone — especially as the number of shared albums and spaces grows.

Community request: [immich-app/immich#1633](https://github.com/immich-app/immich/discussions/1633) (56 upvotes, 22 comments).

## Solution

Personal user groups — named, color-coded lists of users that act as a selection shortcut in sharing flows. Groups are not a permissions primitive; they don't grant access to anything. They simply make it faster to select the same set of people repeatedly.

## Scope

### In v1

- Create/edit/delete groups in User Settings
- Add/remove members from groups
- Color-code groups (using existing `UserAvatarColor` palette)
- Use groups as quick-select chips when sharing albums or inviting to Spaces
- Data model includes `origin` field for future OIDC group sync

### Not in v1

- OIDC group sync
- Group-level permissions
- Admin-managed instance-wide groups
- Nested groups
- Groups in partner sharing flow

## Data Model

### `user_group` table

| Column        | Type           | Default            | Notes                       |
| ------------- | -------------- | ------------------ | --------------------------- |
| `id`          | uuid PK        | uuid_generate_v4() |                             |
| `name`        | text           |                    | max 100 chars               |
| `color`       | varchar(20)    | null               | from `UserAvatarColor` enum |
| `origin`      | varchar(20)    | `'manual'`         | future: `'oidc'`            |
| `createdById` | uuid FK → user |                    | CASCADE on delete           |
| `createdAt`   | timestamptz    | now()              |                             |
| `updatedAt`   | timestamptz    | now()              | trigger-managed             |

### `user_group_member` table

| Column    | Type                 | Default | Notes                 |
| --------- | -------------------- | ------- | --------------------- |
| `groupId` | uuid FK → user_group |         | composite PK, CASCADE |
| `userId`  | uuid FK → user       |         | composite PK, CASCADE |
| `addedAt` | timestamptz          | now()   |                       |

Indexes:

- `user_group_createdById_idx` on `user_group(createdById)`
- `user_group_member_userId_idx` on `user_group_member(userId)`

## API Endpoints

All endpoints scoped to the authenticated user — you can only see/edit/delete groups you created.

| Method   | Endpoint                   | Purpose                          |
| -------- | -------------------------- | -------------------------------- |
| `POST`   | `/user-groups`             | Create a group                   |
| `GET`    | `/user-groups`             | List my groups                   |
| `GET`    | `/user-groups/:id`         | Get group with members           |
| `PATCH`  | `/user-groups/:id`         | Update group (name, color)       |
| `DELETE` | `/user-groups/:id`         | Delete group                     |
| `PUT`    | `/user-groups/:id/members` | Set group members (full replace) |

### DTOs

**Create:** `{ name: string, color?: UserAvatarColor }`

**Update:** `{ name?: string, color?: UserAvatarColor }`

**Set members:** `{ userIds: string[] }`

**Response:**

```typescript
{
  id: string;
  name: string;
  color: UserAvatarColor | null;
  origin: string;
  createdAt: string;
  members: {
    userId: string;
    name: string;
    email: string;
    profileImagePath: string;
    avatarColor: UserAvatarColor;
  }
  [];
}
```

## Frontend

### Settings UI

New accordion section in User Settings, alongside "Partner Sharing":

**Group list view:**

- Each group as a compact row: color dot + group name + overlapping avatar stack + member count + edit/delete actions
- "Create group" button at the top
- Empty state: "Create groups to quickly select multiple people when sharing"

**Create/edit modal** (using `FormModal`):

- Name field (text input, max 100 chars)
- Color picker (same `UserAvatarColor` options as Spaces)
- Member selection: multi-select `ListButton` list of all users except self
  - Search/filter input at the top of the member list
  - Selected members shown as compact chip row above the list
- Save calls `POST /user-groups` (create) or `PATCH` + `PUT /members` (edit)

**Delete:** Confirmation dialog — "Delete group 'Family A'? This won't affect any albums or spaces already shared with these users."

### Sharing Flow Integration

Applied to `AlbumAddUsersModal` and `SpaceAddMemberModal`:

1. Fetch user's groups alongside the user list (parallel API calls)
2. Show **colored group chips** above the user list — horizontal row of pills, each with the group's color, name, and member count
3. Clicking a chip selects all eligible members in the user list below (excludes already-added members). Clicking again deselects.
4. If user has no groups, chip section doesn't render
5. No "create group" option in the sharing flow — groups are managed in Settings

**Visual treatment:** Colored pills matching the group's `UserAvatarColor`, consistent with how Space cards use color for identity. Users recognize groups by color at a glance.

## File Structure

```
server/src/
├── schema/tables/
│   ├── user-group.table.ts
│   └── user-group-member.table.ts
├── migrations/
│   └── [timestamp]-CreateUserGroupTables.ts
├── repositories/
│   └── user-group.repository.ts
├── services/
│   └── user-group.service.ts
├── controllers/
│   └── user-group.controller.ts
└── dtos/
    └── user-group.dto.ts

web/src/
├── lib/
│   ├── components/user-settings-page/
│   │   └── group-settings.svelte
│   ├── modals/
│   │   └── UserGroupModal.svelte
│   └── services/
│       └── user-group.service.ts
└── (modifications to existing files)
    ├── lib/modals/AlbumAddUsersModal.svelte
    └── lib/modals/SpaceAddMemberModal.svelte
```

## Future: OIDC Group Sync

The `origin` field on `user_group` enables future OIDC integration:

- Add `groupsClaim` config field to `SystemConfigOAuthDto` (follows existing `roleClaim`/`storageQuotaClaim` pattern)
- On OIDC login, read groups array from token, reconcile with `origin: 'oidc'` groups
- Manual groups (`origin: 'manual'`) are never touched by OIDC sync
- Edge cases (auto-create groups, removal policy) to be designed when implementing
