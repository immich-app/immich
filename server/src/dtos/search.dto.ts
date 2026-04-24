import { createZodDto } from 'nestjs-zod';
import { Place } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AlbumResponseSchema } from 'src/dtos/album.dto';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto';
import { AssetOrder, AssetOrderSchema, AssetTypeSchema, AssetVisibilitySchema } from 'src/enum';
import { emptyStringToNull, IsNotSiblingOf, isoDatetimeToDate, stringToBool } from 'src/validation';
import z from 'zod';

const BaseSearchSchema = z.object({
  libraryId: z.uuidv4().nullish().describe('Library ID to filter by'),
  type: AssetTypeSchema.optional(),
  isEncoded: z.boolean().optional().describe('Filter by encoded status'),
  isFavorite: z.boolean().optional().describe('Filter by favorite status'),
  isMotion: z.boolean().optional().describe('Filter by motion photo status'),
  isOffline: z.boolean().optional().describe('Filter by offline status'),
  visibility: AssetVisibilitySchema.optional(),
  createdBefore: isoDatetimeToDate.optional().describe('Filter by creation date (before)'),
  createdAfter: isoDatetimeToDate.optional().describe('Filter by creation date (after)'),
  updatedBefore: isoDatetimeToDate.optional().describe('Filter by update date (before)'),
  updatedAfter: isoDatetimeToDate.optional().describe('Filter by update date (after)'),
  trashedBefore: isoDatetimeToDate.optional().describe('Filter by trash date (before)'),
  trashedAfter: isoDatetimeToDate.optional().describe('Filter by trash date (after)'),
  takenBefore: isoDatetimeToDate.optional().describe('Filter by taken date (before)'),
  takenAfter: isoDatetimeToDate.optional().describe('Filter by taken date (after)'),
  city: emptyStringToNull(z.string().nullable()).optional().describe('Filter by city name'),
  state: emptyStringToNull(z.string().nullable()).optional().describe('Filter by state/province name'),
  country: emptyStringToNull(z.string().nullable()).optional().describe('Filter by country name'),
  make: emptyStringToNull(z.string().nullable()).optional().describe('Filter by camera make'),
  model: emptyStringToNull(z.string().nullable()).optional().describe('Filter by camera model'),
  lensModel: emptyStringToNull(z.string().nullable()).optional().describe('Filter by lens model'),
  isNotInAlbum: z.boolean().optional().describe('Filter assets not in any album'),
  personIds: z.array(z.uuidv4()).optional().describe('Filter by person IDs'),
  tagIds: z.array(z.uuidv4()).nullish().describe('Filter by tag IDs'),
  albumIds: z.array(z.uuidv4()).optional().describe('Filter by album IDs'),
  rating: z
    .number()
    .min(-1)
    .max(5)
    .nullish()
    .describe('Filter by rating [1-5], or null for unrated')
    .meta({
      ...new HistoryBuilder()
        .added('v1')
        .stable('v2')
        .updated('v2.6.0', 'Using -1 as a rating is deprecated and will be removed in the next major version.')
        .getExtensions(),
    }),
  ocr: z.string().optional().describe('Filter by OCR text content'),
  spaceId: z.uuidv4().optional().describe('Shared space ID to filter by'),
  spacePersonIds: z.array(z.uuidv4()).optional().describe('Shared space person IDs to filter by'),
});

const BaseSearchWithResultsSchema = BaseSearchSchema.extend({
  withDeleted: z.boolean().optional().describe('Include deleted assets'),
  withExif: z.boolean().optional().describe('Include EXIF data in response'),
  size: z.number().min(1).max(1000).optional().describe('Number of results to return'),
});

const RandomSearchSchema = BaseSearchWithResultsSchema.extend({
  withStacked: z.boolean().optional().describe('Include stacked assets'),
  withPeople: z.boolean().optional().describe('Include people data in response'),
}).meta({ id: 'RandomSearchDto' });

