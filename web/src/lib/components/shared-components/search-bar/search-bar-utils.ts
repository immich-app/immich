import { getAllPeople, type PersonResponseDto, type TagResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import type { SvelteSet } from 'svelte/reactivity';
import { get } from 'svelte/store';
import { MediaType } from '$lib/constants';
import { handleError } from '$lib/utils/handle-error';

export enum SearchDatePreset {
  ThisYear,
  LastYear,
  Last30Days,
  Custom,
}

export const getSearchDatePreset = (after: DateTime | undefined, before: DateTime | undefined) => {
  if (!after && !before) {
    return undefined;
  }

  const start = after?.toMillis();
  const end = before?.endOf('day').toMillis();

  if (start === +DateTime.utc().startOf('year') && end === +DateTime.utc().endOf('year')) {
    return SearchDatePreset.ThisYear;
  }

  if (
    start === +DateTime.utc().minus({ years: 1 }).startOf('year') &&
    end === +DateTime.utc().minus({ years: 1 }).endOf('year')
  ) {
    return SearchDatePreset.LastYear;
  }

  if (start === +DateTime.utc().minus({ days: 30 }).startOf('day') && end === +DateTime.utc().endOf('day')) {
    return SearchDatePreset.Last30Days;
  }

  return SearchDatePreset.Custom;
};

export const getSearchDateRange = (after: DateTime | undefined, before: DateTime | undefined) => {
  const $t = get(t);
  const start = after?.toLocaleString(DateTime.DATE_MED);
  const end = before?.toLocaleString(DateTime.DATE_MED);
  return start && end ? $t('search_filter_date_interval', { values: { start, end } }) : (start ?? end);
};

export const searchDateTitle = (
  preset: SearchDatePreset | undefined,
  before: DateTime | undefined,
  after: DateTime | undefined,
): string | undefined => {
  const $t = get(t);
  switch (preset) {
    case SearchDatePreset.ThisYear: {
      return $t('search_filter_date_this_year');
    }
    case SearchDatePreset.LastYear: {
      return $t('search_filter_date_last_year');
    }
    case SearchDatePreset.Last30Days: {
      return $t('search_filter_date_last_30_days');
    }
    case SearchDatePreset.Custom: {
      return getSearchDateRange(before, after);
    }
    default: {
      return undefined;
    }
  }
};

export const searchTypeTitle = (type: string) => {
  const $t = get(t);
  switch (type) {
    case 'metadata': {
      return $t('file_name_text');
    }
    case 'description': {
      return $t('description');
    }
    case 'fullPath': {
      return $t('full_path_or_folder');
    }
    case 'ocr': {
      return $t('text_in_images');
    }
    default: {
      return undefined;
    }
  }
};

export const searchPlacesTitle = (city?: string, state?: string, country?: string) => {
  let title = city;
  if (state) {
    title = title ? `${title}, ${state}` : state;
  }
  if (country) {
    title = title ? `${title}, ${country}` : country;
  }
  return title;
};

export const searchMediaTitle = (mediaType: MediaType) => {
  const $t = get(t);
  switch (mediaType) {
    case MediaType.Image: {
      return $t('image');
    }
    case MediaType.Video: {
      return $t('video');
    }
    default: {
      return undefined;
    }
  }
};

export const getPeople = async (selected: SvelteSet<string>): Promise<PersonResponseDto[]> => {
  const $t = get(t);
  try {
    const res = await getAllPeople({ withHidden: false });
    return [...res.people.filter((p) => selected.has(p.id)), ...res.people.filter((p) => !selected.has(p.id))];
  } catch (error) {
    handleError(error, $t('errors.failed_to_get_people'));
  }
  return [];
};

export const searchPeopleTitle = (people: PersonResponseDto[], selected: SvelteSet<string>) => {
  if (selected.size === 0) {
    return undefined;
  }

  const $t = get(t);

  const name = people.filter((p) => p.name).find((p) => selected.has(p.id))?.name;
  if (name) {
    return selected.size === 1 ? name : $t('name_plus_more_people', { values: { name, count: selected.size - 1 } });
  }

  return $t('people_count', { values: { count: selected.size } });
};

export const searchTagsTitle = (tags: TagResponseDto[], selected: SvelteSet<string>) => {
  const $t = get(t);

  const id = selected.values().next().value;
  if (!id) {
    return undefined;
  }

  const tag = tags.find((t) => t.id === id)?.name;
  if (!tag) {
    return undefined;
  }

  return selected.size === 1 ? tag : $t('tag_plus_more_tags', { values: { tag, count: selected.size - 1 } });
};
