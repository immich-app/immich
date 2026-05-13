---
title: Face Identity Backfill
sidebar_position: 12
---

# Face Identity Backfill

Gallery uses **Face Identities** as internal sameness keys across Personal People and Space People. The identity tables are not user-facing, but `/people`, people filter suggestions, global search, map filters, and album filters depend on the links being present.

There are two related backfills.

## Identity Link Backfill

`FaceIdentityBackfill` repairs legacy face-recognition data that predates identity-backed people.

It has two stages:

1. Personal people stage
   - Ensures each `person` row has a `face_identity`.
   - Links each visible, non-deleted `asset_face` assigned to that person into `face_identity_face`.
   - Skips hidden faces, deleted faces, and faces on deleted assets.

2. Space people stage
   - Looks at each legacy `shared_space_person` without an `identityId`.
   - Reads the identities of its linked visible faces.
   - Assigns the space person when all linked evidence points to exactly one identity and the space does not already have another person for that same identity.
   - Leaves ambiguous or duplicate space people unresolved and logs the conflict count.

The job is chunked and resumable. It processes personal people first, requeues itself with a cursor until that stage is complete, then does the same for space people. The root job uses a stable queue job id, so repeated bootstrap checks or manual triggers coalesce while a run is pending. Cursor jobs include the cursor in the job id, so each page can still progress independently. Bootstrap also skips queuing a new root job while any identity backfill page is active, delayed, paused, or waiting.

After the final shared-space identity-link page runs, it queues `SharedSpacePersonMetadataBackfill` once if any shared-space rows were linked. Linking a legacy Space Person to an identity can make Personal People or other visible Space People newly eligible as name and birth-date sources.

## Identity Link Trigger

The microservices worker checks for identity backfill work on `AppBootstrap`.

It queues `FaceIdentityBackfill` when any of these are true:

- a `person` row has no `identityId`;
- a visible, non-deleted assigned face is missing a `face_identity_face` link;
- a legacy `shared_space_person` can be resolved to exactly one identity without creating a duplicate identity inside the same space.

This means upgraded installs should not require users to reset face recognition. Restarting the microservices worker is enough to re-run the check. Force-clearing face recognition is destructive and should only be a last-resort repair because it deletes existing recognition state and rebuilds people from scratch.

Admins can also start this repair from the **People identity maintenance** queue on the admin Jobs page. The queue start action enqueues the `FaceIdentityBackfill` root job and shows progress alongside the other queue stats.

## Troubleshooting Personal and Global People Drift

When Personal People and Global People do not line up, treat it as identity-link drift before resetting face recognition. Common symptoms include:

- a person appears correctly in a user's personal People view but is missing from Global People;
- Global People shows duplicate rows for the same visible person;
- a people filter, global search, map filter, or album filter returns a different person set than the personal People page;
- a Space Person is visible in a Shared Space but does not appear in Global People even though that space is enabled for the viewer's timeline.

The first repair step is to run **People identity maintenance** from **Administration -> Jobs**. Starting that queue runs the `FaceIdentityBackfill` job, which repairs missing Personal Person identity links, missing face-to-identity links, and resolvable legacy Space Person identity links. Wait for the queue to drain before comparing the People pages again; the job is paged, resumable, and safe to rerun.

If identity maintenance finishes but a selected Shared Space still disagrees with Global People, check the scope before running heavier repairs. Global People only includes spaces where the viewer has **Show photos in timeline** enabled, while an explicit Shared Space page reads that space directly. If the scope is correct and only that space's assignments are stale, queue a selected-space face rematch by toggling face recognition off and back on for that space.

Do not use a full face-recognition reset as the first debugging step. Resetting face recognition deletes recognition state and rebuilds people from scratch, while People identity maintenance repairs the identity mapping layer in place.

## Shared Space Face Link Repair

Global People and Space People do not read the same assignment table. Global People uses `face_identity_face` links in the viewer's accessible timeline scope. A selected Shared Space uses `shared_space_person_face` links for the selected space's direct assets and linked-library assets.

