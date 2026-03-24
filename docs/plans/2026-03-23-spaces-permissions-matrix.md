# Shared Spaces Permissions Matrix

Generated 2026-03-23 from codebase analysis.

## Permission Chains (from `server/src/utils/access.ts`)

| Permission                 | Access Chain                    | Space Support   |
| -------------------------- | ------------------------------- | --------------- |
| AssetRead                  | owner → album → partner → space | All members     |
| AssetView                  | owner → album → partner → space | All members     |
| AssetDownload              | owner → album → partner → space | All members     |
| AssetUpdate                | owner → space editor            | Editor + Owner  |
| AssetDelete                | owner only                      | No space access |
| AssetCopy                  | owner only                      | No space access |
| AssetEditGet/Create/Delete | owner only                      | No space access |
| SharedSpaceRead            | space member (any role)         | All members     |

## Asset Viewing & Downloading

| Interaction                    | Endpoint                                 | Permission                  | Viewer | Editor | Owner | Non-member |
| ------------------------------ | ---------------------------------------- | --------------------------- | ------ | ------ | ----- | ---------- |
| List assets (timeline buckets) | `GET /timeline/buckets`                  | AssetRead + SharedSpaceRead | Y      | Y      | Y     | N          |
| Get asset details              | `GET /asset/:id`                         | AssetRead                   | Y      | Y      | Y     | N          |
| View thumbnail                 | `GET /asset/:id/thumbnail`               | AssetView                   | Y      | Y      | Y     | N          |
| Download original              | `GET /asset/:id/original`                | AssetDownload               | Y      | Y      | Y     | N          |
| Play video                     | `GET /asset/:id/video/playback`          | AssetView                   | Y      | Y      | Y     | N          |
| Play live photo video          | `GET /asset/:liveVideoId/video/playback` | AssetView                   | Y      | Y      | Y     | N          |

## Search & Filters

