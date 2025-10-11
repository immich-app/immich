<script lang="ts">
  import {
    getCategoryString,
    resetModal,
    ShortcutVariant,
    sortCategories,
    type KeyboardHelp,
  } from '$lib/actions/shortcut.svelte';
  import { Kbd, Modal, ModalBody } from '@immich/ui';
  import { type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    onClose: () => void;
    shortcutVariants: Map<ShortcutVariant, ShortcutVariant>;
    shortcuts: KeyboardHelp[];
  }

  let { onClose, shortcutVariants, shortcuts }: Props = $props();

  const secondaryIds = $derived(new Set(shortcutVariants.values()));
  const isEmpty = $derived(shortcuts.length === 0);

  const primaryShortcuts = $derived(
    shortcuts.filter((shortcut) => {
      if (shortcut.variant) {
        if (!secondaryIds.has(shortcut.variant)) {
          return true;
        }
        return false;
      }
      return true;
    }),
  );

  const categories = $derived.by(() =>
    sortCategories([...new Set(primaryShortcuts.filter((s) => !!s.category).flatMap((s) => s.category!))]),
  );

  const categorizedPrimaryShortcuts = $derived.by(() => {
    const categoryMap = new SvelteMap<string, KeyboardHelp[]>();
    for (const c of categories) {
      categoryMap.set(
        c,
        primaryShortcuts.filter((s) => s.category === c),
      );
    }
    return categoryMap;
  });

  const getSecondaryShortcut = (variant: ShortcutVariant | undefined) => {
    if (!variant) {
      return;
    }
    return shortcuts.find((short) => short.variant === variant);
  };
</script>

{#snippet row(col: Snippet<[KeyboardHelp]>, shortcut1: KeyboardHelp, shortcut2: KeyboardHelp | undefined)}
  <div class="grid grid-cols-[15%_35%_15%_35%] items-start gap-4 pt-4 text-sm">
    {@render col(shortcut1)}
    {#if shortcut2}
      {@render col(shortcut2)}
    {/if}
  </div>
{/snippet}
{#snippet col(shortcut: KeyboardHelp)}
  <div>
    {#each shortcut.key as key (key)}
      <div class="flex justify-self-end [&:not(:first-child)]:mt-2">
        {#each key as sequence (sequence)}
          <Kbd>
            {sequence}
          </Kbd>
        {/each}
      </div>
    {/each}
  </div>
  <p>{shortcut.text}</p>
{/snippet}

<Modal title={$t('keyboard_shortcuts')} size="large" onClose={() => (resetModal(), onClose())}>
  <ModalBody>
    <div class="px-4 pb-4 grid grid-auto-fit-200 gap-5 mt-1">
      {#if isEmpty}{$t('no_shortcuts')}{/if}
      {#each categories as category (category)}
        {@const actions = categorizedPrimaryShortcuts.get(category)!}
        <div class="p-4">
          <h2>{getCategoryString(category)}</h2>
          <div class="text-sm">
            {#each actions as shortcut (shortcut)}
              {@const paired = shortcut.variant
                ? getSecondaryShortcut(shortcutVariants.get(shortcut.variant))
                : undefined}
              {@render row(col, shortcut, paired)}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </ModalBody>
</Modal>
