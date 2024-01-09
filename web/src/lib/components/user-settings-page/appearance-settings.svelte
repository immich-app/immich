<script lang="ts">
  import { fade } from 'svelte/transition';
  import { colorTheme } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';

  export const handleToggle = () => {
    $colorTheme.system = !$colorTheme.system;
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title="Selectionner le thème"
          subtitle="Définir automatiquement le thème en mode clair ou sombre en fonction des préférences système de votre navigateur."
          bind:checked={$colorTheme.system}
          on:toggle={handleToggle}
        />
      </div>
    </div>
  </div>
</section>
