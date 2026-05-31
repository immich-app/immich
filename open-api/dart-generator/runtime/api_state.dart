// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Lifecycle state of an endpoint or DTO field, from the spec's
/// `x-immich-state` / `x-immich-history`. Surfaced on the inlined `*State`
/// metadata (e.g. `AssetResponseDto.isEditedState == ApiState.beta`).
enum ApiState { added, alpha, beta, stable, updated, deprecated, internal }
