# Search Palette

A keyboard-driven command palette that searches everything in your library — photos, people, places, tags — and jumps to any admin or settings page, all from one input. Press <kbd>Cmd</kbd>+<kbd>K</kbd> (macOS) or <kbd>Ctrl</kbd>+<kbd>K</kbd> (Windows / Linux) to open it from anywhere in Gallery.

The top navigation search field opens this same palette. On searchable pages, the sort control next to the search field applies immediately to the current view, so searching and sorting live in one consistent place instead of separate page-specific search bars.

## What you can search

Each query runs in parallel against the configured providers and groups the results into named sections:

| Section           | What it returns                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| **Photos**        | Top smart-search matches with thumbnails. Activate to open the asset viewer. |
| **People**        | Named faces from your library and any shared spaces you can access.          |
| **Places**        | Cities, regions, and countries from your reverse-geocoded photos.            |
| **Tags**          | Tags assigned to your assets, plus inherited tags from parent tags.          |
| **Albums**        | Your albums, matched on album name.                                          |
| **Shared spaces** | Spaces you own or belong to, matched on space name.                          |
| **Commands**      | Verbs — upload files, create things, sign out, toggle theme, manage pages.   |
| **Navigation**    | Admin and settings pages — fuzzy-matched against the live page catalog.      |

Empty sections collapse silently so the result list stays tight. If smart search is unhealthy (the ML server is unreachable), a banner appears at the top of the palette and offers a one-tap switch to filename mode.

## Search modes

The footer shows the current matching mode for the **Photos** section. Press <kbd>Ctrl</kbd>+<kbd>/</kbd> to cycle through them:

- **Smart** — CLIP semantic search ("photos of a kitten on a couch")
- **Filename** — Substring match against the original file name
- **Description** — Substring match against your photo descriptions
- **OCR** — Substring match against text extracted from your photos

The other sections (People, Places, Tags, Commands, Navigation) are unaffected by the mode — they always run their own provider.

## Commands

Commands are verbs you can fire from the palette without leaving your current page. They live in their own section above **Go to…**, and the list is permission-aware: admin-only commands, album commands, space commands, and selection commands only appear when the current user and page context can run them.

Commands never appear in the **Recent** list. They're verbs, not destinations, and re-firing them belongs in the muscle-memory of the palette itself.

### Global commands

These commands are available everywhere after login:

| Command                          | What it does                                          |
| -------------------------------- | ----------------------------------------------------- |
| **Theme**                        | Switches between light and dark themes                |
| **Upload**                       | Opens the file picker so you can add photos or videos |
| **New Album**                    | Creates a new album and jumps you straight into it    |
| **Create shared space**          | Opens the **Create shared space** modal               |
| **Sign Out**                     | Logs you out and returns to the login screen          |
| **Keyboard shortcuts**           | Opens the keyboard-shortcuts cheatsheet               |
| **Clear recent palette entries** | Empties your **Recent** list in the palette           |

### Admin queue commands

Administrators see an extra group of commands for driving the job queues without leaving whatever page they're on. They are hidden from non-admin users.

| Command                      | What it does                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| **Run thumbnail generation** | Starts the thumbnail-generation job (equivalent to the **Start** button on the Jobs page) |
| **Run metadata extraction**  | Starts the metadata-extraction job                                                        |
| **Run smart search**         | Starts the smart-search indexing job                                                      |
| **Run face detection**       | Starts the face-detection job                                                             |
| **Run face recognition**     | Starts the facial-recognition job                                                         |
| **Pause all queues**         | Pauses every processing queue in one shot                                                 |
| **Resume all queues**        | Resumes every paused queue                                                                |
| **Clear failed jobs**        | Removes failed jobs from every queue (safe to fire even when none have failed)            |

Each **Run…** command confirms with a toast like **Started: Thumbnail generation**. The bulk commands (**Pause all queues**, **Resume all queues**, **Clear failed jobs**) fire a parallel request per admin-visible queue. If every request succeeds you get a single green confirmation; if any fail, a yellow warning toast reports **"N of M queue operations failed"** and the others still take effect. These commands target the same set of queues shown on **Administration → Jobs**, so the Jobs page is still the right place to watch per-queue progress in detail.

### Album commands

When you open the palette from an album page, album-specific commands appear according to your permissions on that album:

| Command                     | When it appears                      | What it does                                        |
| --------------------------- | ------------------------------------ | --------------------------------------------------- |
| **Rename this album**       | Album owner                          | Opens the album edit modal                          |
| **Share this album**        | Album owner                          | Opens album sharing and access management           |
| **Download this album**     | Anyone who can access the album      | Downloads all album assets as a zip                 |
| **Leave this shared album** | Shared-album member who is not owner | Removes you from the album and returns to Albums    |
| **Delete this album**       | Album owner                          | Permanently removes the album and returns to Albums |

### Selection commands

When one or more assets are selected on a supported timeline page, the palette also shows bulk actions for that live selection:

