<script lang="ts">
  import { Toast } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    // Injected by toastManager.custom()
    onClose: () => void;
    description: string;
    label: string;
    onAction: () => unknown;
  }

  let { onClose, description, label, onAction }: Props = $props();

  const handleClick = () => {
    onClose();
    void onAction();
  };
</script>

<Toast
  color="primary"
  title={$t('success')}
  {description}
  {onClose}
  button={{ label, onclick: handleClick }}
/>
