<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import LicenseContent from '$lib/components/shared-components/license/license-content.svelte';
  import ServerLicense from '$lib/components/shared-components/license/server-license-card.svelte';
  import UserLicense from '$lib/components/shared-components/license/user-license-card.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { mdiAccount, mdiCheckCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let onClose: () => void;
</script>

<Portal>
  <FullScreenModal showLogo title={''} {onClose} width="wide">
    <LicenseContent />
  </FullScreenModal>
</Portal>
