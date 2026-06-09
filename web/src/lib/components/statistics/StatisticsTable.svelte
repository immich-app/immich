<script lang="ts">
  interface Props {
    title: string;
    subtitle: string;
    items: Array<{
      id?: string;
      label: string;
      value: string | number;
      href?: string;
    }>;
    mainColumnLabel: string;
    countColumnLabel?: string;
  }

  let { title, subtitle, items, mainColumnLabel, countColumnLabel = 'Count' }: Props = $props();
</script>

<div
  class="flex h-full flex-col rounded-3xl border border-gray-200/70 bg-light p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-bg"
>
  <div class="flex items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">{title}</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-immich-dark-fg/75">{subtitle}</p>
    </div>
  </div>

  <div class="mt-6 flex-1 overflow-hidden rounded-2xl border border-gray-200/70 dark:border-immich-dark-gray">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-subtle/40">
      <thead class="bg-subtle dark:bg-immich-dark-gray">
        <tr>
          {#each Array.isArray(mainColumnLabel) ? mainColumnLabel : [mainColumnLabel] as label (label)}
            <th
              class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75"
            >
              {label}
            </th>
          {/each}
          <th
            class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75"
          >
            {countColumnLabel}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 bg-white dark:divide-subtle/40 dark:bg-immich-dark-bg">
        {#each items as item, index (item.id ?? index)}
          <tr class={index === 0 ? 'bg-emerald-50/60 dark:bg-emerald-900/15' : 'dark:hover:bg-immich-dark-gray/60'}>
            <td class="px-4 py-3 text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
              {#if item.href}
                <a class="-mx-4 -my-3 block px-4 py-3 transition-colors hover:text-primary" href={item.href}>
                  {item.label}
                </a>
              {:else}
                {item.label}
              {/if}
            </td>
            <td class="px-4 py-3 text-right text-sm font-semibold text-immich-fg dark:text-immich-dark-fg">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
