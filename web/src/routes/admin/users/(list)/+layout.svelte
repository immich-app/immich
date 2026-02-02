<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { Route } from '$lib/route';
  import { getUserAdminActions, getUserAdminsActions } from '$lib/services/user-admin.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { searchUsersAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import {
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    Icon,
    Link,
    MenuItemType,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
  } from '@immich/ui';
  import { mdiInfinity } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  let users: UserAdminResponseDto[] = $state(data.users);

  const onUpdate = async (user: UserAdminResponseDto) => {
    const index = users.findIndex(({ id }) => id === user.id);
    if (index === -1) {
      users = await searchUsersAdmin({ withDeleted: true });
    } else {
      users[index] = user;
    }
  };

  const onUserAdminDeleted = ({ id: userId }: { id: string }) => {
    users = users.filter(({ id }) => id !== userId);
  };

  const { Create } = $derived(getUserAdminsActions($t));

  const getActionsForUser = (user: UserAdminResponseDto) => {
    const { Detail, Update, Delete, ResetPassword, ResetPinCode } = getUserAdminActions($t, user);
    return [Detail, Update, ResetPassword, ResetPinCode, MenuItemType.Divider, Delete];
  };

  const classes = {
    column1: 'w-8/12 md:w-5/12 lg:w-4/12',
    column2: 'hidden md:block md:w-5/12 lg:w-4/12',
    column3: 'hidden lg:block lg:w-2/12',
    column4: 'w-4/12 md:w-2/12 flex justify-end',
  };
</script>

<OnEvents
  onUserAdminCreate={onUpdate}
  onUserAdminUpdate={onUpdate}
  onUserAdminDelete={onUpdate}
  onUserAdminRestore={onUpdate}
  {onUserAdminDeleted}
/>

<CommandPaletteDefaultProvider name={$t('users')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container center size="large">
    <Table class="mt-4" striped spacing="small" size="small">
      <TableHeader>
        <TableHeading class={classes.column1}>{$t('name')}</TableHeading>
        <TableHeading class={classes.column2}>{$t('email')}</TableHeading>
        <TableHeading class={classes.column3}>{$t('has_quota')}</TableHeading>
      </TableHeader>

      <TableBody>
        {#each users as user (user.id)}
          <TableRow color={user.deletedAt ? 'danger' : undefined}>
            <TableCell class={classes.column1}>
              <Link href={Route.viewUser(user)}>{user.name}</Link>
            </TableCell>
            <TableCell class={classes.column2}>{user.email}</TableCell>
            <TableCell class={classes.column3}>
              <div class="container mx-auto flex flex-wrap justify-center">
                {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
                  {getByteUnitString(user.quotaSizeInBytes, $locale)}
                {:else}
                  <Icon icon={mdiInfinity} size="16" />
                {/if}
              </div>
            </TableCell>
            <TableCell class={classes.column4}>
              <ContextMenuButton color="primary" aria-label={$t('open')} items={getActionsForUser(user)} />
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>

    {@render children?.()}
  </Container>
</AdminPageLayout>
