<script lang="ts">
  import { MemoryType } from '@immich/sdk';
  import { Icon, type CarouselImageItem } from '@immich/ui';
  import { mdiCakeVariant, mdiHeart } from '@mdi/js';

  type Props = {
    item: MemoryCardItem;
    class?: string;
  };

  type MemoryCardItem = CarouselImageItem & { isSaved?: boolean; type?: MemoryType };

  const { item, class: className = '' }: Props = $props();

  const isBirthday = $derived(item.type === MemoryType.Birthday);
</script>

<a
  class="relative me-2 inline-block aspect-3/4 h-54 rounded-xl shadow-sm last:me-0 max-md:h-37.5 md:me-4 md:aspect-4/3 xl:aspect-video {className}"
  href={item.href}
>
  <img class="size-full rounded-xl object-cover" src={item.src} alt={item.alt ?? item.title} draggable="false" />
  {#if item.isSaved}
    <div class="absolute inset-s-2 top-2 p-1">
      <Icon data-icon-favorite icon={mdiHeart} size="32" class="text-white" />
    </div>
  {/if}
  <div
    class="absolute inset-s-0 top-0 size-full rounded-xl bg-linear-to-t from-black/40 via-transparent to-transparent transition-all hover:bg-black/20"
  ></div>
  <p class="absolute inset-s-4 bottom-2 flex items-center gap-2 text-lg text-white max-md:text-sm">
    {#if isBirthday}
      <Icon data-icon-birthday icon={mdiCakeVariant} size="1.25em" />
      <span class="min-w-0 truncate rounded-sm bg-logo-yellow px-1.5 py-0.5 text-black">{item.title}</span>
    {:else}
      {item.title}
    {/if}
  </p>
</a>
