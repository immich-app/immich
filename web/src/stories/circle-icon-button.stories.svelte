<script context="module" lang="ts">
  import CircleIconButton from '$lib/ui/circle-icon-button.svelte';
  import { mdiDotsVertical, mdiInformation, mdiPartyPopper } from '@mdi/js';
  export const meta = {
    title: 'Components/Buttons/Circle Icon Button',
    component: CircleIconButton,
    argTypes: {
      color: {
        control: 'select',
        options: ['transparent', 'light', 'dark', 'gray', 'primary', 'opaque'],
      },
      icon: {
        options: {
          mdiInformation,
          mdiDotsVertical,
          mdiPartyPopper,
        },
        control: 'select',
      },
      title: {
        control: 'text',
      },
      type: {
        control: 'select',
        options: ['button', 'submit', 'reset'],
      },
      viewBox: {
        control: 'text',
      },
    },
    args: {
      class: '',
      hideMobile: false,
      icon: mdiInformation,
      padding: 3,
      size: 24,
      title: 'Information',
      type: 'button',
    },
  };
</script>

<script>
  import { Story, Template } from '@storybook/addon-svelte-csf';
</script>

<Template let:args>
  <!--👇 'on:click' allows to forward event to addon-actions  -->
  <CircleIconButton {...args} on:click />
</Template>

<Story name="Primary" args={{ color: 'primary' }} />
<Story name="Transparent" args={{ color: 'transparent' }} />
