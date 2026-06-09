<script lang="ts">
  export let href: string | undefined;
  export let ariaLabel: string = '';
  export let titleAttr: string = '';
  export let intensity: number = 0;

  const alpha = Math.max(0.08, Math.min(1, 0.08 + intensity * 0.84));
</script>

{#if href}
  <a {href} class="group relative block" aria-label={ariaLabel} title={titleAttr}>
    <div
      class="h-8 rounded-lg border border-white/70 transition-transform duration-200 group-hover:scale-[1.04] dark:border-immich-dark-bg"
      style={`background-color: rgba(14,165,233, ${alpha})`}
    ></div>
  </a>
{:else}
  <div class="group relative block" aria-label={ariaLabel} title={titleAttr}>
    <div
      class="h-8 rounded-lg border border-white/70 transition-transform duration-200 group-hover:scale-[1.04] dark:border-immich-dark-bg"
      style={`background-color: rgba(14,165,233, ${alpha})`}
    ></div>
  </div>
{/if}
