<script lang="ts">
  import { MemoryType } from '@immich/sdk';
  import { Icon, type CarouselImageItem } from '@immich/ui';
  import { mdiCakeVariant, mdiHeart } from '@mdi/js';
  import BirthdayConfetti from './BirthdayConfetti.svelte';

  type Props = {
    item: MemoryCardItem;
    class?: string;
  };

  type MemoryCardItem = CarouselImageItem & { isSaved?: boolean; type?: MemoryType };

  const { item, class: className = '' }: Props = $props();

  const isBirthday = $derived(item.type === MemoryType.Birthday);

  let confettiCount = $state(0);

  const [flamePath, bottomLayerPath, topLayerPath] = mdiCakeVariant.split(/(?=M)/, 3);
</script>

<a
  class="group relative me-2 inline-block aspect-3/4 h-54 rounded-xl shadow-sm last:me-0 max-md:h-37.5 md:me-4 md:aspect-4/3 xl:aspect-video {className}"
  href={item.href}
  onmouseenter={() => isBirthday && confettiCount++}
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
  <p
    class="absolute inset-s-4 inset-e-4 bottom-2 flex items-center gap-2 text-lg whitespace-normal text-white max-md:text-sm"
  >
    {#if isBirthday}
      <span class="relative">
        <Icon
          data-icon-birthday
          icon={bottomLayerPath}
          size="1.25em"
          class="block transition-colors group-hover:text-logo-blue"
        />
        <Icon icon={topLayerPath} size="1.25em" class="absolute inset-0 transition-colors group-hover:text-logo-pink" />
        <span class="flame absolute inset-0">
          <Icon
            icon={flamePath}
            size="1.25em"
            class="block transition-[color,filter] group-hover:text-logo-yellow group-hover:drop-shadow-[0_0_4px_var(--color-logo-yellow)]"
          />
        </span>
        {#key confettiCount}
          {#if confettiCount > 0}
            <span class="absolute inset-s-1/2 top-1/2">
              <BirthdayConfetti
                amount={40}
                x={[-0.25, 1]}
                y={[0.25, 0.9]}
                size={8}
                duration={1500}
                fallDistance="50px"
              />
            </span>
          {/if}
        {/key}
      </span>
      <span class="min-w-0 wrap-break-word">{item.title}</span>
    {:else}
      {item.title}
    {/if}
  </p>
</a>

<style>
  .flame {
    transform-origin: 50% 25%;
  }

  @media (prefers-reduced-motion: no-preference) {
    a:hover .flame {
      animation: flicker 150ms ease-in-out infinite alternate;
    }
  }

  @keyframes flicker {
    to {
      transform: scale(0.9, 1.1);
    }
  }
</style>
