<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Route } from '$lib/route';
  import { handleUpdateFamilyMember } from '$lib/services/family-member.service';
  import { Alert, Button, Container, Field, HStack, Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let name = $state(data.familyMember.name);
  let birthdate = $state(data.familyMember.birthdate);
  let color = $state(data.familyMember.color || '#3B82F6');
  let loading = $state(false);

  const valid = $derived(name.length > 0 && birthdate.length > 0);

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid || loading) {
      return;
    }

    loading = true;

    const member = await handleUpdateFamilyMember($t, data.familyMember.id, {
      name,
      birthdate,
      color: color || undefined,
    });

    loading = false;

    if (member) {
      await goto(Route.familyMembers());
    }
  };
</script>

<AdminPageLayout
  breadcrumbs={[
    { title: $t('family_members'), href: Route.familyMembers() },
    { title: data.familyMember.name },
    { title: data.meta.title },
  ]}
>
  <Container center size="medium">
    <form onsubmit={onSubmit} class="mt-8 space-y-6">
      <Alert color="primary">
        <Text>{$t('edit_family_member_description')}</Text>
      </Alert>

      <Field label={$t('name')} required>
        <Input bind:value={name} type="text" placeholder={$t('enter_family_member_name')} />
      </Field>

      <Field label={$t('birthday')} required>
        <Input bind:value={birthdate} type="date" />
      </Field>

      <Field label={$t('color')}>
        <div class="flex items-center gap-4">
          <input
            type="color"
            bind:value={color}
            class="h-10 w-20 cursor-pointer rounded border border-gray-300"
          />
          <Input bind:value={color} type="text" pattern="^#[0-9A-Fa-f]{6}$" class="w-32" />
        </div>
      </Field>

      <HStack>
        <Button href={Route.familyMembers()} variant="outline">{$t('cancel')}</Button>
        <Button type="submit" disabled={!valid || loading} {loading}>{$t('save')}</Button>
      </HStack>
    </form>
  </Container>
</AdminPageLayout>
