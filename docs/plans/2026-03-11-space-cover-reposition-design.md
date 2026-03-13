# Space Cover Photo Repositioning

## Problem

Space cover photos display using CSS `object-cover` with default center positioning. For landscape or portrait photos, the most interesting part of the image is often cropped out. Users have no way to control which portion of their photo is visible in the hero banner.

## Design

### Interaction Flow

1. **New cover**: User clicks "Set Cover Photo" on hero, selects an asset (existing flow). After selection, hero enters reposition mode automatically.
2. **Existing cover**: User clicks "Reposition" button (visible when a cover is already set) to enter reposition mode.
3. **Reposition mode**: The image becomes vertically draggable within the fixed 250px hero banner. A translucent overlay shows "Drag to reposition" hint text with Save/Cancel buttons.
4. **Save**: Stores a `thumbnailCropY` percentage (0-100) via existing `PATCH /shared-spaces/:id`.
5. **Cancel**: Reverts to previous position.

### Hero Button States

| State           | Buttons (top-right)                            |
| --------------- | ---------------------------------------------- |
| No cover set    | "Set Cover Photo"                              |
| Cover set       | "Reposition" + "Change Cover"                  |
| Reposition mode | (no buttons - replaced by Save/Cancel overlay) |

### Data Model

Add one nullable column to `shared_space` table:

```
thumbnailCropY: smallint | null
```

- Range: 0-100 (percentage)
- `null` = default center (50%)
- Maps to CSS `object-position: center {value}%`
- 0% = top of image visible, 100% = bottom visible

### Reposition Mode UI

- Semi-transparent dark gradient overlay on top/bottom edges to indicate drag bounds
- Cursor: `grab` (idle), `grabbing` (dragging)
- Centered floating text: "Drag to reposition" (fades on first drag)
- Bottom-right corner: Cancel (ghost pill) and Save (solid white pill)
- Drag constrained so the image always fills the hero (no gaps)
- Supports mouse drag and touch drag

### Normal Display

The hero `<img>` applies:

```css
object-position: center {space.thumbnailCropY ?? 50}%;
```

No visual change when no custom position is set.

### Scope

**Changes:**

| Layer             | Change                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| DB schema         | Add `thumbnailCropY` column to `shared_space` table                                    |
| Migration         | New migration for the column                                                           |
| DTO               | Add `thumbnailCropY` to `SharedSpaceUpdateDto` and `SharedSpaceResponseDto`            |
| space-hero.svelte | Add reposition mode with drag handling, apply `object-position`, dual button layout    |
| Space detail page | Wire up reposition mode entry/exit, API call on save, auto-enter after cover selection |
| OpenAPI + SDK     | Regenerate to include new field                                                        |

**No changes:**

- No server-side image processing
- No new API endpoints (reuses existing PATCH)
- Space cards keep default center-crop
- Existing asset selection flow unchanged
