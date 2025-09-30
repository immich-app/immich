<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { blurOnCtrlEnter } from '$lib/actions/input';

  interface Props {
    content?: string;
    class?: string;
    onContentUpdate?: (newContent: string) => void;
    placeholder?: string;
  }

  let { content = '', class: className = '', onContentUpdate = () => null, placeholder = '' }: Props = $props();

  let newContent = $derived(content);

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
  {@attach blurOnCtrlEnter}
  use:autoGrowHeight={{ value: newContent }}
  data-testid="autogrow-textarea">{content}</textarea
>
