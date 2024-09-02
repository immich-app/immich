<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { shortcut } from '$lib/actions/shortcut';
  import { tick } from 'svelte';

  export let content: string = '';
  let className: string = '';
  export { className as class };
  export let onContentUpdate: (newContent: string) => void = () => null;
  export let placeholder: string = '';

  let textarea: HTMLTextAreaElement;
  $: newContent = content;

  $: {
    // re-visit with svelte 5. runes will make this better.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    newContent;
    if (textarea && newContent.length > 0) {
      void tick().then(() => autoGrowHeight(textarea));
    }
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
  class="resize-none {className}"
  on:focusout={updateContent}
  on:input={(e) => (newContent = e.currentTarget.value)}
  {placeholder}
  use:shortcut={{
    shortcut: { key: 'Enter', ctrl: true },
    onShortcut: (e) => e.currentTarget.blur(),
  }}
  data-testid="autogrow-textarea">{content}</textarea
>
