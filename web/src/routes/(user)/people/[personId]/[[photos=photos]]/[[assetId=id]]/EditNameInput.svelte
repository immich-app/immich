<script lang="ts">
  import SearchPeople from '$lib/components/faces-page/PeopleSearch.svelte';
  import { type PersonResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';

  interface Props {
    person: PersonResponseDto;
    name: string;
    suggestedPeople: PersonResponseDto[];
    thumbnailData: string;
    isSearchingPeople: boolean;
    onChange: (name: string) => void;
  }

  let {
    person,
    name = $bindable(),
    suggestedPeople = $bindable(),
    thumbnailData,
    isSearchingPeople = $bindable(),
    onChange,
  }: Props = $props();

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onChange(name);
  };
</script>

<div
  class="flex h-14 w-full place-items-center {suggestedPeople.length > 0
    ? 'rounded-t-lg dark:border-immich-dark-gray'
    : 'rounded-lg'} border border-gray-200 bg-gray-100 p-2 dark:border-immich-dark-gray dark:bg-gray-700"
>
  <ImageThumbnail circle shadow url={thumbnailData} altText={person.name} widthStyle="2rem" heightStyle="2rem" />
  <form class="ms-4 flex w-full justify-between gap-16" autocomplete="off" {onsubmit}>
    <SearchPeople
      bind:searchName={name}
      bind:searchedPeopleLocal={suggestedPeople}
      type="input"
      numberPeopleToSearch={5}
      inputClass="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
      bind:showLoadingSpinner={isSearchingPeople}
    />
    <Button size="small" shape="round" type="submit">{$t('done')}</Button>
  </form>
</div>
