<script lang="ts">
  import { shortcuts } from '$lib/utils/shortcut';
  import { onMount } from 'svelte';

  export let className = '';
  export let title = '';
  export let textContent = '';
  export let placeholder = '';
  export let disabled = false;
  export let spellcheck = true;
  export let nowrap = false;

  let input: HTMLDivElement;
  let isFocused = false;
  let showPlaceholder = true;
  let initialText = '';

  const onInput = () => {
    let text = parseNodesAsText();
    // When deleting the whole text, a new line may stil be there.
    showPlaceholder = !text || text === '\n';
    if (nowrap) {
      text = text.replaceAll(/\n+/g, ' ');
    }
    textContent = text.trim();
  };

  const onFocus = () => {
    isFocused = true;
  };

  const onBlur = () => {
    isFocused = false;
    showPlaceholder = !textContent;
    input.textContent = textContent;
  };

  const onSelectAll = (event: KeyboardEvent) => {
    if (!disabled) {
      event.stopPropagation();
      selectAllText();
    }
  };

  const parseNodesAsText = () => {
    let text = '';
    let isOnNewLine = true;

    const parseNodes = (nodes: NodeListOf<ChildNode>) => {
      // We need to do the following parsing in order to keep the line breaks
      // that may be replaced by a <br> or <div> tag by the browser.
      for (const node of nodes) {
        if (node.nodeType === node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'BR') {
            text += '\n';
            isOnNewLine = true;
            continue;
          } else if (element.tagName === 'DIV' && !isOnNewLine) {
            text += '\n';
          }
        } else if (node.nodeType === node.TEXT_NODE) {
          text += (node as Text).textContent;
        }
        isOnNewLine = false;
        parseNodes(node.childNodes);
      }
    };

    parseNodes(input.childNodes);
    return text;
  };

  const selectAllText = () => {
    const range = document.createRange();
    range.selectNodeContents(input);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  onMount(() => {
    initialText = textContent;
    showPlaceholder = !initialText;
  });
</script>

<div
  class="{className} relative {showPlaceholder ? 'placeholder' : ''} whitespace-pre-wrap break-words"
  use:shortcuts={[
    { shortcut: { key: 'Enter' }, onShortcut: () => input.blur() },
    { shortcut: { key: 'A', ctrl: true }, onShortcut: onSelectAll },
  ]}
  bind:this={input}
  on:focus={onFocus}
  on:blur={onBlur}
  on:input={onInput}
  on:focus
  on:blur
  on:input
  title={disabled ? '' : title}
  contenteditable={!disabled}
  spellcheck={isFocused && spellcheck && !disabled}
  role={disabled ? null : 'textbox'}
  data-placeholder={placeholder}
>
  {#if initialText}
    {initialText}
  {:else}
    <br />
  {/if}
</div>

<style>
  .placeholder:before {
    content: attr(data-placeholder);
    color: rgb(187, 187, 187);
    display: block;
    position: absolute;
    cursor: text;
  }
</style>
