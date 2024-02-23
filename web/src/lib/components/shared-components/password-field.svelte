<script lang="ts">
  import { mdiEyeOutline, mdiEyeClosed } from '@mdi/js';
  import Icon from '../elements/icon.svelte';

  export let password: string;
  export let label: string;
  export let autocomplete: string = 'current-password';

  let showPassword = false;
  $: passwordFieldType = showPassword ? 'text' : 'password';

  const handleInput = (e: Event) => {
    password = (e.target as HTMLInputElement).value;
  };
</script>

<label class="immich-form-label" for="password">{label}</label>
<div class="immich-form-input">
  <input
    class="immich-form-password"
    id="password"
    name="password"
    type={passwordFieldType}
    {autocomplete}
    required
    on:input={handleInput}
  />
  <button type="button" on:click={() => (showPassword = !showPassword)}>
    {#if showPassword}
      <Icon path={mdiEyeOutline} size="20" color="#8f96a3" ariaLabel="Hide {label}" />
    {:else}
      <Icon path={mdiEyeClosed} size="20" color="#8f96a3" ariaLabel="Show {label}" />
    {/if}
  </button>
</div>

<style>
  div {
    display: flex;
    flex-direction: row;
  }

  input {
    flex-grow: 2;
  }

  button {
    width: 25px;
  }
</style>
