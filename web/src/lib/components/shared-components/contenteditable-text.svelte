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

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    if (e.clipboardData) {
      value = e.clipboardData.getData('text/plain');
    }
  };
</script>

{#if disabled}
  <div class="cursor-not-allowed {props.class}" role="textbox" aria-disabled={true}>
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
    contenteditable="true"
    class={props.class}
    role="textbox"
    aria-placeholder={props.placeholder}
    aria-multiline={isCtrlEnter}
    onpaste={handlePaste}
    onkeydown={(e) => e.stopImmediatePropagation()}
    onfocusout={(e) => {
      if (lastValue !== value) {
        lastValue = value;
        onUpdate?.(value ?? '');
      }
      props.onfocusout?.(e);
    }}
  ></div>
{/if}

<style>
  [contenteditable='true']:empty:not(:focus):before {
    content: attr(placeholder);
    pointer-events: none;
    display: block;
    color: #555;
  }
</style>
