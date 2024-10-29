<script lang="ts">
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import {
    mdiAccountEditOutline,
    mdiAccountMultipleCheckOutline,
    mdiCalendarEditOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
  } from '@mdi/js';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import { t } from 'svelte-i18n';
  import { focusOutside } from '$lib/actions/focus-outside';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';

  export let person: PersonResponseDto;
  export let preload = false;
  export let onChangeName: () => void;
  export let onSetBirthDate: () => void;
  export let onMergePeople: () => void;
  export let onHidePerson: () => void;

  let showVerticalDots = false;
</script>

<div
  id="people-card"
  class="relative"
  on:mouseenter={() => (showVerticalDots = true)}
  on:mouseleave={() => (showVerticalDots = false)}
  role="group"
  use:focusOutside={{ onFocusOut: () => (showVerticalDots = false) }}
>
  <a
    href="{AppRoute.PEOPLE}/{person.id}?{QueryParameter.PREVIOUS_ROUTE}={AppRoute.PEOPLE}"
    draggable="false"
    on:focus={() => (showVerticalDots = true)}
  >
    <div class="w-full h-full rounded-xl brightness-95 filter">
      <ImageThumbnail
        shadow
        {preload}
        url={getPeopleThumbnailUrl(person)}
        altText={person.name}
        title={person.name}
        widthStyle="100%"
      />
    </div>
    {#if person.name}
      <span
        class="text-white-shadow absolute bottom-2 left-0 w-full select-text px-1 text-center font-medium text-white"
        title={person.name}
      >
        {person.name}
      </span>
    {/if}
  </a>

  {#if showVerticalDots}
    <div class="absolute top-2 right-2">
      <ButtonContextMenu
        buttonClass="icon-white-drop-shadow focus:opacity-100 {showVerticalDots ? 'opacity-100' : 'opacity-0'}"
        color="opaque"
        padding="2"
        size="20"
        icon={mdiDotsVertical}
        title={$t('show_person_options')}
      >
        <MenuOption onClick={onHidePerson} icon={mdiEyeOffOutline} text={$t('hide_person')} />
        <MenuOption onClick={onChangeName} icon={mdiAccountEditOutline} text={$t('change_name')} />
        <MenuOption onClick={onSetBirthDate} icon={mdiCalendarEditOutline} text={$t('set_date_of_birth')} />
        <MenuOption onClick={onMergePeople} icon={mdiAccountMultipleCheckOutline} text={$t('merge_people')} />
      </ButtonContextMenu>
    </div>
  {/if}
</div>
