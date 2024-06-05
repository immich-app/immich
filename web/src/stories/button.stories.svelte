<script context="module">
  import Button from '$lib/ui/button.svelte';
  import { Template } from '@storybook/addon-svelte-csf';
  export const meta = {
    title: 'Components/Buttons/Button',
    component: Button,
  };
</script>

<script>
  import { Story } from '@storybook/addon-svelte-csf';
</script>

<Template let:args>
  <Button {...args}>{args.text ?? 'Click me'}</Button>
</Template>

<Story name="Primary" args={{}} />
<Story name="Secondary" args={{ color: 'secondary' }} />

<Story name="Size: tiny" args={{ size: 'xs' }} />
<Story name="Size: sm" args={{ size: 'sm' }} />
<Story name="Size: base" args={{ size: 'md' }} />
<Story name="Size: lg" args={{ size: 'lg' }} />
<Story name="Size: xl" args={{ size: 'xl' }} />
