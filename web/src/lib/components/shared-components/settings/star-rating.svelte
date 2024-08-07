<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let rating: number;
  export let id: number;
  export let readOnly: boolean = false;

  let strokeWidth = 1;

  const dispatch = createEventDispatcher<{ click: number }>();
  const onClick = () => {
    dispatch('click', id + 1);
  };

  function handleMouseOver() {
    strokeWidth = 2;
  }

  function handleMouseOut() {
    strokeWidth = 1;
  }
</script>

<button
  type="button"
  on:click={() => onClick()}
  disabled={readOnly}
  style="@apply shadow-none;
  outline: none;"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={rating > id ? 'currentcolor' : 'transparent'}
    stroke="currentcolor"
    transform="scale(0.9,0.9)"
    class="w-6 h-6 {rating > id ? 'text-yellow-400' : ''} cursor-pointer"
  >
    <path
      role="presentation"
      fill-rule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
      clip-rule="evenodd"
      stroke-width={strokeWidth}
      on:mouseover={handleMouseOver}
      on:focus|preventDefault
      on:mouseout={handleMouseOut}
      on:blur|preventDefault
      style="@apply shadow-none;
  outline: none;"
    ></path>
  </svg>
</button>
