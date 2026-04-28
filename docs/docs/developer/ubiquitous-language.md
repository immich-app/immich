---
title: Ubiquitous Language
sidebar_position: 11
---

# Ubiquitous Language

This document names the major Gallery concepts so discussions can start from product and domain language before dropping into component, file, or table names. Prefer these terms in issues, planning, code review, and debugging notes.

## Top-down map

| Term                         | Definition                                                                                           | Aliases to avoid                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Client surface**           | A user-facing entry point that talks to Gallery through generated API clients.                       | Frontend, app thing             |
| **API boundary**             | The server layer that validates requests, exposes DTOs, and generates OpenAPI contracts for clients. | Controller code, route plumbing |
| **Domain service**           | Server business logic that enforces rules, access, side effects, jobs, and response shaping.         | Backend component, handler      |
| **Persistence layer**        | Typed database access and schema definitions around Postgres.                                        | DB stuff, query code            |
| **Job pipeline**             | Redis/BullMQ-backed background work for media processing, ML, cleanup, migration, and notifications. | Worker magic, queue stuff       |
| **Machine learning service** | The Python service that hosts ONNX models for CLIP, face recognition, OCR, and pet detection.        | AI server, model box            |
| **Storage layer**            | The disk/S3 abstraction that writes, reads, serves, deletes, and migrates media files.               | Filesystem code, S3 code        |
| **Realtime layer**           | Websocket and audit/update-id infrastructure that lets clients react to server-side changes.         | Socket code, sync code          |
| **Generated SDK**            | The OpenAPI-generated client used by web, mobile, CLI, and tests to call the server.                 | API wrapper, SDK stuff          |

## Codebase areas

| Term                     | Definition                                                                                           | Aliases to avoid              |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Web client**           | The SvelteKit client for browsing, filtering, editing, sharing, and administering Gallery.           | Svelte app, web folder        |
| **Mobile client**        | The Flutter client with local state and generated API access.                                        | App, phone app                |
| **CLI client**           | The Node CLI used mainly for bulk upload and automation.                                             | Command tool                  |
| **Gallery server**       | The NestJS application that handles HTTP, jobs, repositories, permissions, and storage coordination. | Backend, API server           |
| **Microservices worker** | The server process mode that consumes background jobs rather than serving normal UI requests.        | Worker container              |
| **Documentation site**   | The Docusaurus site that describes user features, operations, and developer architecture.            | Docs folder                   |
| **Fork layer**           | Gallery-specific behavior layered on top of upstream Immich while preserving rebase compatibility.   | Custom code, downstream patch |

## Content core

| Term                  | Definition                                                                                                   | Aliases to avoid                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **Asset**             | A photo or video record owned by a user and backed by one or more media files.                               | Photo, item, media item          |
| **Media file**        | A concrete file or object used by an asset, such as original, preview, thumbnail, encoded video, or sidecar. | Blob, path, object               |
| **Asset metadata**    | Searchable facts about an asset such as dates, camera data, location, description, rating, OCR, and tags.    | EXIF only, details               |
| **Asset visibility**  | The asset-level placement state: timeline, archive, hidden, locked, or trash/deleted state.                  | Status, hidden flag              |
| **Timeline**          | A date-grouped asset stream loaded in buckets and rendered as the main browsing surface.                     | Grid, photos page, list          |
| **Time bucket**       | A monthly/date bucket that counts and loads timeline assets incrementally.                                   | Month row, page chunk            |
| **Stack**             | A group of related assets represented by one primary asset in normal timeline browsing.                      | Group, pile                      |
| **Live photo**        | A still asset linked to a motion/video asset.                                                                | Motion photo pair                |
| **Library**           | A configured source of assets, usually an external filesystem import owned by one user.                      | Folder, source, personal library |
| **Import path**       | A filesystem path scanned by an external library.                                                            | Folder path, mount               |
| **Exclusion pattern** | A glob-like rule that prevents matching files from entering a library scan.                                  | Ignore rule                      |
| **Personal timeline** | The current user's normal timeline, optionally augmented by partners and timeline-enabled spaces.            | Global timeline, main grid       |

