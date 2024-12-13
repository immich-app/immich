<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { shortcut } from '$lib/actions/shortcut';

  interface Props {
    content?: string;
    class?: string;
    onContentUpdate?: (newContent: string) => void;
    placeholder?: string;
  }

  let { content = '', class: className = '', onContentUpdate = () => null, placeholder = '' }: Props = $props();

  let newContent = $state(content);
  $effect(() => {
    newContent = content;
  });

  const updateContent = () => {
    if (content === newContent) {
      return;
    }
    onContentUpdate(newContent);
  };
</script>

<textarea
  bind:value={newContent}
  class="resize-none {className}"
  onfocusout={updateContent}
  {placeholder}
  use:shortcut={{
    shortcut: { key: 'Enter', ctrl: true },
    onShortcut: (e) => e.currentTarget.blur(),
  }}
  use:autoGrowHeight={{ value: newContent }}
  data-testid="autogrow-textarea">{content}</textarea
>