| Command                        | When it appears                                                                                           | What it does                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Add selected to album...**   | Selection exists on a page that can add assets to albums                                                  | Opens the album picker for the selected assets                              |
| **Add selected to space...**   | Selection exists on a page that can add assets to spaces                                                  | Opens a space picker so you can choose a writable shared space              |
| **Add selected to this space** | Current shared-space page is writable, the page is in the add-assets flow, and the selected count is safe | Adds the selected assets to the current writable shared space               |
| **Add selected to favorites**  | Selected assets are owned by you and are not all already favorites                                        | Marks the selected assets as favorites                                      |
| **Archive selected**           | Selected assets are owned by you and are not all already archived                                         | Moves the selected assets to archive                                        |
| **Delete selected**            | Selected assets are owned by you                                                                          | Moves selected assets to trash, or permanently deletes assets already there |

These commands only appear when the current page can safely run them. Favorite, archive, and delete require assets you own. **Add selected to this space** is shown only inside a writable shared space, only while choosing assets to add, and only when the selected count is within the per-request shared-space limit. Readers and other non-writers do not see commands that would modify the space.

### Shared-space commands

When you open the palette from a shared-space page, space-specific commands appear according to your role in that space:

| Command                             | When it appears               | What it does                                                    |
| ----------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| **Add photos to this space**        | Current space is writable     | Starts the asset-selection flow for adding photos to this space |
| **Manage space members**            | Space owner                   | Opens the member management modal                               |
| **Add a member to this space**      | Space owner                   | Opens the add-member modal                                      |
| **Add all my photos to this space** | Current space is writable     | Queues a background job to add all of your assets to the space  |
| **Leave this space**                | Space member who is not owner | Removes you from the space and returns to Spaces                |
| **Delete this space**               | Space owner                   | Permanently removes the space and returns to Spaces             |

Readers and other non-writers do not see write actions like **Add photos to this space**, **Add selected to this space**, or **Add all my photos to this space**. Space-owner actions are separate from write access: a user can be able to add photos without being able to manage members or delete the space.

### Destructive confirmations

Destructive commands keep the palette confirmation step: press <kbd>Enter</kbd> once to arm the command, then press <kbd>Enter</kbd> again to confirm or <kbd>Esc</kbd> to cancel. This applies to destructive album commands, destructive space commands, and **Delete selected**. Permanent asset deletes can still show the normal delete confirmation modal after the palette confirmation.

## Navigation entries

Navigation entries are destinations rather than commands. They appear in the **Navigation**, **Admin**, and **System Settings** groups, and can be found with normal search or the `>` prefix.

Admin pages and system settings are hidden from non-admin users. Feature-gated destinations, such as **Map** and **Trash**, only appear when that server feature is enabled.

User pages:

| Entry         | Where it goes            |
| ------------- | ------------------------ |
| **Photos**    | Main library timeline    |
| **Albums**    | Album list               |
| **People**    | People and face list     |
| **Tags**      | Tag browser              |
| **Map**       | Map view, when enabled   |
| **Sharing**   | Shared links and sharing |
| **Spaces**    | Shared spaces list       |
| **Trash**     | Trash, when enabled      |
| **Favorites** | Favorite assets          |
| **Archive**   | Archived assets          |
| **Memories**  | Memories page            |

Admin pages:

| Entry                  | Where it goes                    |
| ---------------------- | -------------------------------- |
| **Users**              | User management                  |
| **External Libraries** | External library management      |
| **Job Queues**         | Processing queues                |
| **Server Stats**       | System statistics                |
| **Maintenance**        | Backup, restore, and maintenance |

System settings:

| Entry                          | Opens this settings panel |
| ------------------------------ | ------------------------- |
| **Authentication Settings**    | Authentication            |
| **Database Dump Settings**     | Backup                    |
| **Image Settings**             | Image                     |
| **Job Settings**               | Jobs                      |
| **External Library**           | External libraries        |
| **Logging**                    | Logging                   |
| **Machine Learning Settings**  | Machine learning          |
| **Auto-Classification**        | Classification            |
| **Map & GPS Settings**         | Location and map          |
| **Metadata Settings**          | Metadata                  |
| **Nightly Tasks Settings**     | Nightly tasks             |
| **Notification Settings**      | Notifications             |
| **Server Settings**            | Server                    |
| **Storage Template**           | Storage template          |
| **Theme Settings**             | Theme                     |
| **Trash Settings**             | Trash                     |
| **User Settings**              | User settings             |
| **Version Check**              | Version checks            |
| **Video Transcoding Settings** | Video transcoding         |

### Unscoped: command-first tie-break

When a command and a navigation entry score similarly against an unscoped query, the command wins the **Top result** slot. So plain `album` activates **New Album** on <kbd>Enter</kbd>, and plain `upload` activates **Upload** — even though the Albums and Library pages also match.

## Prefix shortcuts

Start a query with a prefix character to restrict results to a single scope. The prefix is consumed by the palette and is not part of the query text, so `@alice`, `#xmas`, `/trip`, and `>theme` search the relevant scope for `alice`, `xmas`, `trip`, and `theme` respectively.

