import type { FilterContext, FilterPanelConfig } from '$lib/components/filter-panel/filter-panel';
import { getAllPeople, getAllTags, getSearchSuggestions, getSpacePeople, SearchSuggestionType } from '@immich/sdk';

export function buildMapFilterConfig(spaceId?: string): FilterPanelConfig {
  const sections = ['timeline', 'people', 'camera', 'tags', 'rating', 'media', 'favorites'] as const;

  if (spaceId) {
    return {
      sections: [...sections],
      providers: {
        people: (context?: FilterContext) =>
          getSpacePeople({
            id: spaceId,
            ...(context?.takenAfter && { takenAfter: context.takenAfter }),
            ...(context?.takenBefore && { takenBefore: context.takenBefore }),
          }).then((people) => people.map((p) => ({ id: p.id, name: p.name, thumbnailPath: p.thumbnailPath }))),
        cameras: (context?: FilterContext) =>
          getSearchSuggestions({
            $type: SearchSuggestionType.CameraMake,
            spaceId,
            ...(context?.takenAfter && { takenAfter: context.takenAfter }),
            ...(context?.takenBefore && { takenBefore: context.takenBefore }),
          }).then((results) => results.map((r) => ({ value: r, type: 'make' as const }))),
        cameraModels: (make: string, context?: FilterContext) =>
          getSearchSuggestions({
            $type: SearchSuggestionType.CameraModel,
            make,
            spaceId,
            ...(context?.takenAfter && { takenAfter: context.takenAfter }),
            ...(context?.takenBefore && { takenBefore: context.takenBefore }),
          }),
        tags: () => getAllTags().then((tags) => tags.map((t) => ({ id: t.id, name: t.value }))),
      },
    };
  }

  return {
    sections: [...sections],
    providers: {
      people: () =>
        getAllPeople({ withHidden: false }).then((response) =>
          response.people
            .filter((p) => p.name)
            .map((p) => ({ id: p.id, name: p.name, thumbnailPath: p.thumbnailPath })),
        ),
      cameras: (context?: FilterContext) =>
        getSearchSuggestions({
          $type: SearchSuggestionType.CameraMake,
          ...(context?.takenAfter && { takenAfter: context.takenAfter }),
          ...(context?.takenBefore && { takenBefore: context.takenBefore }),
        }).then((results) => results.map((r) => ({ value: r, type: 'make' as const }))),
      cameraModels: (make: string, context?: FilterContext) =>
        getSearchSuggestions({
          $type: SearchSuggestionType.CameraModel,
          make,
          ...(context?.takenAfter && { takenAfter: context.takenAfter }),
          ...(context?.takenBefore && { takenBefore: context.takenBefore }),
        }),
      tags: () => getAllTags().then((tags) => tags.map((t) => ({ id: t.id, name: t.value }))),
    },
  };
}
