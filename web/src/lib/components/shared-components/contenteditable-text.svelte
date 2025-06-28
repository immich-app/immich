<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    placeholder?: string;
    value?: string;
    isCtrlEnter?: boolean;
    disabled?: boolean;
    onUpdate?: (newValue: string) => void;
  }

  let { isCtrlEnter = false, value = $bindable(), disabled = false, onUpdate = () => null, ...props }: Props = $props();

  let lastValue = value;
</script>

{#if disabled}
  <div class="cursor-not-allowed {props.class}" role="textbox" aria-disabled={true} data-testid="contenteditable-text">
    {props.placeholder}
  </div>
{:else}
  <div
    bind:innerText={value}
    {...props}
    use:shortcut={{
      shortcut: { key: 'Enter', ctrl: isCtrlEnter },
      onShortcut: (e) => e.currentTarget.blur(),
    }}
    contenteditable="plaintext-only"
    class={props.class}
    role="textbox"
    aria-placeholder={props.placeholder}
    aria-multiline={isCtrlEnter}
    onkeydown={(e) => e.stopImmediatePropagation()}
    onfocusout={(e) => {
      if (lastValue !== value) {
        lastValue = value;
        onUpdate?.(value ?? '');
      }
      props.onfocusout?.(e);
    }}
    data-testid="contenteditable-text"
    tabindex="0"
  ></div>
{/if}

<style>
  [contenteditable='plaintext-only']:empty:not(:focus):before {
    content: attr(placeholder);
    pointer-events: none;
    display: block;
    color: #555;
  }
</style>
