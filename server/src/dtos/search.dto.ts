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
import { isoDatetimeToDate, stringToBool } from 'src/validation';
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

// v3 SearchFilter DTOs — new shape introduced alongside the legacy flat DTOs above.

const atLeastOneKey = <T extends z.ZodObject>(schema: T) => {
  const keys = Object.keys(schema.shape);
  return schema.refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: `At least one of the following keys is required: ${keys.join(', ')}`,
  });
};

const IdFilterSchema = atLeastOneKey(
  z.strictObject({
    eq: z.uuidv4().optional(),
    ne: z.uuidv4().optional(),
  }),
).meta({ id: 'IdFilter' });

const IdFilterNullableSchema = atLeastOneKey(
  z.strictObject({
    eq: z.uuidv4().nullable().optional(),
    ne: z.uuidv4().nullable().optional(),
  }),
).meta({ id: 'IdFilterNullable' });

const IdsFilterSchema = atLeastOneKey(
  z.strictObject({
    any: z.array(z.uuidv4()).min(1).optional(),
    all: z.array(z.uuidv4()).min(1).optional(),
    none: z.array(z.uuidv4()).min(1).optional(),
  }),
).meta({ id: 'IdsFilter' });

const StringFilterSchema = atLeastOneKey(
  z.strictObject({
    eq: z.string().optional(),
    ne: z.string().optional(),
    in: z.array(z.string()).min(1).optional(),
    notIn: z.array(z.string()).min(1).optional(),
  }),
).meta({ id: 'StringFilter' });

const StringFilterNullableSchema = atLeastOneKey(
  z.strictObject({
    eq: z.string().nullable().optional(),
    ne: z.string().nullable().optional(),
    in: z.array(z.string()).min(1).optional(),
    notIn: z.array(z.string()).min(1).optional(),
  }),
).meta({ id: 'StringFilterNullable' });

const StringPatternFilterSchema = atLeastOneKey(
  z.strictObject({
    eq: z.string().nullable().optional(),
    ne: z.string().nullable().optional(),
    in: z.array(z.string()).min(1).optional(),
    notIn: z.array(z.string()).min(1).optional(),
    like: z.string().min(1).optional(),
    notLike: z.string().min(1).optional(),
    startsWith: z.string().min(1).optional(),
    endsWith: z.string().min(1).optional(),
  }),
).meta({ id: 'StringPatternFilter' });

const NumberFilterSchema = atLeastOneKey(
  z.strictObject({
    eq: z.number().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    in: z.array(z.number()).min(1).optional(),
    notIn: z.array(z.number()).min(1).optional(),
  }),
).meta({ id: 'NumberFilter' });

const NumberFilterNullableSchema = atLeastOneKey(
  z.strictObject({
    eq: z.number().nullable().optional(),
    ne: z.number().nullable().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    in: z.array(z.number()).min(1).optional(),
    notIn: z.array(z.number()).min(1).optional(),
  }),
).meta({ id: 'NumberFilterNullable' });

const DateFilterSchema = atLeastOneKey(
  z.strictObject({
    eq: isoDatetimeToDate.optional(),
    ne: isoDatetimeToDate.optional(),
    gt: isoDatetimeToDate.optional(),
    gte: isoDatetimeToDate.optional(),
    lt: isoDatetimeToDate.optional(),
    lte: isoDatetimeToDate.optional(),
  }),
).meta({ id: 'DateFilter' });

const DateFilterNullableSchema = atLeastOneKey(
  z.strictObject({
    eq: isoDatetimeToDate.nullable().optional(),
    ne: isoDatetimeToDate.nullable().optional(),
    gt: isoDatetimeToDate.optional(),
    gte: isoDatetimeToDate.optional(),
    lt: isoDatetimeToDate.optional(),
    lte: isoDatetimeToDate.optional(),
  }),
).meta({ id: 'DateFilterNullable' });

const BoolFilterSchema = z.strictObject({ eq: z.boolean() }).meta({ id: 'BoolFilter' });