## Collections and sharing

| Term                           | Definition                                                                                                        | Aliases to avoid              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Album**                      | A named collection that links assets without copying files.                                                       | Folder, gallery               |
| **Album member**               | A user with viewer or editor access to an album.                                                                  | Shared user                   |
| **Partner sharing**            | One-way library sharing from one user to another.                                                                 | Shared library, partner album |
| **Shared link**                | A public or key-protected access path to selected assets or an album.                                             | Public share, link share      |
| **Shared Space**               | A collaborative virtual library where members browse and contribute assets under role-based access.               | Space, shared library         |
| **Space member**               | A user who belongs to a Shared Space with an Owner, Editor, or Viewer role.                                       | Participant, collaborator     |
| **Space role**                 | The permission tier for a Space member: Owner, Editor, or Viewer.                                                 | Space permission              |
| **Space asset**                | An asset visible inside a Shared Space, either directly linked or included through a linked library.              | Space photo                   |
| **Direct space asset**         | An asset explicitly linked into a Shared Space through the space-asset join.                                      | Added photo                   |
| **Library-linked space asset** | An asset included in a Shared Space because its library is linked to that space.                                  | Auto-added photo              |
| **Linked library**             | A library connected to a Shared Space so all current and future library assets appear there.                      | Connected library             |
| **Timeline inclusion**         | A member's per-space choice to merge that space's assets into their personal timeline.                            | Show on timeline toggle       |
| **Space cover**                | The asset and crop position used as the visual cover for a Shared Space.                                          | Thumbnail, hero image         |
| **Space activity**             | An auditable event inside a Shared Space, such as asset add/remove, member change, cover change, or person merge. | Feed item, log row            |
| **Contribution**               | A member's added-asset history inside a Shared Space.                                                             | Activity count                |
| **New since last visit**       | Space asset count and contributor data calculated from a member's last viewed timestamp.                          | Badge count, recency          |

## People and recognition

| Term                     | Definition                                                                                                      | Aliases to avoid            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Face**                 | A detected region on an asset that may be assigned to a person cluster.                                         | Detection, face box         |
| **Personal Person**      | A user-owned person or pet cluster in the personal people catalog.                                              | Global Person, owner person |
| **Space Person**         | A Shared Space-level person or pet cluster made from faces on assets in that space.                             | Shared person, space face   |
| **Representative face**  | The face used as the display image source for a person cluster.                                                 | Thumbnail face              |
| **Person thumbnail**     | The rendered thumbnail for a Personal Person or Space Person, normally derived from a representative face.      | Avatar, headshot            |
| **Hidden person**        | A person cluster excluded from normal people lists and filters until explicitly requested.                      | Invisible person            |
| **Favorite person**      | A Personal Person pinned ahead of other personal people.                                                        | Pinned person               |
| **Person alias**         | A member-specific display override for a Space Person.                                                          | Nickname                    |
| **Person name override** | The Space Person name that supersedes the linked Personal Person name inside that Shared Space.                 | Space name, renamed person  |
| **Pet person**           | A person-like cluster whose type is pet and whose faces come from pet detection.                                | Pet, animal tag             |
| **Face matching**        | The process that assigns faces to existing people or creates new people.                                        | Recognition, clustering     |
| **Space face matching**  | The Shared Space process that maps already-assigned personal faces into Space People and bridges across owners. | Space recognition           |
| **Person dedup pass**    | A background pass that merges duplicate person clusters when embeddings indicate the same real-world subject.   | Merge job                   |

## Search and filtering