const LargeAssetSearchSchema = BaseSearchWithResultsSchema.extend({
  minFileSize: z.coerce.number().int().min(0).optional().describe('Minimum file size in bytes'),
  size: z.coerce.number().min(1).max(1000).optional().describe('Number of results to return'),
}).meta({ id: 'LargeAssetSearchDto' });

const MetadataSearchSchema = RandomSearchSchema.extend({
  id: z.uuidv4().optional().describe('Filter by asset ID'),
  description: z.string().trim().optional().describe('Filter by description text'),
  checksum: z.string().optional().describe('Filter by file checksum'),
  originalFileName: z.string().trim().optional().describe('Filter by original file name'),
  originalPath: z.string().optional().describe('Filter by original file path'),
  previewPath: z.string().optional().describe('Filter by preview file path'),
  thumbnailPath: z.string().optional().describe('Filter by thumbnail file path'),
  encodedVideoPath: z.string().optional().describe('Filter by encoded video file path'),
  order: AssetOrderSchema.default(AssetOrder.Desc).optional().describe('Sort order'),
  page: z.number().min(1).optional().describe('Page number'),
}).meta({ id: 'MetadataSearchDto' });

const StatisticsSearchSchema = BaseSearchSchema.extend({
  description: z.string().trim().optional().describe('Filter by description text'),
}).meta({ id: 'StatisticsSearchDto' });

const SmartSearchSchema = BaseSearchWithResultsSchema.extend({
  query: z.string().trim().optional().describe('Natural language search query'),
  queryAssetId: z.uuidv4().optional().describe('Asset ID to use as search reference'),
  language: z.string().optional().describe('Search language code'),
  order: AssetOrderSchema.optional().describe('Sort order (omit for relevance)'),
  page: z.number().min(1).optional().describe('Page number'),
  withSharedSpaces: z.boolean().optional().describe('Include shared spaces the user is a member of'),
}).meta({ id: 'SmartSearchDto' });

const SearchPlacesSchema = z
  .object({
    name: z.string().describe('Place name to search for'),
  })
  .meta({ id: 'SearchPlacesDto' });

const SearchPeopleSchema = z
  .object({
    name: z.string().min(1).describe('Person name to search for'),
    withHidden: stringToBool.optional().describe('Include hidden people'),
  })
  .meta({ id: 'SearchPeopleDto' });

const PlacesResponseSchema = z
  .object({
    name: z.string().describe('Place name'),
    latitude: z.number().describe('Latitude coordinate'),
    longitude: z.number().describe('Longitude coordinate'),
    admin1name: z.string().optional().describe('Administrative level 1 name (state/province)'),
    admin2name: z.string().optional().describe('Administrative level 2 name (county/district)'),
  })
  .meta({ id: 'PlacesResponseDto' });

export enum SearchSuggestionType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  CAMERA_MAKE = 'camera-make',
  CAMERA_MODEL = 'camera-model',
  CAMERA_LENS_MODEL = 'camera-lens-model',
}

const SearchSuggestionTypeSchema = z
  .enum(SearchSuggestionType)
  .describe('Suggestion type')
  .meta({ id: 'SearchSuggestionType' });

const SearchSuggestionRequestBaseSchema = z.object({
  type: SearchSuggestionTypeSchema,
  albumId: z.uuidv4().optional().describe('Scope suggestions to a specific album'),
  country: z.string().optional().describe('Filter by country'),
  state: z.string().optional().describe('Filter by state/province'),
  make: z.string().optional().describe('Filter by camera make'),
  model: z.string().optional().describe('Filter by camera model'),
  lensModel: z.string().optional().describe('Filter by lens model'),
  takenAfter: isoDatetimeToDate.optional().describe('Filter suggestions by taken date (after)'),
  takenBefore: isoDatetimeToDate.optional().describe('Filter suggestions by taken date (before)'),
  spaceId: z.uuidv4().optional().describe('Scope suggestions to a specific shared space'),
  withSharedSpaces: stringToBool.optional().describe('Include suggestions from shared spaces the user is a member of'),
  includeNull: stringToBool
    .optional()
    .describe('Include null values in suggestions')
    .meta(new HistoryBuilder().added('v1.111.0').stable('v2').getExtensions()),
});

