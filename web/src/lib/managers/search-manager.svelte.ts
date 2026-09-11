import { AssetTypeEnum, AssetVisibility, type MetadataSearchDto, type SmartSearchDto } from '@immich/sdk';
import type { DateTime } from 'luxon';
import { SvelteSet } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import { MediaType, QueryType, validQueryTypes } from '$lib/constants';
import { Route } from '$lib/route';
import type { SearchFilter } from '$lib/types';
import { asLocalTimeISO, parseUtcDate } from '$lib/utils/date-time';

class SearchManager {
  #filter = $state<SearchFilter>(this.#fromQuery({}));

  get filter() {
    return this.#filter;
  }

  reset() {
    this.#filter = this.#fromQuery({});
  }

  setQuery(query: MetadataSearchDto | SmartSearchDto) {
    this.#filter = this.#fromQuery(query);
  }

  async submit() {
    await goto(Route.search(this.#toQuery()));
  }

  #fromQuery(searchQuery: MetadataSearchDto | SmartSearchDto): SearchFilter {
    let query = 'query' in searchQuery && searchQuery.query ? searchQuery.query : '';

    if ('originalFileName' in searchQuery && searchQuery.originalFileName) {
      query = searchQuery.originalFileName;
    }

    if ('originalPath' in searchQuery && searchQuery.originalPath) {
      query = searchQuery.originalPath;
    }

    return {
      query,
      ocr: searchQuery.ocr,
      queryType: this.#defaultQueryType(),
      queryAssetId: 'queryAssetId' in searchQuery ? searchQuery.queryAssetId : undefined,
      personIds: new SvelteSet('personIds' in searchQuery ? searchQuery.personIds : []),
      tagIds:
        'tagIds' in searchQuery
          ? searchQuery.tagIds === null
            ? null
            : new SvelteSet(searchQuery.tagIds)
          : new SvelteSet(),
      location: {
        country: this.#withNullAsEmptyString(searchQuery.country),
        state: this.#withNullAsEmptyString(searchQuery.state),
        city: this.#withNullAsEmptyString(searchQuery.city),
      },
      camera: {
        make: this.#withNullAsEmptyString(searchQuery.make),
        model: this.#withNullAsEmptyString(searchQuery.model),
        lensModel: this.#withNullAsEmptyString(searchQuery.lensModel),
      },
      date: {
        takenAfter: searchQuery.takenAfter ? this.#toStartOfDayDate(searchQuery.takenAfter) : undefined,
        takenBefore: searchQuery.takenBefore ? this.#toStartOfDayDate(searchQuery.takenBefore) : undefined,
      },
      display: {
        isArchive: searchQuery.visibility === AssetVisibility.Archive,
        isFavorite: searchQuery.isFavorite ?? false,
        isNotInAlbum: 'isNotInAlbum' in searchQuery ? (searchQuery.isNotInAlbum ?? false) : false,
      },
      mediaType:
        searchQuery.type === AssetTypeEnum.Image
          ? MediaType.Image
          : searchQuery.type === AssetTypeEnum.Video
            ? MediaType.Video
            : MediaType.All,
      rating: searchQuery.rating,
    };
  }

  #toQuery(): MetadataSearchDto | SmartSearchDto {
    let type: AssetTypeEnum | undefined = undefined;
    if (this.filter.mediaType === MediaType.Image) {
      type = AssetTypeEnum.Image;
    } else if (this.filter.mediaType === MediaType.Video) {
      type = AssetTypeEnum.Video;
    }

    const query = this.filter.query || undefined;

    return {
      query: this.filter.queryType === 'smart' ? query : undefined,
      queryAssetId: this.filter.queryAssetId || undefined,
      ocr: this.filter.queryType === 'ocr' ? query : undefined,
      originalFileName: this.filter.queryType === 'metadata' ? query : undefined,
      description: this.filter.queryType === 'description' ? query : undefined,
      originalPath: this.filter.queryType === 'fullPath' ? this.filter.query.trim() || undefined : undefined,
      country: this.#emptyStringToNull(this.filter.location.country),
      state: this.#emptyStringToNull(this.filter.location.state),
      city: this.#emptyStringToNull(this.filter.location.city),
      make: this.#emptyStringToNull(this.filter.camera.make),
      model: this.#emptyStringToNull(this.filter.camera.model),
      lensModel: this.#emptyStringToNull(this.filter.camera.lensModel),
      takenAfter: this.filter.date.takenAfter
        ? asLocalTimeISO(this.filter.date.takenAfter.startOf('day') as DateTime<true>)
        : undefined,
      takenBefore: this.filter.date.takenBefore
        ? asLocalTimeISO(this.filter.date.takenBefore.endOf('day') as DateTime<true>)
        : undefined,
      visibility: this.filter.display.isArchive ? AssetVisibility.Archive : undefined,
      isFavorite: this.filter.display.isFavorite || undefined,
      isNotInAlbum: this.filter.display.isNotInAlbum || undefined,
      personIds: this.filter.personIds.size > 0 ? [...this.filter.personIds] : undefined,
      tagIds: this.filter.tagIds === null ? null : this.filter.tagIds.size > 0 ? [...this.filter.tagIds] : undefined,
      type,
      rating: this.filter.rating,
    };
  }

  #withNullAsEmptyString<T>(value: T | null) {
    return value === null ? '' : value;
  }

  #emptyStringToNull(value: string | undefined) {
    return value === '' ? null : value;
  }

  #toStartOfDayDate(dateString: string) {
    return parseUtcDate(dateString)?.startOf('day') || undefined;
  }

  #defaultQueryType(): QueryType {
    const storedQueryType = localStorage.getItem('searchQueryType') as QueryType;
    return validQueryTypes.has(storedQueryType) ? storedQueryType : QueryType.SMART;
  }
}

export const searchManager = new SearchManager();