| Term                     | Definition                                                                                                                                                   | Aliases to avoid             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| **Search Palette**       | The Cmd/Ctrl-K command and destination search surface that searches providers across photos, people, places, tags, albums, spaces, commands, and navigation. | Global search, command modal |
| **Page search**          | URL-backed free-text search scoped to the current searchable page.                                                                                           | Search bar, query chip       |
| **Smart Search**         | CLIP-based semantic asset search using image/video embeddings.                                                                                               | AI search, natural search    |
| **Metadata Search**      | Asset search by filename, description, OCR, checksum, EXIF, or other non-semantic fields.                                                                    | Basic search                 |
| **Search provider**      | A source queried by the Search Palette, such as photos, people, places, tags, albums, spaces, commands, or navigation.                                       | Section backend              |
| **Search scope**         | A boundary that changes what a query means, such as all results, people, tags, collections, navigation, page, album, map, or space.                          | Context, mode                |
| **Filter Surface**       | The reusable left-side filter experience for timeline-like views.                                                                                            | FilterPanel, sidebar         |
| **Filter state**         | The active selected values for timeline, people, location, camera, tags, rating, media type, favorites, and sort.                                            | Filter object                |
| **Filter section**       | One filter category within the Filter Surface.                                                                                                               | Panel, accordion             |
| **Faceted suggestions**  | Filter options recalculated from all active filters except the option's own category.                                                                        | Dynamic suggestions          |
| **Orphaned selection**   | A selected filter value that no longer appears in the current suggestion set but remains visible so it can be cleared.                                       | Stale option                 |
| **Active filter chip**   | A removable summary of one active filter or search query.                                                                                                    | Chip, pill                   |
| **Timeline filter**      | A date or month/year selection that limits the asset stream and narrows suggestions.                                                                         | Temporal filter              |
| **Space-scoped filter**  | A Filter Surface state interpreted against Space assets and Space People.                                                                                    | Space filter panel           |
| **Global-scoped filter** | A Filter Surface state interpreted against the personal timeline and Personal People.                                                                        | Global filter panel          |
| **Map scope**            | A spatial browsing boundary where filter results become map markers instead of timeline buckets.                                                             | Map filter context           |

## Intelligence pipeline

| Term                    | Definition                                                                                                           | Aliases to avoid   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Embedding**           | A vector representation of asset content, text, or face identity used for similarity search.                         | Vector, ML blob    |
| **Smart Search index**  | The persisted asset embedding data used by semantic search and duplicate detection.                                  | CLIP table         |
| **OCR text**            | Text extracted from images and stored for search.                                                                    | Image text         |
| **Auto classification** | A configurable ML process that compares asset embeddings to prompts and optionally tags or archives matching assets. | Auto tagging       |
| **Auto tag**            | A tag created or applied by auto classification, usually under an `Auto/` hierarchy.                                 | Generated tag      |
| **Duplicate group**     | A set of visually similar assets presented for keep/trash resolution.                                                | Duplicate set      |
| **Duplicate tombstone** | A preserved checksum mapping that prevents resolved duplicate files from being uploaded again.                       | Checksum tombstone |
| **Memory**              | A user-owned generated or saved collection surfaced at a meaningful date.                                            | Memory lane item   |
| **Rule memory**         | A memory produced by a named rule such as birthdays or recent trips.                                                 | Generated memory   |
| **On-this-day memory**  | A memory based on assets from the same day in prior years.                                                           | Anniversary memory |

## Storage and operations

