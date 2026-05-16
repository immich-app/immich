# People Sort Order Design

## Problem

The global `/people` page and space people page no longer preserve the intended ordering for unnamed people. The API paths already compute or store people asset counts, but the web page re-sorts loaded people with a comparator that only considers favorite status, name, and id. As a result, multiple unnamed people are ordered by id instead of photo count.

The intended behavior is:

1. Favorites first where favorites exist.
2. Named people alphabetically.
3. Unnamed people by photo count descending.

The implementation must preserve pagination correctness for large libraries. It must not fetch every person into the browser just to sort.

## Canonical Sort Contract

Global people use this order:

1. Visible people before hidden people when hidden people are included in management or visibility contexts.
2. Favorite people before non-favorite people.
3. Within each favorite bucket, named people before unnamed people.
4. Named people sort by trimmed display name, case-insensitively.
5. Unnamed people sort by accessible asset/photo count descending.
6. Stable id tiebreak.

Space people use the same contract without favorite ordering:

1. Visible people before hidden people when hidden people are included in management or visibility contexts.
2. Named people before unnamed people.
3. Named people sort by trimmed display name, case-insensitively.
4. Unnamed people sort by `assetCount` descending.
5. Stable id tiebreak.

Names containing only whitespace are treated as unnamed for both global and space people. The comparator and SQL should use the same normalization rule: trim before deciding whether a name is present, and compare names case-insensitively.

## Server Design

The server remains the source of truth for paginated ordering.

For global non-shared people, `PersonRepository.getAllForUser()` should keep its existing favorite and visibility ordering, then make the named/unnamed split explicit: named people sort alphabetically, unnamed people sort by their grouped asset/face count descending, then person id as the stable tiebreak. The SQL should not use creation time as a tiebreak because the web comparator cannot reproduce that order from the current DTO.

For global identity-aware people, `FaceIdentityRepository.getAccessiblePeopleIdentityPage()` should order identity pages by the same global contract. It already builds `best_profiles` and `identity_counts.visibleAssetCount`; the change is to compute an identity-level favorite flag from the accessible primary/user-person profile when present, then order by favorite, named status, name, unnamed count, and identity id. This keeps pagination correct when `/people` is loaded with `withSharedSpaces: true`. A space-only identity with no personal favorite flag is treated as non-favorite.

For space people, `SharedSpaceRepository.getPersonsBySpaceId()` already orders named people alphabetically and unnamed people by `assetCount` descending. The design is to keep that server behavior and ensure visible-before-hidden ordering is present for `withHidden` contexts.

## Web Design

The web comparator should match the server contract for local updates over already-loaded rows. It should understand both global and space DTO count fields:

- `numberOfAssets` for global people.
- `assetCount` for space people.

The comparator should use count only when both compared people are unnamed. Named people remain alphabetical even if another named person has more photos.

The current `sortPeopleByFavoriteAndName` name is too narrow. Rename it to a management-oriented name such as `sortPeopleForManagement`, while keeping a compatibility export if existing non-page call sites still expect the old name.

The global `/people` page and `/spaces/[spaceId]/people` page should use the canonical comparator for display after local mutations such as rename, hide, or favorite toggle.

The comparator must be covered as a pure unit so route tests do not become the only specification for sort behavior.

## Performance

This design does not add client-side full-list fetching. Pagination stays server-side.

Space people sort by a denormalized `shared_space_person.assetCount`, so the sort does not rescan the photo library.

Global identity-aware people already compute `visibleAssetCount` in the current query. The sort should reuse that grouped count rather than issuing extra per-person count queries.

## Testing

Implementation should follow test-driven development: add the failing tests for each behavior first, confirm they fail on the current code, then implement the smallest change that makes them pass.

Add or update tests with at least two unnamed people with different counts.

Client tests:

- Global people page renders favorites first, named people alphabetically, then unnamed people by `numberOfAssets` descending.
- Global people page renders favorite unnamed people before non-favorite named people.
- Space people page renders named people alphabetically, then unnamed people by `assetCount` descending.
- Renaming an unnamed space person still moves it into the named alphabetical bucket without a refetch.
- Pure comparator tests cover whitespace-only names, case-insensitive names, missing count values, equal counts, and id tiebreaks.

Server tests:

- Global identity-aware people ordering covers favorite first and unnamed count ordering.
- Global identity-aware pagination covers a boundary where an unnamed high-count person would be incorrectly stranded on a later page if sorting happened only client-side.
- Non-shared people ordering keeps named alphabetical and unnamed count ordering.
- Space people repository or service ordering covers multiple unnamed people with different `assetCount` values.
- Space people ordering covers whitespace-only names as unnamed and equal `assetCount` id tiebreaking.

Regression tests should avoid relying on only one unnamed person, because that does not verify the count ordering.

Edge cases that must be covered or explicitly preserved by existing tests:

- Empty people lists return empty results without errors.
- Hidden people remain excluded from normal page lists when `withHidden` is false.
- Hidden people are ordered after visible people when `withHidden` is true and both groups are shown together.
- Missing `numberOfAssets` or `assetCount` sorts as zero for unnamed client-side rows.
- Space-only global identities without a favorite flag do not outrank favorite personal people.

## Out of Scope

This design does not add user-selectable sort modes, change people tile rendering, or alter how asset counts are computed.