| Prefix | Scope                      | What it searches                            |
| ------ | -------------------------- | ------------------------------------------- |
| `@`    | **People**                 | Named faces only                            |
| `#`    | **Tags**                   | Your tags only                              |
| `/`    | **Albums + shared spaces** | Both collection types at once               |
| `>`    | **Commands + navigation**  | Palette commands and admin / settings pages |

When a prefix is active, all other sections (Photos, Places, and the two you didn't pick) are hidden for the duration of that query. Prefixes are handy when a bare query is dominated by photos and you want a single section to come through cleanly, or when you know exactly which kind of thing you're after.

### Bare-prefix browsing

Typing just the prefix character with nothing after it opens the full index for that scope, so the palette doubles as a lightweight browser for recent people, tags, collections, and admin pages:

- `@` — your people, most-recently-updated first
- `#` — your tags, most-recently-updated first
- `/` — your most-recently-active albums and shared spaces
- `>` — every command and navigation entry you have access to, alphabetical

This is faster than reaching for a sidebar when you just want to glance at recent activity.

## Top result band

Typing plain free text in the palette creates a synthetic **Top result** row: **Search for "…"**. Hitting <kbd>Enter</kbd> on that row routes the query to the current page's search surface when one exists. Pages without a filter panel fall back to `/photos?q=...`.

When your query closely matches a single command or navigation entry, that entry takes over the **Top result** slot instead of the generic search row. Hitting <kbd>Enter</kbd> activates it immediately, no arrow keys needed.

Promotion is based on a fuzzy score against the title, description, and search keywords. Commands win tie-breaks against navigation entries, so unscoped verbs like `upload` or `album` surface their command first. A short query like `peo` will surface **People** as the top result; `users` will surface **Administration → User Management**.

### Page-aware search

When you open the palette from a page that supports inline search, Gallery preloads the page's current query and sort mode. Submitting a new free-text query updates the page URL instead of navigating away:

| Current page                          | Where **Search for "…"** applies                                   |
| ------------------------------------- | ------------------------------------------------------------------ |
| **Photos**                            | `/photos?q=...` with the selected relevance / newest / oldest sort |
| **Shared space detail**               | That space's timeline, scoped to the space's assets                |
| **Shared space photos route**         | That space's photos route, preserving route context                |
| **Map**                               | The map markers, combined with active map filters                  |
| Any other page without a search scope | Falls back to the Photos timeline                                  |

The URL carries the query in `q` and, when needed, the sort in `sort=asc` or `sort=desc`. Clearing the search chip removes `q` and returns the page to its normal date ordering.

## Recents

Every destination or free-text search you activate is added to a **Recent** list (per user, per browser). When you reopen the palette with an empty query, your last few activations are shown immediately so you can repeat a workflow with two keystrokes.

- Recent entries that are no longer accessible (admin pages after a demotion, deleted people, removed tags) are filtered out automatically the next time you open the palette.
- Remove a single entry with the **×** button on the row, or with <kbd>Delete</kbd> while it's highlighted.
- Re-activating a query recent runs that query immediately on the current searchable page, instead of just filling the input.

## Quick links fallback

When you open the palette for the first time on a fresh browser — no recents yet — a curated set of **Quick links** is shown instead, so the empty state is still useful. The quick-link set is admin-aware: non-admins don't see admin destinations.

## Preview pane

On large screens (≥ `lg` breakpoint) a preview pane appears to the right of the result list:

- **Photos** → larger thumbnail with file name and an **Open** affordance
- **People** → face thumbnail with the person's name
- **Places** → region/country breakdown
- **Tags** → tag value with parent path

The preview updates as you arrow up and down through the list. On smaller screens it's hidden — the result list takes the full width and previews don't get in the way.

## Keyboard reference

| Key                                                        | What it does                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| <kbd>Cmd</kbd>+<kbd>K</kbd> / <kbd>Ctrl</kbd>+<kbd>K</kbd> | Open the palette from anywhere                                      |
| <kbd>Esc</kbd>                                             | Close the palette                                                   |
| <kbd>↑</kbd> / <kbd>↓</kbd>                                | Move through results — wraps at top/bottom                          |
| <kbd>Enter</kbd>                                           | Activate the highlighted result                                     |
| <kbd>Delete</kbd>                                          | Remove the highlighted **Recent** entry                             |
| <kbd>Ctrl</kbd>+<kbd>/</kbd>                               | Cycle the Photos search mode (smart → filename → description → OCR) |
| <kbd>Shift</kbd>+<kbd>T</kbd>                              | Toggle the theme (light / dark)                                     |

## How it stays responsive

- Each provider runs on its own **150 ms debounce** with a **15 s timeout** via `AbortSignal.timeout`. A slow people query never blocks photos from rendering.
- The palette uses a **stale-while-revalidate** rule: when a query is being re-run, the previous successful results stay visible until new ones arrive. No skeleton flash between keystrokes.
- A thin **progress stripe** appears across the top after a 200 ms grace window if any provider is still in flight, so you know work is happening when results are slow.
- The navigation provider runs **synchronously** against an in-memory catalog of admin/settings pages, so you see jumps from the very first keystroke even before the network comes back.
