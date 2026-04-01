<script lang="ts">
  import { getOwnAlbumUser, SharingPermission, updateOwnAlbumUser } from '@immich/sdk';
  import { Checkbox, Field, FormModal, Heading, Stack, Switch, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { init } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    albumId?: string;
    partnerId?: string;
  };

  const { onClose, ...rest }: Props = $props();

  let checkedPermissions = $state<SharingPermission[]>([]);
  let viewInTimeline = $state<boolean>(false);

  const onCheckedChange = (permission: SharingPermission, checked: boolean) => {
    if (checked) {
      checkedPermissions.push(permission);
    } else {
      checkedPermissions = checkedPermissions.filter((perm) => perm !== permission);
    }
  };

  const onSubmit = async () => {
    const permissions =
      checkedPermissions.length === Object.values(SharingPermission).length - 1
        ? [SharingPermission.All]
        : checkedPermissions;
    if (rest.albumId) {
      await updateOwnAlbumUser({
        id: rest.albumId,
        updateSharingOptionsDto: { permissions, inTimeline: viewInTimeline },
      });
      toastManager.success();
    }
    onClose();
  };

  onMount(async () => {
    if (rest.albumId) {
      const { permissions, inTimeline } = await getOwnAlbumUser({ id: rest.albumId });
      checkedPermissions = permissions;
      viewInTimeline = inTimeline;
    }
  });
</script>

<FormModal title="Sharing options" {onClose} {onSubmit}>
  <Stack>
    <Field label="View in timeline">
      <Switch bind:checked={viewInTimeline} />
    </Field>
    <Heading>Permissions</Heading>
    <Field label={SharingPermission.All}>
      <Checkbox
        id="permission-{SharingPermission.All}"
        checked={checkedPermissions.length === Object.values(SharingPermission).length - 1}
        onCheckedChange={(checked) =>
          checked
            ? (checkedPermissions = Object.values(SharingPermission).filter(
                (permission) => permission !== SharingPermission.All,
              ))
            : (checkedPermissions = [])}
      />
    </Field>
    {#each Object.values(SharingPermission).filter((permission) => permission !== SharingPermission.All) as permission (permission)}
      <Field label={permission}>
        <Checkbox
          id="permission-{permission}"
          checked={checkedPermissions.includes(permission)}
          onCheckedChange={(checked) => onCheckedChange(permission, checked)}
        />
      </Field>
    {/each}
  </Stack>
</FormModal>