const enumFilterSchema = <T extends z.core.util.EnumLike>(values: z.ZodEnum<T>, id: string) =>
  atLeastOneKey(
    z.strictObject({
      eq: values.optional(),
      ne: values.optional(),
      in: z.array(values).min(1).optional(),
      notIn: z.array(values).min(1).optional(),
    }),
  ).meta({ id });

const EnumFilterAssetTypeSchema = enumFilterSchema(AssetTypeSchema, 'EnumFilterAssetType');
const EnumFilterAssetVisibilitySchema = enumFilterSchema(AssetVisibilitySchema, 'EnumFilterAssetVisibility');

const StringSimilarityFilterSchema = z
  .strictObject({
    matches: z.string().min(1),
  })
  .meta({ id: 'StringSimilarityFilter' });

const SearchOrderSchema = z
  .strictObject({
    field: SearchOrderFieldSchema.default(SearchOrderField.FileCreatedAt),
    direction: AssetOrderSchema.default(AssetOrder.Desc),
  })
  .meta({ id: 'SearchOrder' });

const SearchFilterBranchSchema = z
  .strictObject({
    id: IdFilterSchema.optional(),
    libraryId: IdFilterNullableSchema.optional(),
    type: EnumFilterAssetTypeSchema.optional(),
    visibility: EnumFilterAssetVisibilitySchema.optional(),
    isFavorite: BoolFilterSchema.optional(),
    isMotion: BoolFilterSchema.optional(),
    isOffline: BoolFilterSchema.optional(),
    isEncoded: BoolFilterSchema.optional(),
    hasAlbums: BoolFilterSchema.optional(),
    hasPeople: BoolFilterSchema.optional(),
    hasTags: BoolFilterSchema.optional(),
    city: StringFilterNullableSchema.optional(),
    state: StringFilterNullableSchema.optional(),
    country: StringFilterNullableSchema.optional(),
    make: StringFilterNullableSchema.optional(),
    model: StringFilterNullableSchema.optional(),
    lensModel: StringFilterNullableSchema.optional(),
    description: StringPatternFilterSchema.optional(),
    originalFileName: StringPatternFilterSchema.optional(),
    originalPath: StringPatternFilterSchema.optional(),
    ocr: StringSimilarityFilterSchema.optional(),
    rating: NumberFilterNullableSchema.optional(),
    fileSizeInBytes: NumberFilterSchema.optional(),
    takenAt: DateFilterSchema.optional(),
    createdAt: DateFilterSchema.optional(),
    updatedAt: DateFilterSchema.optional(),
    trashedAt: DateFilterNullableSchema.optional(),
    personIds: IdsFilterSchema.optional(),
    tagIds: IdsFilterSchema.optional(),
    albumIds: IdsFilterSchema.optional(),
    checksum: StringFilterSchema.optional(),
    encodedVideoPath: StringFilterSchema.optional(),
  })
  .meta({ id: 'SearchFilterBranch' });

const SearchFilterSchema = SearchFilterBranchSchema.extend({
  or: z.array(SearchFilterBranchSchema).min(1).optional(),
}).meta({ id: 'SearchFilter' });

export {
  BoolFilterSchema,
  DateFilterNullableSchema,
  DateFilterSchema,
  EnumFilterAssetTypeSchema,
  EnumFilterAssetVisibilitySchema,
  IdFilterNullableSchema,
  IdFilterSchema,
  IdsFilterSchema,
  NumberFilterNullableSchema,
  NumberFilterSchema,
  SearchFilterBranchSchema,
  SearchFilterSchema,
  SearchOrderSchema,
  StringFilterNullableSchema,
  StringFilterSchema,
  StringPatternFilterSchema,
  StringSimilarityFilterSchema,
};

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
export type BoolFilter = z.infer<typeof BoolFilterSchema>;
export type StringSimilarityFilter = z.infer<typeof StringSimilarityFilterSchema>;
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