const SearchSuggestionRequestSchema = SearchSuggestionRequestBaseSchema.pipe(
  IsNotSiblingOf(SearchSuggestionRequestBaseSchema, 'albumId', ['spaceId']),
)
  .pipe(IsNotSiblingOf(SearchSuggestionRequestBaseSchema, 'albumId', ['withSharedSpaces']))
  .meta({ id: 'SearchSuggestionRequestDto' });

const TagSuggestionRequestSchema = z
  .object({
    spaceId: z.uuidv4().optional().describe('Scope suggestions to a specific shared space'),
    withSharedSpaces: stringToBool
      .optional()
      .describe('Include suggestions from shared spaces the user is a member of'),
    takenAfter: isoDatetimeToDate.optional().describe('Filter suggestions by taken date (after)'),
    takenBefore: isoDatetimeToDate.optional().describe('Filter suggestions by taken date (before)'),
  })
  .meta({ id: 'TagSuggestionRequestDto' });

const TagSuggestionResponseSchema = z
  .object({
    id: z.string().describe('Tag ID'),
    value: z.string().describe('Tag value/name'),
  })
  .meta({ id: 'TagSuggestionResponseDto' });

const FilterSuggestionsPersonSchema = z
  .object({
    id: z.string().describe('Person ID'),
    name: z.string().describe('Person name'),
  })
  .meta({ id: 'FilterSuggestionsPersonDto' });

const FilterSuggestionsTagSchema = z
  .object({
    id: z.string().describe('Tag ID'),
    value: z.string().describe('Tag value/name'),
  })
  .meta({ id: 'FilterSuggestionsTagDto' });

const FilterSuggestionsResponseSchema = z
  .object({
    countries: z.array(z.string()).describe('Available countries'),
    cameraMakes: z.array(z.string()).describe('Available camera makes'),
    tags: z.array(FilterSuggestionsTagSchema).describe('Available tags'),
    people: z.array(FilterSuggestionsPersonSchema).describe('Available people (named, non-hidden, with thumbnails)'),
    ratings: z.array(z.number()).describe('Available ratings'),
    mediaTypes: z.array(z.string()).describe('Available media types'),
    hasUnnamedPeople: z.boolean().describe('Whether unnamed people exist in the filtered set'),
  })
  .meta({ id: 'FilterSuggestionsResponseDto' });

const FilterSuggestionsRequestBaseSchema = z.object({
  personIds: z
    .preprocess((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]), z.array(z.uuidv4()))
    .optional()
    .describe('Filter by person IDs'),
  country: z.string().optional().describe('Filter by country'),
  city: z.string().optional().describe('Filter by city'),
  make: z.string().optional().describe('Filter by camera make'),
  model: z.string().optional().describe('Filter by camera model'),
  tagIds: z
    .preprocess((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]), z.array(z.uuidv4()))
    .optional()
    .describe('Filter by tag IDs'),
  rating: z.coerce.number().int().min(1).max(5).optional().describe('Filter by rating (1-5)'),
  mediaType: AssetTypeSchema.optional().describe('Filter by asset type'),
  isFavorite: stringToBool.optional().describe('Filter by favorites'),
  takenAfter: isoDatetimeToDate.optional().describe('Filter by taken date (after)'),
  takenBefore: isoDatetimeToDate.optional().describe('Filter by taken date (before)'),
  albumId: z.uuidv4().optional().describe('Scope to a specific album'),
  spaceId: z.uuidv4().optional().describe('Scope to a specific shared space'),
  withSharedSpaces: stringToBool.optional().describe('Include shared spaces the user is a member of'),
});

