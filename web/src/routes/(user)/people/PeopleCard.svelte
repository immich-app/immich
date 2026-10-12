<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import PersonIndicator from '$lib/components/faces-page/PersonIndicator.svelte';
  import { Route } from '$lib/route';
  import { getPersonActions } from '$lib/services/person.service';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { ContextMenuButton } from '@immich/ui';
  import { mdiAccountMultipleCheckOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onMergePeople: () => void;
  };

  let { person, onMergePeople }: Props = $props();

  const { Edit, HidePerson, Favorite, Unfavorite, Access } = $derived(getPersonActions($t, person));

  const items = $derived([
    Edit,
    HidePerson,
    {
      icon: mdiAccountMultipleCheckOutline,
      title: $t('merge_people'),
      onAction: onMergePeople,
    },
    Favorite,
    Unfavorite,
    Access,
  ]);
</script>

<div id="people-card" class="relative" role="group">
  <a href={Route.viewPerson(person, { previousRoute: Route.people() })} draggable="false" class="group">
    <div class="@container relative size-full rounded-xl brightness-95 filter">
      <ImageThumbnail
        shadow
        url={getPeopleThumbnailUrl(person)}
        altText={person.name}
        title={person.name}
        widthStyle="100%"
        circle
        preload={false}
      />
      <PersonIndicator {person} />
    </div>

    <div class="absolute inset-e-2 top-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
      <ContextMenuButton
        variant="filled"
        class="icon-white-drop-shadow"
        translations={{ open_menu: $t('show_person_options') }}
        {items}
      />
    </div>
  </a>
</div>
