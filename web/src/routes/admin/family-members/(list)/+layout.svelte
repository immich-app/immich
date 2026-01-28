<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { Route } from '$lib/route';
  import {
    formatAge,
    getFamilyMemberActions,
    getFamilyMembersActions,
  } from '$lib/services/family-member.service';
  import { getAllFamilyMembers, type FamilyMemberResponseDto } from '@immich/sdk';
  import {
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
  } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  let familyMembers: FamilyMemberResponseDto[] = $state(data.familyMembers);

  const onFamilyMemberCreate = async (member: FamilyMemberResponseDto) => {
    familyMembers = await getAllFamilyMembers();
  };

  const onFamilyMemberUpdate = async (member: FamilyMemberResponseDto) => {
    const index = familyMembers.findIndex(({ id }) => id === member.id);
    if (index !== -1) {
      familyMembers[index] = member;
    }
  };

  const onFamilyMemberDelete = async ({ id }: { id: string }) => {
    familyMembers = familyMembers.filter((m) => m.id !== id);
  };

  const { Create } = $derived(getFamilyMembersActions($t));

  const getActionsForMember = (member: FamilyMemberResponseDto) => {
    return getFamilyMemberActions($t, member);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const classes = {
    column1: 'w-4/12 md:w-3/12',
    column2: 'w-3/12 md:w-3/12',
    column3: 'hidden md:block md:w-3/12',
    column4: 'w-2/12 md:w-1/12',
    column5: 'w-3/12 md:w-2/12 flex justify-end',
  };
</script>

<OnEvents {onFamilyMemberCreate} {onFamilyMemberUpdate} {onFamilyMemberDelete} />

<CommandPaletteDefaultProvider name={$t('family_members')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container center size="large">
    {#if familyMembers.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <p class="text-lg text-gray-500 dark:text-gray-400">{$t('no_family_members')}</p>
        <p class="mt-2 text-sm text-gray-400 dark:text-gray-500">{$t('no_family_members_description')}</p>
      </div>
    {:else}
      <Table class="mt-4" striped spacing="small" size="small">
        <TableHeader>
          <TableHeading class={classes.column1}>{$t('name')}</TableHeading>
          <TableHeading class={classes.column2}>{$t('age')}</TableHeading>
          <TableHeading class={classes.column3}>{$t('birthday')}</TableHeading>
          <TableHeading class={classes.column4}>{$t('color')}</TableHeading>
        </TableHeader>

        <TableBody>
          {#each familyMembers as member (member.id)}
            <TableRow>
              <TableCell class={classes.column1}>
                <div class="flex items-center gap-2">
                  {#if member.color}
                    <span
                      class="inline-block h-3 w-3 rounded-full"
                      style="background-color: {member.color}"
                    ></span>
                  {/if}
                  {member.name}
                </div>
              </TableCell>
              <TableCell class={classes.column2}>{formatAge(member.birthdate)}</TableCell>
              <TableCell class={classes.column3}>{formatDate(member.birthdate)}</TableCell>
              <TableCell class={classes.column4}>
                {#if member.color}
                  <span
                    class="inline-block h-6 w-6 rounded-full border border-gray-300"
                    style="background-color: {member.color}"
                  ></span>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </TableCell>
              <TableCell class={classes.column5}>
                <ContextMenuButton color="primary" aria-label={$t('open')} items={getActionsForMember(member)} />
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}

    {@render children?.()}
  </Container>
</AdminPageLayout>
