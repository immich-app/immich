<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    label: string;
    value?: string;
    pinLength?: number;
    tabindexStart?: number;
    autofocus?: boolean;
    onFilled?: (value: string) => void;
    type?: 'text' | 'password';
  }

  let {
    label,
    value = $bindable(''),
    pinLength = 6,
    tabindexStart = 0,
    autofocus = false,
    onFilled,
    type = 'text',
  }: Props = $props();

  let pinValues = $state(Array.from({ length: pinLength }).fill(''));
  let pinCodeInputElements: HTMLInputElement[] = $state([]);

  $effect(() => {
    if (value === '') {
      pinValues = Array.from({ length: pinLength }).fill('');
    }
  });

  onMount(() => {
    if (autofocus) {
      pinCodeInputElements[0]?.focus();
    }
  });

  const focusNext = (index: number) => {
    pinCodeInputElements[Math.min(index + 1, pinLength - 1)]?.focus();
  };

  const focusPrev = (index: number) => {
    if (index > 0) {
      pinCodeInputElements[index - 1]?.focus();
    }
  };

  const handleInput = (event: Event, index: number) => {
    const target = event.target as HTMLInputElement;
    let currentPinValue = target.value;

    if (target.value.length > 1) {
      currentPinValue = value.slice(0, 1);
    }

    if (Number.isNaN(Number(value))) {
      pinValues[index] = '';
      target.value = '';
      return;
    }

    pinValues[index] = currentPinValue;

    value = pinValues.join('').trim();

    if (value && index < pinLength - 1) {
      focusNext(index);
    }

    if (value.length === pinLength) {
      onFilled?.(value);
    }
  };

  function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
    const target = event.currentTarget as HTMLInputElement;
    const index = pinCodeInputElements.indexOf(target);

    switch (event.key) {
      case 'Tab': {
        return;
      }
      case 'Backspace': {
        if (target.value === '' && index > 0) {
          focusPrev(index);
          pinValues[index - 1] = '';
        } else if (target.value !== '') {
          pinValues[index] = '';
        }
        return;
      }
      case 'ArrowLeft': {
        if (index > 0) {
          focusPrev(index);
        }
        return;
      }
      case 'ArrowRight': {
        if (index < pinLength - 1) {
          focusNext(index);
        }
        return;
      }
      default: {
        if (Number.isNaN(Number(event.key))) {
          event.preventDefault();
        }
        break;
      }
    }
  }
</script>

<div class="flex flex-col gap-1">
  {#if label}
    <label class="text-xs text-dark" for={pinCodeInputElements[0]?.id}>{label.toUpperCase()}</label>
  {/if}
  <div class="flex gap-2">
    {#each { length: pinLength } as _, index (index)}
      <input
        tabindex={tabindexStart + index}
        {type}
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        bind:this={pinCodeInputElements[index]}
        id="pin-code-{index}"
        class="h-12 w-10 rounded-xl border-2 border-suble dark:border-gray-700 bg-transparent text-center text-lg font-medium focus:border-immich-primary focus:ring-primary dark:focus:border-primary font-mono bg-white dark:bg-light"
        bind:value={pinValues[index]}
        onkeydown={handleKeydown}
        oninput={(event) => handleInput(event, index)}
        aria-label={`PIN digit ${index + 1} of ${pinLength}${label ? ` for ${label}` : ''}`}
      />
    {/each}
  </div>
</div>
