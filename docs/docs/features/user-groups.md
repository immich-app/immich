# User Groups

User Groups let you create named, color-coded lists of users that you can select with a single click when sharing albums or inviting members to [Shared Spaces](shared-spaces.md). Instead of picking the same people one at a time every time you share, create a group once and reuse it everywhere.

## Key Features

- **Quick selection** — Click a group chip to select all its members at once when sharing an album or inviting to a space.
- **Color-coded** — Assign a color to each group for quick visual recognition in sharing modals.
- **Personal groups** — Each user creates and manages their own groups. Groups are not visible to other users.
- **Not a permission system** — Groups are a selection shortcut, not an access control mechanism. They don't grant access to anything on their own.

## Creating a Group

1. Go to **User Settings** (click your avatar > Account Settings).
2. Expand the **User Groups** section.
3. Click **Create group**.
4. Enter a name (e.g., "Family", "Close Friends", "Work Team").
5. Choose a color from the palette.
6. Select members from the user list — use the search bar to filter.
7. Click **Create**.

## Managing Groups

From the **User Groups** section in User Settings:

- **Edit** — Click the pencil icon on any group to change its name, color, or members.
- **Delete** — Click the trash icon. A confirmation dialog will appear. Deleting a group does not affect any albums or spaces already shared with those users.

## Using Groups When Sharing

Groups appear as colored chips at the top of the user selection modal whenever you:

- **Share an album** — Open an album > click **Share** > group chips appear above the user list.
- **Invite to a Space** — Open a space > Members panel > **Add member** > group chips appear above the user list.

### How it works

1. Group chips only appear if the group has at least one eligible member (members already in the album or space are excluded).
2. Click a group chip to select all eligible members. The chip fills with the group's color.
3. Click the chip again to deselect all members from that group.
4. You can still manually select or deselect individual users after clicking a group chip.
5. If a user belongs to multiple active groups, deselecting one group will keep them selected as long as another active group includes them.
6. The number next to each chip shows how many eligible members will be added.

## Tips

- Groups work best for recurring sharing patterns — family branches, friend circles, project teams.
- You can create overlapping groups (e.g., "Parents" and "Extended Family" can share some members).
- Groups with no eligible members for a particular share are automatically hidden.
- There is no limit on the number of groups or members per group.

## Technical Implementation

### Database Schema

User Groups adds 2 tables:

```
┌───────────────────────┐         ┌──────────┐
│     user_group        │         │   user   │
├───────────────────────┤         └────┬─────┘
│ id (UUID PK)          │              │
│ name (text)           │◄─createdById─┘
│ color (varchar?)      │
│ origin (varchar)      │   ┌──────────────────────┐
│ createdAt, updatedAt  │   │  user_group_member   │
└───────────┬───────────┘   ├──────────────────────┤
            │               │ groupId (FK) ◄───────┘
            └──────────────►│ userId  (FK) ────────► user
                            │ addedAt               │
                            └──────────────────────┘
                            PK: (groupId, userId)
```

The `origin` column tracks how the group was created (`manual` for user-created, `oidc` for future OIDC provider sync).

### Architecture

- **Controller** (`user-group.controller.ts`) — 6 REST endpoints under `/user-groups` for CRUD and member management.
- **Service** (`user-group.service.ts`) — Enforces ownership (only the creator can modify a group). Member replacement is atomic: the `setMembers` operation deletes all existing members and inserts the new set in a single transaction.
- **Repository** (`user-group.repository.ts`) — Kysely queries with a join to the `user` table to resolve member profiles (name, email, avatar). Soft-deleted users are filtered out automatically.

### Integration Points

Groups are purely a UI convenience layer — they have no server-side effect on permissions. The web frontend loads the user's groups in the album share modal and space member invite modal, rendering them as colored chips. When a chip is clicked, the client-side logic selects all eligible members (excluding users already in the album/space). The server never receives group IDs during sharing — only individual user IDs are sent in the API calls.
