# Known-Face Auto-Classification Filter Design

## Context

GitHub discussion: https://github.com/open-noodle/gallery/discussions/321

Auto-classification currently evaluates every eligible asset with a CLIP embedding against every enabled classification category. The requested enhancement is an opt-in way to avoid applying selected auto-classification categories to personal photos that contain known faces.

Gallery already stores auto-classification categories in system config and tracks one `classifiedAt` timestamp per asset in `asset_job_status`. Facial recognition data is stored through `asset_face` rows linked to `person` rows, with `facesRecognizedAt` currently written after face detection queues recognition jobs. That timestamp does not prove all face recognition jobs have completed.

## Goals

- Let each classification category define its own face exclusion behavior.
- Preserve current behavior for existing categories and installs.
- Treat face-aware classification as dependent on completed facial recognition, not only completed face detection.
- Keep the implementation compatible with the existing single `classifiedAt` model.
- Avoid automatic cleanup of existing auto-tags when face rules or face metadata change.

## Non-Goals

- Do not remove existing `Auto/...` tag assignments when a face rule is added or when a person is later named.
- Do not add per-category classification history.
- Do not classify face-free categories in one phase and face-aware categories in a later phase.
- Do not treat unassigned detected faces as known faces.
- Do not include pet/person-like pet detection rows in the human face exclusion checks.

## Product Behavior

Each classification category gets a **Face exclusion** setting:

- `Off` - category behaves exactly as it does today.
- `Any assigned face` - skip this category when the asset has at least one visible human face linked to a person cluster.
- `Named people` - skip this category when the asset has at least one visible human face linked to a person with a non-empty name.
- `Named, visible people` - skip this category when the asset has at least one visible human face linked to a non-hidden person with a non-empty name.

The setting is per category. For example, an admin can allow a `Screenshots` category to classify images that contain faces while configuring a `Nature` category to skip assets with known people.

The behavior is future-only. The rule is evaluated when an asset is classified. Existing `Auto/...` tags are not removed because a category rule changes, because face recognition later assigns a face, or because a person is later named or hidden.

## Configuration Model

Add `faceExclusion` to each classification category:

```ts
type ClassificationFaceExclusion = 'off' | 'any_assigned_face' | 'named_people' | 'named_visible_people';
```

Existing categories default to `off`. Config loading and DTO validation must accept existing persisted config entries that do not have the field yet.

No database migration is needed because classification categories are persisted inside system configuration. The compatibility work belongs in the config schema/defaulting path and generated OpenAPI/SDK types.

Example config:

```json
{
  "classification": {
    "enabled": true,
    "categories": [
      {
        "name": "Nature",
        "prompts": ["a landscape photo", "a nature scene"],
        "similarity": 0.28,
        "action": "tag",
        "enabled": true,
        "faceExclusion": "named_visible_people"
      }
    ]
  }
}
```

## Server Design

Classification keeps one pass per asset. The handler loads enabled categories, determines whether any enabled category has `faceExclusion !== 'off'`, and only evaluates face state in that case.

Classification flow:

1. Load the asset and config.
2. If classification is disabled, return `Skipped`.
3. Load the smart-search embedding. If absent, return `Skipped`.
4. Build the enabled category list.
5. If no categories are enabled, set `classifiedAt` and return `Skipped`.
6. If any enabled category is face-aware:
   - If facial recognition is disabled, exclude all face-aware categories from this run.
   - If facial recognition is enabled, wait for face detection and facial recognition queues to finish, then load a face summary for this asset.
7. Evaluate CLIP similarity for eligible categories.
8. Apply matching `Auto/{category}` tags and archive the asset if any matched eligible category uses `tag_and_archive`.
9. Set `classifiedAt`.

If facial recognition is disabled and every enabled category is face-aware, the asset is still marked classified for that run. This avoids retrying the same asset forever. Enabling facial recognition later requires the admin to run a forced classification scan, which already resets `classifiedAt`.

### Waiting For Recognition

