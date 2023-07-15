<script lang="ts" context="module">
  export type Color = 'primary' | 'secondary';
  export type Rounded = false | true | 'full';
</script>

<script lang="ts">
  export let color: Color = 'primary';
  export let rounded: Rounded = true;

  const colorClasses: Record<Color, string> = {
    primary: 'text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary',
    secondary: 'text-immich-dark-bg dark:text-immich-gray dark:bg-gray-600 bg-gray-300 dark:text-immich-gray',
  };
</script>

<span
  class="inline-block h-min whitespace-nowrap px-4 pt-[0.55em] pb-[0.55em] text-center align-baseline text-xs leading-none {colorClasses[
    color
  ]}"
  class:rounded-md={rounded === true}
  class:rounded-full={rounded === 'full'}
>
  <slot />
</span>