const FilterSuggestionsRequestSchema = FilterSuggestionsRequestBaseSchema.pipe(
  IsNotSiblingOf(FilterSuggestionsRequestBaseSchema, 'albumId', ['spaceId']),
)
  .pipe(IsNotSiblingOf(FilterSuggestionsRequestBaseSchema, 'albumId', ['withSharedSpaces']))
  .meta({ id: 'FilterSuggestionsRequestDto' });

export class RandomSearchDto extends createZodDto(RandomSearchSchema) {}
export class LargeAssetSearchDto extends createZodDto(LargeAssetSearchSchema) {}
export class MetadataSearchDto extends createZodDto(MetadataSearchSchema) {}
export class StatisticsSearchDto extends createZodDto(StatisticsSearchSchema) {}
export class SmartSearchDto extends createZodDto(SmartSearchSchema) {}
export class SearchPlacesDto extends createZodDto(SearchPlacesSchema) {}
export class SearchPeopleDto extends createZodDto(SearchPeopleSchema) {}
export class PlacesResponseDto extends createZodDto(PlacesResponseSchema) {}
export class SearchSuggestionRequestDto extends createZodDto(SearchSuggestionRequestSchema) {}
export class TagSuggestionRequestDto extends createZodDto(TagSuggestionRequestSchema) {}
export class TagSuggestionResponseDto extends createZodDto(TagSuggestionResponseSchema) {}
export class FilterSuggestionsPersonDto extends createZodDto(FilterSuggestionsPersonSchema) {}
export class FilterSuggestionsTagDto extends createZodDto(FilterSuggestionsTagSchema) {}
export class FilterSuggestionsResponseDto extends createZodDto(FilterSuggestionsResponseSchema) {}
export class FilterSuggestionsRequestDto extends createZodDto(FilterSuggestionsRequestSchema) {}

export function mapPlaces(place: Place): PlacesResponseDto {
  return {
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    admin1name: place.admin1Name ?? undefined,
    admin2name: place.admin2Name ?? undefined,
  };
}

const SearchFacetCountResponseSchema = z
  .object({
    count: z.int().min(0).describe('Number of assets with this facet value'),
    value: z.string().describe('Facet value'),
  })
  .meta({ id: 'SearchFacetCountResponseDto' });

const SearchFacetResponseSchema = z
  .object({
    fieldName: z.string().describe('Facet field name'),
    counts: z.array(SearchFacetCountResponseSchema),
  })
  .meta({ id: 'SearchFacetResponseDto' });

const SearchAlbumResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of matching albums'),
    count: z.int().min(0).describe('Number of albums in this page'),
    items: z.array(AlbumResponseSchema),
    facets: z.array(SearchFacetResponseSchema),
  })
  .meta({ id: 'SearchAlbumResponseDto' });

const SearchAssetResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of matching assets'),
    count: z.int().min(0).describe('Number of assets in this page'),
    items: z.array(AssetResponseSchema),
    facets: z.array(SearchFacetResponseSchema),
    nextPage: z.string().nullable().describe('Next page token'),
  })
  .meta({ id: 'SearchAssetResponseDto' });

const SearchResponseSchema = z
  .object({
    albums: SearchAlbumResponseSchema,
    assets: SearchAssetResponseSchema,
  })
  .meta({ id: 'SearchResponseDto' });

export class SearchResponseDto extends createZodDto(SearchResponseSchema) {}

const SearchStatisticsResponseSchema = z
  .object({
    total: z.int().describe('Total number of matching assets'),
  })
  .meta({ id: 'SearchStatisticsResponseDto' });

export class SearchStatisticsResponseDto extends createZodDto(SearchStatisticsResponseSchema) {}

const SearchExploreItemSchema = z
  .object({
    value: z.string().describe('Explore value'),
    data: AssetResponseSchema,
  })
  .meta({ id: 'SearchExploreItem' });

const SearchExploreResponseSchema = z
  .object({
    fieldName: z.string().describe('Explore field name'),
    items: z.array(SearchExploreItemSchema),
  })
  .meta({ id: 'SearchExploreResponseDto' });

export class SearchExploreResponseDto extends createZodDto(SearchExploreResponseSchema) {}
