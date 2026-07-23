import { createZodDto } from 'nestjs-zod';
import { Place } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AlbumResponseSchema } from 'src/dtos/album.dto';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto';
import {
  AssetOrder,
  AssetOrderSchema,
  AssetTypeSchema,
  AssetVisibilitySchema,
  SearchOrderField,
  SearchOrderFieldSchema,
} from 'src/enum';
import { isoDatetimeToDate, nonEmptyPartial, stringToBool } from 'src/validation';
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
  city: z.string().nullable().optional().describe('Filter by city name'),
  state: z.string().nullable().optional().describe('Filter by state/province name'),
  country: z.string().nullable().optional().describe('Filter by country name'),
  make: z.string().nullable().optional().describe('Filter by camera make'),
  model: z.string().nullable().optional().describe('Filter by camera model'),
  lensModel: z.string().nullable().optional().describe('Filter by lens model'),
  isNotInAlbum: z.boolean().optional().describe('Filter assets not in any album'),
  personIds: z.array(z.uuidv4()).optional().describe('Filter by person IDs'),
  tagIds: z.array(z.uuidv4()).nullish().describe('Filter by tag IDs'),
  albumIds: z.array(z.uuidv4()).optional().describe('Filter by album IDs'),
  rating: z
    .int()
    .min(1)
    .max(5)
    .nullish()
    .describe('Filter by rating [1-5], or null for unrated')
    .meta({
      ...new HistoryBuilder()
        .added('v1')
        .stable('v2')
        .updated('v2.6.0', 'Using -1 as a rating is deprecated and will be removed in the next major version.')
        .updated('v3', 'Using -1 as a rating is no longer valid.')
        .getExtensions(),
    }),
  ocr: z.string().optional().describe('Filter by OCR text content'),
});

const BaseSearchWithResultsSchema = BaseSearchSchema.extend({
  withDeleted: z.boolean().optional().describe('Include deleted assets'),
  withExif: z.boolean().optional().describe('Include EXIF data in response'),
  size: z.int().min(1).max(1000).optional().describe('Number of results to return'),
});

const RandomSearchSchema = BaseSearchWithResultsSchema.extend({
  withStacked: z.boolean().optional().describe('Include stacked assets'),
  withPeople: z.boolean().optional().describe('Include people data in response'),
}).meta({ id: 'RandomSearchDto' });

const LargeAssetSearchSchema = BaseSearchWithResultsSchema.extend({
  minFileSize: z.coerce.number().int().min(0).optional().describe('Minimum file size in bytes'),
  size: z.coerce.number().int().min(1).max(1000).optional().describe('Number of results to return'),
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
  page: z.int().min(1).optional().describe('Page number'),
}).meta({ id: 'MetadataSearchDto' });

const StatisticsSearchSchema = BaseSearchSchema.extend({
  description: z.string().trim().optional().describe('Filter by description text'),
}).meta({ id: 'StatisticsSearchDto' });

const SmartSearchSchema = BaseSearchWithResultsSchema.extend({
  query: z.string().trim().optional().describe('Natural language search query'),
  queryAssetId: z.uuidv4().optional().describe('Asset ID to use as search reference'),
  language: z.string().optional().describe('Search language code'),
  page: z.int().min(1).optional().describe('Page number'),
}).meta({ id: 'SmartSearchDto' });

const SearchPlacesSchema = z
  .object({
    name: z.string().describe('Place name to search for'),
  })
  .meta({ id: 'SearchPlacesDto' });

