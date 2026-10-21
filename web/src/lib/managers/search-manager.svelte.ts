import { AssetTypeEnum, AssetVisibility, type SearchFilter as SearchFilterDto } from '@immich/sdk';
import { isEmpty, isUndefined, omitBy } from 'lodash-es';
import type { DateTime } from 'luxon';
import { SvelteSet } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import { MediaType, QueryType, validQueryTypes } from '$lib/constants';
import { Route } from '$lib/route';
import type { SearchFilter, SearchQuery } from '$lib/types';
import { asLocalTimeISO, parseUtcDate } from '$lib/utils/date-time';

const QUERY_TYPE_STORAGE_KEY = 'searchQueryType';

class SearchManager {
  #filter = $state<SearchFilter>(this.#fromQuery({}));

  get filter() {
    return this.#filter;
  }

  reset() {
    this.#filter = this.#fromQuery({});
  }

  setQuery(query: SearchQuery) {
    this.#filter = this.#fromQuery(query);
  }

  setQueryType(queryType: SearchFilter['queryType']) {
    this.#filter.queryType = queryType;
    localStorage.setItem(QUERY_TYPE_STORAGE_KEY, queryType);
  }

  async submit() {
    await goto(Route.search(this.#toQuery()));
  }

  #fromQuery(searchQuery: SearchQuery): SearchFilter {
    const filter = searchQuery.filter ?? {};
    let query = searchQuery.query ?? '';
    let queryType = query ? QueryType.SMART : this.#defaultQueryType();

    if (filter.originalFileName?.like) {
      query = filter.originalFileName.like;
      queryType = QueryType.METADATA;
    }

    if (filter.originalPath?.like) {
      query = filter.originalPath.like;
      queryType = QueryType.FULL_PATH;
    }

    if (filter.description?.like) {
      query = filter.description.like;
      queryType = QueryType.DESCRIPTION;
    }

    if (filter.ocr) {
      query = filter.ocr.matches;
      queryType = QueryType.OCR;
    }

    return {
      query,
      ocr: filter.ocr?.matches,
      queryType,
      queryAssetId: searchQuery.queryAssetId,
      personIds: new SvelteSet(filter.personIds?.all),
      tagIds: filter.hasTags?.eq === false ? null : new SvelteSet(filter.tagIds?.all),
      location: {
        country: this.#fromEqFilter(filter.country),
        state: this.#fromEqFilter(filter.state),
        city: this.#fromEqFilter(filter.city),
      },
      camera: {
        make: this.#fromEqFilter(filter.make),
        model: this.#fromEqFilter(filter.model),
        lensModel: this.#fromEqFilter(filter.lensModel),
      },
      date: {
        takenAfter: filter.takenAt?.gte ? this.#toStartOfDayDate(filter.takenAt.gte) : undefined,
        takenBefore: filter.takenAt?.lte ? this.#toStartOfDayDate(filter.takenAt.lte) : undefined,
      },
      display: {
        isArchive: filter.visibility?.eq === AssetVisibility.Archive,
        isFavorite: filter.isFavorite?.eq ?? false,
        isNotInAlbum: filter.hasAlbums?.eq === false,
      },
      mediaType:
        filter.type?.eq === AssetTypeEnum.Image
          ? MediaType.Image
          : filter.type?.eq === AssetTypeEnum.Video
            ? MediaType.Video
            : MediaType.All,
      rating: filter.rating?.eq,
    };
  }

  #toQuery(): SearchQuery {
    let type: AssetTypeEnum | undefined = undefined;
    if (this.filter.mediaType === MediaType.Image) {
      type = AssetTypeEnum.Image;
    } else if (this.filter.mediaType === MediaType.Video) {
      type = AssetTypeEnum.Video;
    }

    const query = this.filter.query.trim() || undefined;
    const { takenAfter, takenBefore } = this.filter.date;
    const { tagIds } = this.filter;

    const filter: SearchFilterDto = omitBy(
      {
        ocr: this.filter.queryType === 'ocr' && query ? { matches: query } : undefined,
        originalFileName: this.filter.queryType === 'metadata' && query ? { like: query } : undefined,
        description: this.filter.queryType === 'description' && query ? { like: query } : undefined,
        originalPath: this.filter.queryType === 'fullPath' && query ? { like: query } : undefined,
        country: this.#toEqFilter(this.filter.location.country),
        state: this.#toEqFilter(this.filter.location.state),
        city: this.#toEqFilter(this.filter.location.city),
        make: this.#toEqFilter(this.filter.camera.make),
        model: this.#toEqFilter(this.filter.camera.model),
        lensModel: this.#toEqFilter(this.filter.camera.lensModel),
        takenAt:
          takenAfter || takenBefore
            ? {
                gte: takenAfter ? asLocalTimeISO(takenAfter.startOf('day') as DateTime<true>) : undefined,
                lte: takenBefore ? asLocalTimeISO(takenBefore.endOf('day') as DateTime<true>) : undefined,
              }
            : undefined,
        visibility: this.filter.display.isArchive ? { eq: AssetVisibility.Archive } : undefined,
        isFavorite: this.filter.display.isFavorite ? { eq: true } : undefined,
        hasAlbums: this.filter.display.isNotInAlbum ? { eq: false } : undefined,
        personIds: this.filter.personIds.size > 0 ? { all: [...this.filter.personIds] } : undefined,
        tagIds: tagIds && tagIds.size > 0 ? { all: [...tagIds] } : undefined,
        hasTags: tagIds === null ? { eq: false } : undefined,
        type: type ? { eq: type } : undefined,
        rating: this.filter.rating === undefined ? undefined : { eq: this.filter.rating },
      },
      isUndefined,
    );

    return {
      query: this.filter.queryType === 'smart' ? query : undefined,
      queryAssetId: this.filter.queryAssetId || undefined,
      filter: isEmpty(filter) ? undefined : filter,
    };
  }

  #fromEqFilter(filter: { eq?: string | null } | undefined) {
    return filter?.eq === null ? '' : filter?.eq;
  }

  #toEqFilter(value: string | undefined) {
    return value === undefined ? undefined : { eq: value === '' ? null : value };
  }

  #toStartOfDayDate(dateString: string) {
    return parseUtcDate(dateString)?.startOf('day') || undefined;
  }

  #defaultQueryType(): QueryType {
    const storedQueryType = localStorage.getItem(QUERY_TYPE_STORAGE_KEY) as QueryType;
    return validQueryTypes.has(storedQueryType) ? storedQueryType : QueryType.SMART;
  }
}

export const searchManager = new SearchManager();
