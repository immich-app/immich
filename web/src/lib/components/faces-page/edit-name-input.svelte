<script lang="ts">
  import { type PersonResponseDto } from '@immich/sdk';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import { t } from 'svelte-i18n';

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
  class="flex w-full h-14 place-items-center {suggestedPeople.length > 0
    ? 'rounded-t-lg dark:border-immich-dark-gray'
    : 'rounded-lg'}  bg-gray-100 p-2 dark:bg-gray-700 border border-gray-200 dark:border-immich-dark-gray"
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
    <Button size="sm" type="submit">{$t('done')}</Button>
  </form>
</div>
