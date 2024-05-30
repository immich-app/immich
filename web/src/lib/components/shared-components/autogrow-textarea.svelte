<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { clickOutside } from '$lib/actions/click-outside';
  import { shortcut } from '$lib/actions/shortcut';
  import { tick } from 'svelte';

  export let content: string;
  export let elementClass: string;
  export let onContentUpdate: (newContent: string) => void;
  export let placeholder: string;

  let textarea: HTMLTextAreaElement;
  $: newContent = content;

  $: if (textarea) {
    newContent;
    void tick().then(() => autoGrowHeight(textarea));
  }

  const updateContent = () => {
    if (content === newContent) {
      return;
    }
    onContentUpdate(newContent);
  };
</script>

<textarea
  bind:this={textarea}
  class={elementClass}
  on:focusout={updateContent}
  on:input={(e) => (newContent = e.currentTarget.value)}
  use:clickOutside={{ onOutclick: updateContent }}
  {placeholder}
  use:shortcut={{
    shortcut: { key: 'Enter', ctrl: true },
    onShortcut: (e) => e.currentTarget.blur(),
  }}>{content}</textarea
>