| Term                  | Definition                                                                                             | Aliases to avoid |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ---------------- |
| **Storage backend**   | A target that implements the shared storage interface, currently disk or S3-compatible object storage. | File backend     |
| **Write backend**     | The backend chosen for new files.                                                                      | Active storage   |
| **Serve strategy**    | The chosen way to return media to a client: local file, redirect, or stream.                           | Download method  |
| **Storage key**       | A relative object path used to identify S3-backed media.                                               | S3 path          |
| **Disk path**         | An absolute filesystem path used to identify disk-backed media.                                        | Local key        |
| **Storage migration** | A resumable job process that moves stored media between disk and S3 and updates database paths.        | File migration   |
| **Migration batch**   | A group id for one storage migration run, used for rollback.                                           | Batch id         |
| **System config**     | Persisted server configuration that controls features, ML settings, jobs, storage, and admin behavior. | Settings         |
| **Job**               | A named unit of background work.                                                                       | Task             |
| **Queue**             | A BullMQ work lane that executes related jobs.                                                         | Worker queue     |
| **Worker**            | A running server process that handles jobs or API traffic depending on mode.                           | Service process  |
| **Audit row**         | A database record emitted by triggers to capture changes for sync or history.                          | Change log       |
| **Sync marker**       | A create/update id column used to detect rows that need to re-emit to clients.                         | Version id       |

## Relationships

- A **User** owns zero or more **Assets**, **Libraries**, **Albums**, **Personal People**, **Memories**, **Tags**, and **Workflows**.
- An **Asset** belongs to exactly one owning **User** and may belong to one **Library**.
- An **Album** contains zero or more **Assets** by reference; adding to an album does not copy files.
- A **Shared Space** has one or more **Space Members** and contains **Space Assets** by direct links, linked libraries, or both.
- A **Space Member** has exactly one **Space Role** per **Shared Space**.
- A **Linked Library** makes every eligible **Asset** in that **Library** visible as a **Library-linked space asset**.
- A **Personal Person** belongs to one **User**; a **Space Person** belongs to one **Shared Space**.
- A **Face** belongs to one **Asset**, may point to one **Personal Person**, and may be linked into one or more **Space People** through space-person face links.
- A **Space Person** may display its own **Person name override**, fall back to the linked **Personal Person** name, and expose a member-specific **Person alias**.
- A **Filter Surface** owns one **Filter state**; the page scope decides whether selected `personIds` mean **Personal People** or **Space People**.
- A **Search Palette** query fans out to multiple **Search providers**; a **Page search** query stays inside one **Search scope**.
- A **Smart Search** result depends on the **Smart Search index**; a **Metadata Search** result depends on persisted asset fields.
- A **Storage migration** creates a **Migration batch** and many per-file **Jobs**; rollback changes database paths but does not recreate deleted source files.
- A **Duplicate group** resolution may copy metadata, tags, album membership, and editable space membership to kept **Assets** before trashing the rest.

## Recommended conversation patterns

- Say "Does this affect **Personal People** or **Space People**?" before discussing person IDs.
- Say "Which **Search scope** is this in?" before discussing search or filtering bugs.
- Say "Is this a **Direct space asset** or **Library-linked space asset**?" before debugging Shared Space counts or permissions.
- Say "Is this about **Timeline inclusion** or **Space membership**?" before debugging why space assets appear on Photos.
- Say "Which **Storage backend** owns this path?" before debugging media serving or deletion.
- Say "Is this a **Page search**, **Search Palette** provider, or **Filter Surface** issue?" before opening web search code.

## Implementation anchors