The current `facesRecognizedAt` field is not sufficient as a completion signal because it is written by face detection after recognition jobs are queued. To honor "wait for actual facial recognition completion", classification should wait on queue state before evaluating face-aware categories.

The existing job wait helper should be extended or replaced for this use case so it considers pending work, not only active work. Pending should include active, waiting, and delayed jobs. If a required queue is paused while it still has pending jobs, classification should keep waiting and log that the face-aware classification job is blocked by the paused queue. Classification should wait for both:

- `QueueName.FaceDetection`
- `QueueName.FacialRecognition`

The wait should live in the classification path only when face-aware categories are enabled. Installations that keep all categories at `off` should not wait on face queues.

### Queue-All Behavior

`handleClassifyQueueAll({ force: true })` already resets `classifiedAt` and streams assets for classification. For face-aware categories, a forced scan should also ensure facial recognition work is queued before classification jobs are queued. The classify handler still performs the queue wait, so this ordering does not need to be perfect, but queueing face work first avoids avoidable blocking per asset.

When facial recognition is disabled, queue-all does not need to queue face work. Face-aware categories are skipped by the classify handler.

## Repository Design

Add a classification repository method that returns a compact face summary for one asset:

```ts
interface ClassificationFaceSummary {
  hasAssignedFace: boolean;
  hasNamedPerson: boolean;
  hasNamedVisiblePerson: boolean;
}
```

The query should consider only:

- `asset_face.assetId = assetId`
- `asset_face.deletedAt IS NULL`
- `asset_face.isVisible IS TRUE`
- `asset_face.personId IS NOT NULL`
- joined `person.type = 'person'`

Rule mapping:

- `any_assigned_face` -> `hasAssignedFace`
- `named_people` -> `hasNamedPerson`
- `named_visible_people` -> `hasNamedVisiblePerson`

Names should be treated as present only when `person.name` is not an empty string after trimming.

## Web Design

The existing admin classification category editor gets a **Face exclusion** dropdown. It appears alongside the current category settings and is disabled when config-file mode makes system config read-only.

The category summary row should show the selected rule when it is not `Off`, so admins can scan which categories are face-aware without opening each category. Existing categories with no explicit field display `Off`.

The UI should use the generated SDK enum/type after OpenAPI regeneration. Until then, local component tests can use the literal values through the generated type shape.

## Documentation

Update:

- `docs/docs/features/auto-classification.md`
- `docs/docs/install/config-file.md`

Docs should explain:

- The setting is per category.
- `Off` preserves existing behavior.
- Face-aware rules require facial recognition.
- When facial recognition is disabled, face-aware categories are skipped.
- The behavior is future-only; existing auto-tags are not removed automatically.
- Unassigned detected faces do not count as known faces.

## Testing

Server unit tests:

- Config/DTO accepts `faceExclusion` and defaults old categories to `off`.
- `handleClassify` does not load face data or wait for face queues when all enabled categories use `off`.
- `any_assigned_face` skips only the matching category when an assigned visible human face exists.
- `named_people` skips only when a linked person has a non-empty name.
- `named_visible_people` ignores hidden named people.
- Face-aware categories are skipped when facial recognition is disabled, while `off` categories still run.
- When face-aware categories exist and facial recognition is enabled, classification waits for face detection and facial recognition queue completion before evaluating.
- `handleClassifyQueueAll({ force: true })` queues or ensures face recognition work before classification when needed.

Repository or medium tests:

- The face-summary query returns the expected booleans for assigned, named, hidden, unassigned, deleted, invisible, and pet rows.

Web tests:

- Category editor shows the Face exclusion dropdown.
- Existing categories with no explicit field show `Off`.
- Saving a category persists the selected rule.
- Category summary shows the selected non-`Off` rule.

## Open Questions Resolved

- Face exclusion is per category, not global.
- Existing tags are future-only and are not cleaned up automatically.
- Face-aware classification waits for actual recognition completion.
- If any enabled category uses face exclusion, the asset's single classification pass waits; face-free categories do not run earlier in a separate phase.
- When facial recognition is disabled, face-aware categories are skipped.