| Interaction        | Endpoint                    | Permission      | spaceId support | Viewer | Editor | Owner | Non-member | Notes                                      |
| ------------------ | --------------------------- | --------------- | --------------- | ------ | ------ | ----- | ---------- | ------------------------------------------ |
| Search metadata    | `POST /search/metadata`     | SharedSpaceRead | Yes             | Y      | Y      | Y     | N          | Has requireAccess check                    |
| Smart search       | `POST /search/smart`        | SharedSpaceRead | Yes             | Y      | Y      | Y     | N          | Has requireAccess check                    |
| Search suggestions | `GET /search/suggestions`   | SharedSpaceRead | Yes             | Y      | Y      | Y     | N          | Has requireAccess check (fixed in PR #141) |
| Search random      | `POST /search/random`       | SharedSpaceRead | Yes             | Y      | Y      | Y     | N          | Has requireAccess check                    |
| Search large       | `POST /search/large-assets` | SharedSpaceRead | Yes             | Y      | Y      | Y     | N          | Has requireAccess check                    |
| Explore data       | `GET /search/explore`       | N/A             | No              | N/A    | N/A    | N/A   | N/A        | Not space-scoped                           |

## Asset Modification

| Interaction            | Endpoint                          | Permission                 | Viewer | Editor | Owner | Non-member |
| ---------------------- | --------------------------------- | -------------------------- | ------ | ------ | ----- | ---------- |
| Update metadata        | `PUT /asset/:id`                  | AssetUpdate (space editor) | N      | Y      | Y     | N          |
| Get/apply/delete edits | `GET/PUT/DELETE /asset/:id/edits` | Owner only                 | N      | N      | Y     | N          |
| Delete asset           | `DELETE /asset`                   | Owner only                 | N      | N      | Y     | N          |
| Copy asset             | `PUT /asset/copy`                 | Owner only                 | N      | N      | Y     | N          |

## Download & Archives

| Interaction                 | Endpoint                 | Permission      | spaceId support    | Viewer | Editor | Owner | Non-member |
| --------------------------- | ------------------------ | --------------- | ------------------ | ------ | ------ | ----- | ---------- |
| Download info (by assetIds) | `POST /download/info`    | AssetDownload   | No (assetIds only) | Y      | Y      | Y     | N          |
| Download archive            | `POST /download/archive` | AssetDownload   | No                 | Y      | Y      | Y     | N          |
| Bulk download by space      | `POST /download/info`    | SharedSpaceRead | Yes                | Y      | Y      | Y     | N          |

## Space Management

| Interaction                   | Endpoint                             | Permission                 | Viewer | Editor | Owner | Non-member |
| ----------------------------- | ------------------------------------ | -------------------------- | ------ | ------ | ----- | ---------- |
| Get all spaces                | `GET /shared-spaces`                 | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Get space details             | `GET /shared-spaces/:id`             | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Create space                  | `POST /shared-spaces`                | SharedSpaceCreate          | Y      | Y      | Y     | Y          |
| Update name/description/color | `PATCH /shared-spaces/:id`           | SharedSpaceUpdate (owner)  | N      | N      | Y     | N          |
| Update cover photo            | `PATCH /shared-spaces/:id`           | SharedSpaceUpdate (editor) | N      | Y      | Y     | N          |
| Toggle face recognition       | `PATCH /shared-spaces/:id`           | SharedSpaceUpdate (owner)  | N      | N      | Y     | N          |
| Delete space                  | `DELETE /shared-spaces/:id`          | SharedSpaceDelete          | N      | N      | Y     | N          |
| Mark viewed                   | `PATCH /shared-spaces/:id/view`      | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Get map markers               | `GET /shared-spaces/:id/map-markers` | SharedSpaceRead            | Y      | Y      | Y     | N          |

## Member Management

| Interaction                | Endpoint                                           | Permission                      | Viewer | Editor | Owner | Non-member |
| -------------------------- | -------------------------------------------------- | ------------------------------- | ------ | ------ | ----- | ---------- |
| Get members                | `GET /shared-spaces/:id/members`                   | SharedSpaceRead                 | Y      | Y      | Y     | N          |
| Add member                 | `POST /shared-spaces/:id/members`                  | SharedSpaceMemberCreate (owner) | N      | N      | Y     | N          |
| Update member role         | `PATCH /shared-spaces/:id/members/:userId`         | SharedSpaceMemberUpdate (owner) | N      | N      | Y     | N          |
| Remove member              | `DELETE /shared-spaces/:id/members/:userId`        | SharedSpaceMemberDelete (owner) | N      | N      | Y     | N          |
| Leave space                | `DELETE /shared-spaces/:id/members/:userId` (self) | SharedSpaceMemberDelete         | Y      | Y      | N     | N          |
| Toggle timeline visibility | `PATCH /shared-spaces/:id/members/me/timeline`     | SharedSpaceRead                 | Y      | Y      | Y     | N          |

## Asset Management in Space

| Interaction   | Endpoint                           | Permission                      | Viewer | Editor | Owner | Non-member |
| ------------- | ---------------------------------- | ------------------------------- | ------ | ------ | ----- | ---------- |
| Add assets    | `POST /shared-spaces/:id/assets`   | SharedSpaceAssetCreate (editor) | N      | Y      | Y     | N          |
| Remove assets | `DELETE /shared-spaces/:id/assets` | SharedSpaceAssetDelete (editor) | N      | Y      | Y     | N          |

## Library Management in Space

| Interaction    | Endpoint                                     | Permission                         | Viewer | Editor | Owner | Non-member |
| -------------- | -------------------------------------------- | ---------------------------------- | ------ | ------ | ----- | ---------- |
| Link library   | `PUT /shared-spaces/:id/libraries`           | Admin + SharedSpaceUpdate (editor) | N      | Y      | Y     | N          |
| Unlink library | `DELETE /shared-spaces/:id/libraries/:libId` | Admin + SharedSpaceUpdate (editor) | N      | Y      | Y     | N          |

### Library-Linked Asset Access

Library-linked assets (assets belonging to a library linked via `shared_space_library`) must be included in all space-scoped queries. The correct pattern uses `OR EXISTS` to check both `shared_space_asset` (direct) and `shared_space_library` (library-linked) paths.

| Query                      | Method                     | Includes Library Assets | Notes                                            |
| -------------------------- | -------------------------- | ----------------------- | ------------------------------------------------ |
| Timeline (buckets/detail)  | `getTimeBuckets/Bucket`    | Y                       | OR EXISTS pattern                                |
| Asset count                | `getAssetCount`            | Y                       | UNION pattern                                    |
| Recent assets / hero       | `getRecentAssets`          | Y                       | UNION pattern                                    |
| New asset count            | `getNewAssetCount`         | Y                       | UNION (uses asset.createdAt for lib assets)      |
| Map markers                | `getMapMarkers`            | Y                       | UNION pattern                                    |
| Access control (view)      | `checkSpaceAccess`         | Y                       | UNION + livePhotoVideoId handling                |
| Access control (edit)      | `checkSpaceEditAccess`     | Y                       | UNION + role filter                              |
| Asset-in-space check       | `isAssetInSpace`           | Y                       | UNION pattern                                    |
| Face-in-space check        | `isFaceInSpace`            | Y                       | UNION pattern                                    |
| All asset IDs              | `getAssetIdsInSpace`       | Y                       | UNION pattern                                    |
| Space IDs for asset        | `getSpaceIdsForAsset`      | Y                       | UNION pattern                                    |
| People / faces             | `shared_space_person_face` | Y                       | Populated by face sync job                       |
| Person assets              | `getPersonAssetIds`        | Y                       | Via shared_space_person_face                     |
| Search (smart/metadata)    | `searchAssetBuilder`       | Y                       | OR EXISTS; skips userIds filter when spaceId set |
| Filter suggestions         | `getExifField`             | Y                       | OR EXISTS; skips ownerId filter when spaceId set |
| Contribution counts        | `getContributionCounts`    | N (by design)           | Tracks manual contributions only                 |
| Member activity            | `getMemberActivity`        | N (by design)           | Tracks manual contributions only                 |
| Last contributor           | `getLastContributor`       | N (by design)           | Tracks manual contributions only                 |
| Last asset added timestamp | `getLastAssetAddedAt`      | N (by design)           | Used in removeAssets() only                      |

## People / Face Recognition

| Interaction          | Endpoint                                            | Permission                 | Viewer | Editor | Owner | Non-member |
| -------------------- | --------------------------------------------------- | -------------------------- | ------ | ------ | ----- | ---------- |
| Get people           | `GET /shared-spaces/:id/people`                     | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Get person           | `GET /shared-spaces/:id/people/:personId`           | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Get person thumbnail | `GET /shared-spaces/:id/people/:personId/thumbnail` | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Get person assets    | `GET /shared-spaces/:id/people/:personId/assets`    | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Update person        | `PUT /shared-spaces/:id/people/:personId`           | SharedSpaceUpdate (editor) | N      | Y      | Y     | N          |
| Delete person        | `DELETE /shared-spaces/:id/people/:personId`        | SharedSpaceUpdate (editor) | N      | Y      | Y     | N          |
| Merge people         | `POST /shared-spaces/:id/people/:personId/merge`    | SharedSpaceUpdate (editor) | N      | Y      | Y     | N          |
| Set alias            | `PUT /shared-spaces/:id/people/:personId/alias`     | SharedSpaceRead            | Y      | Y      | Y     | N          |
| Delete alias         | `DELETE /shared-spaces/:id/people/:personId/alias`  | SharedSpaceRead            | Y      | Y      | Y     | N          |

## Activity

| Interaction    | Endpoint                            | Permission      | Viewer | Editor | Owner | Non-member |
| -------------- | ----------------------------------- | --------------- | ------ | ------ | ----- | ---------- |
| Get activities | `GET /shared-spaces/:id/activities` | SharedSpaceRead | Y      | Y      | Y     | N          |

---

## Known Limitations (not bugs)

- Search explore/cities not space-scoped
- Asset edits/delete/copy are owner-only regardless of space role
- Contribution counts/member activity track manual additions only (library-linked assets excluded by design)
