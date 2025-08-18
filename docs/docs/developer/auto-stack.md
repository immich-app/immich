---
id: auto-stack
title: AutoStack configuration and scoring
sidebar_label: AutoStack
---

AutoStack groups photos shot close together into "stack candidates" using temporal gaps, filename continuity, and visual similarity. Candidates can be promoted into real stacks by the user or auto-promoted above a threshold.

Key behaviors
- Temporal grouping around a new asset within `windowSeconds`, ensuring adjacent assets inside a group are within `maxGapSeconds`.
- Optional merge of adjacent groups when the temporal gap is small (`maxMergeGapSeconds`) and the visual bridge is strong (`visualBridgeThreshold`).
- Outlier pruning can remove assets that reduce average visual cohesion when improvement exceeds `outlierPruneMinDelta`.

Scoring (overview)
The overall candidate score is a 0-100 value blended from:
- size: favors groups with more items (diminishing returns)
- timeSpan: shorter time spans score higher
- continuity: consistent sequential capture (filenames/exif) boosts score
- visual: average pairwise cosine similarity of embeddings (normalized to 0..1)
- exposure: consistency of exposure settings

Important settings (server.autoStack)
- enabled: master switch for candidate generation
- windowSeconds / maxGapSeconds: primary temporal grouping control
- minGroupSize: minimum assets in a candidate
- horizonMinutes: backfill look-back window for scheduled generation
- cameraMatch: require same camera make+model when present
- maxCandidates: cap on active candidates per user
- autoPromoteMinScore: if > 0, auto-promote at or above this score
- weights: scoring weights for { size, timeSpan, continuity, visual, exposure }
- visualPromoteThreshold: immediate promotion on strong visual cohesion
- Merging: maxMergeGapSeconds, visualBridgeThreshold, mergeScoreDelta
- Outliers: outlierPruneEnabled, outlierPruneMinDelta, outlierPruneIterative
- pHash backfill: pHashBackfillEnabled, pHashBackfillBatchSize
- Aging: candidateAgingDays, candidateAgingScoreThreshold
- Visual expansion: secondaryVisualWindowSeconds, visualGroupSimilarityThreshold, pHashHammingThreshold, secondaryVisualMaxAdds
- Overlap & primary: overlapMergeEnabled, bestPrimaryHeuristic
- Session segmentation: sessionMaxSpanSeconds, sessionMinAvgAdjacency, sessionMinSegmentSize

API endpoints (authenticated)
- GET /api/auto-stack/candidates — List active candidates ordered by score and recency.
- GET /api/auto-stack/candidates/score-stats — Histogram and recommended threshold.
- POST /api/auto-stack/candidates/:id/promote — Promote a candidate (optional body: { primaryAssetId }).
- DELETE /api/auto-stack/candidates/:id — Dismiss a candidate.

Disable
Turn off by setting `server.autoStack.enabled = false`. Endpoints return a disabled state and no new candidates are generated.

Notes
- Defaults are defined in server/src/config.ts. DTO bounds and comments live in server/src/dtos/system-config.dto.ts.
- For details on repository helpers and tests, see Plan.md and server/src/services/auto-stack.* files.