When an identity-backed face is processed by `SharedSpaceFaceMatch`, `SharedSpaceLibraryFaceSync`, or `SharedSpaceFaceMatchAll`, Gallery repairs the selected-space face link if it is missing, points at a space person with no identity, points at a different identity, or points at a type-incompatible space person. The repair deletes only the selected face's selected-space assignment rows, inserts the identity-correct assignment when a compatible space person exists or can be created, recounts affected space people, and removes stale selected-space people that became orphaned.

The repair is intentionally selected-space scoped. The same asset face can be linked into multiple spaces, and repairing one space must not rewrite another space's person rows.

For existing drift, queue `SharedSpaceFaceMatchAll` for the affected space. The existing operator route is to toggle face recognition off and back on for that space; enabling face recognition queues the full-space rematch. Linking or relinking an external library queues `SharedSpaceLibraryFaceSync` for that library, and adding individual assets queues `SharedSpaceFaceMatch` for those assets.

Archived assets are a known scope difference. Selected Space People currently counts linked-library assets whose visibility is archive or timeline, while Global People uses timeline-visible assets. Matching detected-face totals are only expected when the compared scopes have the same visibility and membership rules.

## Metadata Backfill

`SharedSpacePersonMetadataBackfill` recalculates inherited names and birth dates for identity-backed Space People. It does not merge identities and it does not overwrite manual space metadata.

For each identity-backed `shared_space_person`, it:

- gathers eligible source metadata from accessible Personal People and Space People;
- respects `sharePersonMetadata`, `showInTimeline`, space membership, space deletion, source Space Person visibility, target-space asset adders, and linked-library linkers;
- ranks candidates by space role, whether the source is the asset adder or library linker, and supporting face count;
- applies the inherited name or birth date only when the target field is unlocked (`none` or `inherited`);
- clears previously inherited fields when the old source is no longer eligible and no replacement source wins.

Manual target-space names and birth dates stay manual. Aliases are member-local and are not backfilled.

## Metadata Triggers

Metadata backfill is queued automatically when an operation can change inheritance:

- a Personal Person name or birth date changes;
- a Personal Person is deleted;
- scoped people are merged or detached;
- a Space Person name, birth date, or hidden state changes;
- an identity-backed Space Person is deleted;
- identity-backed Space People are merged by manual repair, face matching, or deduplication;
- a Shared Space is deleted;
- assets are removed from a Shared Space;
- a linked library is unlinked from a Shared Space;
- a member joins, leaves, is removed, or changes role;
- a member changes `showInTimeline` or `sharePersonMetadata`;
- an owner disables another member's metadata contribution.

When the changed operation is tied to one identity, the job is queued with that `identityId`. Membership, role, preference, and space deletion changes can affect many identities, so they queue a full metadata backfill.

Root metadata backfill jobs are also deduplicated with stable queue job ids: one for a full-library metadata backfill and one per identity-scoped metadata backfill. Cursor jobs include the cursor in the job id, so a large library is still processed page by page without enqueuing duplicate full scans. Dedupe-keyed backfill jobs are removed on failure so the next bootstrap or metadata-changing operation can retry instead of being blocked by a stale failed job id.

Admins can manually queue either root job from the Jobs page create-job modal. `FaceIdentityBackfill` repairs missing identity links first and then queues metadata repair when shared-space links changed. `SharedSpacePersonMetadataBackfill` only recalculates inherited space-person metadata and is safe to rerun when identity links already exist.

## Product Effects

After identity links exist, these surfaces read the same identity-backed access model:

- `/people?withSharedSpaces=true`;
- global people search;
- Photos, Map, and Album filter-panel people suggestions;
- global and album-scoped asset searches filtered by person;
- explicit Shared Space people pages and space-scoped filters.

Outside an explicit space page, Shared Space people and assets only contribute through spaces where the viewer has `showInTimeline=true`. If a member disables **Show photos in timeline**, global people, global search, map filters, album filters, and metadata inheritance stop using that space. If the member enables it again, the next face sync or metadata backfill can restore eligible inherited metadata.
