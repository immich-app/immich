# Stacks and AutoStack

Stacks let you group similar photos and videos so your timeline stays tidy while keeping the full set a tap or click away. AutoStack can create those stacks for you automatically when new media is processed.

- Manual Stacks: You pick multiple assets and stack them. One becomes the primary and is shown in the timeline.
- AutoStack: Immich groups near-duplicates and burst shots automatically based on time, camera, and visual similarity.

This page explains how stacks work, how to use them on web and mobile, and how to tune AutoStack.

## What is shown in the timeline

- Primary-only: When an asset is in a stack, only the primary asset is shown in the timeline or grid. A stack badge (count) indicates how many items are in the stack.

<img src={require('./img/timeline-stack.webp').default} width='100%' height='100%' title='Timeline with Stacked Photo' />

---

- Open a stack: Open the primary asset to see the whole stack and quickly switch between items.

<img src={require('./img/stack-selected.webp').default} width='100%' height='100%' title='Timeline with Stacked Photo' />


> Tip: Some views fetch the timeline withStacked=true, meaning non-primary items are hidden from the grid but available inside the viewer and actions.


## Create, edit, and remove stacks (manual)

Web

- Select 2 or more assets in Photos or in the Duplicates utility
- Open the actions menu and choose Stack to create a stack

<img src={require('./img/create-a-stack.webp').default} width='100%' height='100%' title='Timeline with Stacked Photo' />

---

- To unstack: select the stacked primary and choose Unstack

<img src={require('./img/unstack.webp').default} width='100%' height='100%' title='Timeline with Stacked Photo' />

---

- To remove one item from a stack: open the stack, select the item, and choose Remove from stack
- To change primary: open the stack and set a different item as primary

Mobile

- Select 2 or more assets and choose Stack
- Open a stacked asset to switch between items and optionally Unstack

Permissions

- API permissions involved are stack.create, stack.read, stack.update, and stack.delete.

Related API docs

- POST /stacks: /docs/api/create-stack
- GET /stacks/:id /docs/api/get-stack
- PUT /stacks/:id /docs/api/update-stack (set a new primary)
- DELETE /stacks or /stacks/:id /docs/api/delete-stacks and /docs/api/delete-stack
- DELETE /stacks/:id/assets/:assetId: /docs/api/remove-asset-from-stack

## AutoStack (automatic grouping)

AutoStack listens for new or reprocessed media and forms stacks automatically. It uses a blend of:

- Time proximity: photos taken within a short window
- Continuity: sequential filenames or minimal capture gaps
- Camera match: optionally require same make + model as the reference shot
- Visual similarity: CLIP embeddings (machine-learning) and perceptual hash (pHash) to find near-duplicates
- Orientation consistency: avoids mixing portrait/landscape/panorama in the same stack
- Session segmentation and merging: splits overly long sessions and merges adjacent probable groups
- Outlier pruning: removes an outlier if it improves the group cohesion
- Primary selection heuristic: prefers lower ISO and shorter exposure when choosing the primary

Behavior highlights

- When a group scores high enough (or is visually similar enough), AutoStack immediately promotes it to a real stack (auto-promotion)
- AutoStack runs per-asset after metadata extraction and may also be queued in bulk by an administrator
- Machine Learning improves results; with ML off, AutoStack still considers time/continuity but with reduced visual cues

### Configure AutoStack

Administrators can tune server.autoStack in System Settings (configuration). Key options:

- enabled: Turn AutoStack on/off
- windowSeconds: Time window around the reference shot to search for candidates
- maxGapSeconds: Max allowed gap between adjacent items inside one group
- minGroupSize: Minimum items required to form a stack
- cameraMatch: Require the same camera make+model as the reference when available
- autoPromoteMinScore: Auto-promote a candidate if its score is at or above this value
- visualPromoteThreshold: Alternatively auto-promote when the group’s visual cohesion exceeds this threshold
- weights: Influence the scoring (size, timeSpan, continuity, visual, exposure)
- maxMergeGapSeconds, visualBridgeThreshold, mergeScoreDelta: Control whether nearby groups are merged based on time or visual “bridge” similarity
- outlierPruneEnabled, outlierPruneMinDelta, outlierPruneIterative: Remove items that harm group similarity
- overlapMergeEnabled: Merge intersecting groups into one unified stack
- secondaryVisualWindowSeconds, visualGroupSimilarityThreshold, pHashHammingThreshold, secondaryVisualMaxAdds: Pull in near-duplicates just outside the main window (cautiously)
- bestPrimaryHeuristic: Choose a better primary (lower ISO, shorter exposure, etc.)
- sessionMaxSpanSeconds, sessionMinAvgAdjacency, sessionMinSegmentSize: Split overly long sessions with weak adjacency

Defaults are sensible for most libraries. Large libraries or fast burst shooters may benefit from increasing windowSeconds and maxMergeGapSeconds.

Note: Visual features depend on the Immich Machine Learning service. See Features > Facial recognition and ML hardware acceleration for ML setup details.

## Where to use stacks in the app

- Photos: Create stacks from selections; stacked items show as a count badge; open a photo to browse its stack
- Favorites and partner timelines: Respect stacked view (primary only) while allowing stack operations
- Utilities > Duplicates: Quickly stack detected duplicates with a single action
- Trash: Unstacking or removing items updates the timeline appropriately

## Troubleshooting and tips

- I don’t see non-primary photos: That’s expected when withStacked is enabled; open the primary to browse the full stack
- Over-stacking (too many items grouped): Reduce windowSeconds or visual thresholds; disable overlapMergeEnabled as a test
- Under-stacking (bursts not grouped): Increase maxGapSeconds or windowSeconds; ensure ML is running for better visual grouping
- Wrong primary: Change the primary via Update Stack (web or API); consider enabling bestPrimaryHeuristic
- Mixing portrait and landscape: By design, AutoStack enforces orientation homogeneity to keep stacks coherent


---

See also

- API: Stacks endpoints under /docs/api
- Features: Searching (advanced filters work with stacked views)
- Features: Tags and XMP sidecars