const SearchPeopleSchema = z
  .object({
    name: z.string().describe('Person name to search for'),
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

const SearchSuggestionRequestSchema = z
  .object({
    type: SearchSuggestionTypeSchema,
    country: z.string().optional().describe('Filter by country'),
    state: z.string().optional().describe('Filter by state/province'),
    make: z.string().optional().describe('Filter by camera make'),
    model: z.string().optional().describe('Filter by camera model'),
    lensModel: z.string().optional().describe('Filter by lens model'),
    includeNull: stringToBool
      .optional()
      .describe('Include null values in suggestions')
      .meta(new HistoryBuilder().added('v1.111.0').stable('v2').getExtensions()),
  })
  .meta({ id: 'SearchSuggestionRequestDto' });

const IdFilterSchema = nonEmptyPartial({
  eq: z.uuidv4(),
  ne: z.uuidv4(),
}).meta({ id: 'IdFilter' });

const IdFilterNullableSchema = nonEmptyPartial({
  eq: z.uuidv4().nullable(),
  ne: z.uuidv4().nullable(),
}).meta({ id: 'IdFilterNullable' });

const IdsFilterSchema = nonEmptyPartial({
  any: z.array(z.uuidv4()).min(1),
  all: z.array(z.uuidv4()).min(1),
  none: z.array(z.uuidv4()).min(1),
}).meta({ id: 'IdsFilter' });

const stringListShape = {
  in: z.array(z.string()).min(1),
  notIn: z.array(z.string()).min(1),
};

const StringFilterSchema = nonEmptyPartial({
  eq: z.string(),
  ne: z.string(),
  ...stringListShape,
}).meta({ id: 'StringFilter' });

const stringNullableShape = {
  eq: z.string().nullable(),
  ne: z.string().nullable(),
  ...stringListShape,
};

const StringFilterNullableSchema = nonEmptyPartial(stringNullableShape).meta({ id: 'StringFilterNullable' });

const StringPatternFilterSchema = nonEmptyPartial({
  ...stringNullableShape,
  like: z.string().min(1),
  notLike: z.string().min(1),
  startsWith: z.string().min(1),
  endsWith: z.string().min(1),
}).meta({ id: 'StringPatternFilter' });

const numberRangeShape = {
  lt: z.number(),
  lte: z.number(),
  gt: z.number(),
  gte: z.number(),
  in: z.array(z.number()).min(1),
  notIn: z.array(z.number()).min(1),
};

const NumberFilterSchema = nonEmptyPartial({
  eq: z.number(),
  ne: z.number(),
  ...numberRangeShape,
}).meta({ id: 'NumberFilter' });

const NumberFilterNullableSchema = nonEmptyPartial({
  eq: z.number().nullable(),
  ne: z.number().nullable(),
  ...numberRangeShape,
}).meta({ id: 'NumberFilterNullable' });

const dateRangeShape = {
  gt: isoDatetimeToDate,
  gte: isoDatetimeToDate,
  lt: isoDatetimeToDate,
  lte: isoDatetimeToDate,
};

const DateFilterSchema = nonEmptyPartial({
  eq: isoDatetimeToDate,
  ne: isoDatetimeToDate,
  ...dateRangeShape,
}).meta({ id: 'DateFilter' });

const DateFilterNullableSchema = nonEmptyPartial({
  eq: isoDatetimeToDate.nullable(),
  ne: isoDatetimeToDate.nullable(),
  ...dateRangeShape,
}).meta({ id: 'DateFilterNullable' });

const BoolFilterSchema = z.object({ eq: z.boolean() }).meta({ id: 'BoolFilter' });

const enumFilterSchema = <T extends z.core.util.EnumLike>(values: z.ZodEnum<T>, id: string) =>
  nonEmptyPartial({
    eq: values,
    ne: values,
    in: z.array(values).min(1),
    notIn: z.array(values).min(1),
  }).meta({ id });

const EnumFilterAssetTypeSchema = enumFilterSchema(AssetTypeSchema, 'EnumFilterAssetType');
const EnumFilterAssetVisibilitySchema = enumFilterSchema(AssetVisibilitySchema, 'EnumFilterAssetVisibility');

const StringSimilarityFilterSchema = z
  .object({
    matches: z.string().min(1),
  })
  .meta({ id: 'StringSimilarityFilter' });

export const DEFAULT_SEARCH_ORDER = {
  field: SearchOrderField.FileCreatedAt,
  direction: AssetOrder.Desc,
};

export const SearchOrderSchema = z
  .object({
    field: SearchOrderFieldSchema.default(DEFAULT_SEARCH_ORDER.field),
    direction: AssetOrderSchema.default(DEFAULT_SEARCH_ORDER.direction),
  })
  .meta({ id: 'SearchOrder' });

const SearchFilterBranchSchema = z
  .object({
    id: IdFilterSchema,
    libraryId: IdFilterNullableSchema,
    type: EnumFilterAssetTypeSchema,
    visibility: EnumFilterAssetVisibilitySchema,
    isFavorite: BoolFilterSchema,
    isMotion: BoolFilterSchema,
    isOffline: BoolFilterSchema,
    isEncoded: BoolFilterSchema,
    hasAlbums: BoolFilterSchema,
    hasPeople: BoolFilterSchema,
    hasTags: BoolFilterSchema,
    city: StringFilterNullableSchema,
    state: StringFilterNullableSchema,
    country: StringFilterNullableSchema,
    make: StringFilterNullableSchema,
    model: StringFilterNullableSchema,
    lensModel: StringFilterNullableSchema,
    description: StringPatternFilterSchema,
    originalFileName: StringPatternFilterSchema,
    originalPath: StringPatternFilterSchema,
    ocr: StringSimilarityFilterSchema,
    rating: NumberFilterNullableSchema,
    fileSizeInBytes: NumberFilterSchema,
    takenAt: DateFilterSchema,
    createdAt: DateFilterSchema,
    updatedAt: DateFilterSchema,
    trashedAt: DateFilterNullableSchema,
    personIds: IdsFilterSchema,
    tagIds: IdsFilterSchema,
    albumIds: IdsFilterSchema,
    checksum: StringFilterSchema,
    encodedVideoPath: StringFilterSchema,
  })
  .partial()
  .meta({ id: 'SearchFilterBranch' });

export const SearchFilterSchema = SearchFilterBranchSchema.extend({
  or: z.array(SearchFilterBranchSchema).min(1).optional(),
}).meta({ id: 'SearchFilter' });

export type IdFilter = z.infer<typeof IdFilterSchema>;
export type IdFilterNullable = z.infer<typeof IdFilterNullableSchema>;
export type IdsFilter = z.infer<typeof IdsFilterSchema>;
export type StringFilter = z.infer<typeof StringFilterSchema>;
export type StringFilterNullable = z.infer<typeof StringFilterNullableSchema>;
export type StringPatternFilter = z.infer<typeof StringPatternFilterSchema>;
export type NumberFilter = z.infer<typeof NumberFilterSchema>;
export type NumberFilterNullable = z.infer<typeof NumberFilterNullableSchema>;
export type DateFilter = z.infer<typeof DateFilterSchema>;
export type DateFilterNullable = z.infer<typeof DateFilterNullableSchema>;
export type SearchOrder = z.infer<typeof SearchOrderSchema>;
export type SearchFilter = z.infer<typeof SearchFilterSchema>;
export type SearchFilterBranch = z.infer<typeof SearchFilterBranchSchema>;

export class RandomSearchDto extends createZodDto(RandomSearchSchema) {}
export class LargeAssetSearchDto extends createZodDto(LargeAssetSearchSchema) {}
export class MetadataSearchDto extends createZodDto(MetadataSearchSchema) {}
export class StatisticsSearchDto extends createZodDto(StatisticsSearchSchema) {}
export class SmartSearchDto extends createZodDto(SmartSearchSchema) {}
export class SearchPlacesDto extends createZodDto(SearchPlacesSchema) {}
export class SearchPeopleDto extends createZodDto(SearchPeopleSchema) {}
export class PlacesResponseDto extends createZodDto(PlacesResponseSchema) {}
export class SearchSuggestionRequestDto extends createZodDto(SearchSuggestionRequestSchema) {}

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
    total: z
      .int()
      .min(0)
      .describe('Total number of matching assets')
      .meta(new HistoryBuilder().deprecated('v3.0.0').getExtensions()),
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