| Area                    | Primary anchors                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**        | `CLAUDE.md`, `docs/docs/developer/architecture.mdx`, `docs/docs/developer/directories.md`                                                                                                                                   |
| **Assets and timeline** | `server/src/schema/tables/asset.table.ts`, `server/src/services/timeline.service.ts`, `server/src/repositories/asset.repository.ts`, `web/src/lib/managers/timeline-manager/`                                               |
| **Filter Surface**      | `web/src/lib/components/filter-panel/filter-panel.ts`, `web/src/lib/components/filter-panel/filter-panel.svelte`, `server/src/services/search.service.ts`, `server/src/repositories/search.repository.ts`                   |
| **Search Palette**      | `web/src/lib/managers/global-search-manager.svelte.ts`, `web/src/lib/components/global-search/`, `docs/docs/features/search-palette.md`                                                                                     |
| **Shared Spaces**       | `server/src/services/shared-space.service.ts`, `server/src/repositories/shared-space.repository.ts`, `server/src/schema/tables/shared-space*.ts`, `web/src/routes/(user)/spaces/`, `web/src/lib/components/spaces/`         |
| **People**              | `server/src/schema/tables/person.table.ts`, `server/src/schema/tables/asset-face.table.ts`, `server/src/schema/tables/shared-space-person*.ts`, `web/src/routes/(user)/people/`, `docs/docs/features/facial-recognition.md` |
| **ML features**         | `server/src/services/smart-info.service.ts`, `server/src/services/classification.service.ts`, `server/src/services/pet-detection.service.ts`, `machine-learning/`, `docs/docs/features/searching.md`                        |
| **Duplicates**          | `server/src/services/duplicate.service.ts`, `server/src/schema/tables/asset-duplicate-checksum.table.ts`, `docs/docs/features/duplicates-utility.md`, `docs/docs/features/video-duplicate-detection.md`                     |
| **Storage**             | `server/src/services/storage.service.ts`, `server/src/repositories/storage.repository.ts`, `server/src/backends/`, `docs/docs/features/s3-storage.md`, `docs/docs/features/storage-migration.md`                            |
| **Permissions**         | `server/src/middleware/auth.guard.ts`, `server/src/repositories/access.repository.ts`, `server/src/enum.ts`                                                                                                                 |

## Example dialogue

> **Dev:** "The people filter works on Photos but not inside a Shared Space. Are these the same people IDs?"
>
> **Domain expert:** "No. On Photos the **Filter Surface** selects **Personal People**. In a Shared Space, the same UI state is translated into **Space People** before the timeline query runs."
>
> **Dev:** "So a Space member clicking Alice in the people strip should filter by the **Space Person**, not the owner's **Personal Person**?"
>
> **Domain expert:** "Correct. The **Space Person** can fall back to a **Personal Person** name and thumbnail, but access and filtering stay inside the **Shared Space**."
>
> **Dev:** "If the count is wrong, should I inspect **Timeline inclusion** or the space detail query?"
>
> **Domain expert:** "Start with the **Search scope**. Photos with `withSharedSpaces` uses a member's **Timeline inclusion** spaces, while a space detail page uses one explicit **Shared Space** boundary."

## Flagged ambiguities

- "People" is overloaded. Use **Personal People** for the user-owned people catalog and **Space People** for Shared Space people.
- "Global people" appears in tests and comments, but it is not system-global; it usually means **Personal People** outside a space scope.
- "Space photos" is too vague. Use **Direct space assets** for assets explicitly added to a space and **Library-linked space assets** for assets included through a linked library.
- "Library" can mean a user-facing external library, a personal photo collection, or a virtual shared collection. Use **Library**, **Personal timeline**, **Album**, or **Shared Space** depending on the boundary.
- "Search" is overloaded. Use **Search Palette**, **Page search**, **Smart Search**, **Metadata Search**, or **Faceted suggestions**.
- "Filter" is overloaded. Use **Filter Surface** for the UI, **Filter state** for selected values, and **Faceted suggestions** for dynamic option lists.
- "Visibility" is overloaded. **Asset visibility** is timeline/archive/hidden/locked; **Hidden person** is a people-list flag; **Timeline inclusion** is a per-member Shared Space setting.
- "Owner" is context-sensitive. Use asset owner, album owner, library owner, or space owner.
- "Member" is context-sensitive. Use **Space member** or **Album member**.
- "Favorite" is context-sensitive. An asset can be favorite, and a **Personal Person** can be favorite; a **Space Person** uses visibility/name/alias instead.
- "Thumbnail" is context-sensitive. Use **Person thumbnail**, **Space cover**, **Album cover**, or **Asset thumbnail**.
- "Shared" is not a single model. Gallery has **Partner sharing**, **Album members**, **Shared links**, and **Shared Spaces**, each with different permissions and access paths.
