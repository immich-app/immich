<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { shortcut } from '$lib/actions/shortcut';
  import { tick } from 'svelte';

  interface Props {
    content?: string;
    class?: string;
    onContentUpdate?: (newContent: string) => void;
    placeholder?: string;
  }

  let { content = '', class: className = '', onContentUpdate = () => null, placeholder = '' }: Props = $props();

  let textarea: HTMLTextAreaElement | undefined = $state();
  let newContent = $state(content);

  $effect(() => {
    if (textarea && newContent.length > 0) {
      void tick().then(() => autoGrowHeight(textarea));
    }
  });

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
  onfocusout={updateContent}
  oninput={(e) => (newContent = e.currentTarget.value)}
  {placeholder}
  use:shortcut={{
    shortcut: { key: 'Enter', ctrl: true },
    onShortcut: (e) => e.currentTarget.blur(),
  }}
  data-testid="autogrow-textarea">{content}</textarea
>
