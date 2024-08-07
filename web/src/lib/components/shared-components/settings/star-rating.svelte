<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let rating: number;
  export let id: number;
  export let readOnly: boolean = false;

  const dispatch = createEventDispatcher<{ click: number }>();
  const onClick = () => {
    dispatch('click', id);
  };
</script>

<button type="button" on:click={() => onClick()} disabled={readOnly}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    transform="scale(0.9,0.9)"
    class="w-6 h-6 {rating >= id && id != 0 ? 'text-yellow-400' : ''} cursor-pointer"
  >
    <path
      fill-rule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
      clip-rule="evenodd"
    ></path>
    {#if id == 0}
      <path d="M0 0 L24 24" style="fill:none;stroke:red;stroke-width:3"></path>
    {/if}
  </svg>
</button>
