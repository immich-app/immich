<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import AdminCard from '$lib/components/AdminCard.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import DeviceCard from '$lib/components/user-settings-page/device-card.svelte';
  import FeatureSetting from '$lib/components/users/FeatureSetting.svelte';
  import { Route } from '$lib/route';
  import { getUserAdminActions } from '$lib/services/user-admin.service';
  import { locale } from '$lib/stores/preferences.store';
  import { createDateFormatter, findLocale } from '$lib/utils';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import {
    Alert,
    Badge,
    Code,
    CommandPaletteDefaultProvider,
    Container,
    getByteUnitString,
    Heading,
    Icon,
    MenuItemType,
    Meter,
    Stack,
    Text,
  } from '@immich/ui';
  import {
    mdiAccountOutline,
    mdiCameraIris,
    mdiChartPie,
    mdiChartPieOutline,
    mdiCheckCircle,
    mdiDevices,
    mdiFeatureSearchOutline,
    mdiPlayCircle,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  const { children, data }: Props = $props();

  const { user, userPreferences, userStatistics, userSessions } = $derived(data);
  const usedBytes = $derived(user.quotaUsageInBytes ?? 0);
  const availableBytes = $derived(user.quotaSizeInBytes ?? 0);
  const TiB = 1024 ** 4;
  const [statsUsage, statsUsageUnit] = $derived(getBytesWithUnit(usedBytes, usedBytes > TiB ? 2 : 0));

  let editedLocale = $derived(findLocale($locale).code);
  let createAtDate = $derived(new Date(user.createdAt));
  let updatedAtDate = $derived(new Date(user.updatedAt));
  let userCreatedAtDateAndTime = $derived(createDateFormatter(editedLocale).formatDateTime(createAtDate));
  let userUpdatedAtDateAndTime = $derived(createDateFormatter(editedLocale).formatDateTime(updatedAtDate));

  const storageUsageThresholds = [
    { from: 0.8, className: 'bg-warning' },
    { from: 0.95, className: 'bg-danger' },
  ];

  const { ResetPassword, ResetPinCode, Update, Delete, Restore } = $derived(getUserAdminActions($t, user));

  const onUpdate = async (update: UserAdminResponseDto) => {
    if (update.id === user.id) {
      data.user = update;
      await invalidateAll();
    }
  };

  const onUserAdminDeleted = async ({ id }: { id: string }) => {
    if (id === user.id) {
      await goto(Route.users());
    }
  };
</script>

<OnEvents
  onUserAdminUpdate={onUpdate}
  onUserAdminDelete={onUpdate}
  onUserAdminRestore={onUpdate}
  {onUserAdminDeleted}
/>

<CommandPaletteDefaultProvider name={$t('user')} actions={[ResetPassword, ResetPinCode, Update, Delete, Restore]} />

<AdminPageLayout
  breadcrumbs={[{ title: $t('admin.user_management'), href: Route.users() }, { title: user.name }]}
  actions={[ResetPassword, ResetPinCode, Update, Restore, MenuItemType.Divider, Delete]}
>
  <div>
    <Container size="large" center>
      {#if user.deletedAt}
        <Alert color="danger" class="my-4" title={$t('user_has_been_deleted')} icon={mdiTrashCanOutline} />
      {/if}

      <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
        <div class="col-span-full flex flex-col gap-4 my-4">
          <div class="flex items-center gap-4">
            <UserAvatar {user} size="md" />
            <Heading tag="h1" size="large">{user.name}</Heading>
          </div>
          {#if user.isAdmin}
            <div>
              <Badge color="primary" size="small">{$t('admin.admin_user')}</Badge>
            </div>
          {/if}
        </div>
        <div class="col-span-full">
          <div class="flex flex-col lg:flex-row gap-4 w-full">
            <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} value={userStatistics.images} />
            <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} value={userStatistics.videos} />
            <ServerStatisticsCard icon={mdiChartPie} title={$t('storage')} value={statsUsage} unit={statsUsageUnit} />
          </div>
        </div>

        <AdminCard icon={mdiAccountOutline} title={$t('profile')}>
          <Stack gap={2}>
            <div>
              <Heading tag="h3" size="tiny">{$t('name')}</Heading>
              <Text>{user.name}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('email')}</Heading>
              <Text>{user.email}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('created_at')}</Heading>
              <Text>{userCreatedAtDateAndTime}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('updated_at')}</Heading>
              <Text>{userUpdatedAtDateAndTime}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('id')}</Heading>
              <Code>{user.id}</Code>
            </div>
          </Stack>
        </AdminCard>

        <AdminCard icon={mdiFeatureSearchOutline} title={$t('features')}>
          <Stack gap={3}>
            <FeatureSetting title={$t('email_notifications')} state={userPreferences.emailNotifications.enabled} />
            <FeatureSetting title={$t('folders')} state={userPreferences.folders.enabled} />
            <FeatureSetting title={$t('memories')} state={userPreferences.memories.enabled} />
            <FeatureSetting title={$t('people')} state={userPreferences.people.enabled} />
            <FeatureSetting title={$t('rating')} state={userPreferences.ratings.enabled} />
            <FeatureSetting title={$t('shared_links')} state={userPreferences.sharedLinks.enabled} />
            <FeatureSetting title={$t('show_supporter_badge')} state={userPreferences.purchase.showSupportBadge} />
            <FeatureSetting title={$t('tags')} state={userPreferences.tags.enabled} />
            <FeatureSetting title={$t('gcast_enabled')} state={userPreferences.cast.gCastEnabled} />
          </Stack>
        </AdminCard>

        <AdminCard icon={mdiChartPieOutline} title={$t('storage_quota')}>
          {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
            <Meter
              size="small"
              class="bg-gray-200 dark:bg-gray-700"
              containerClass="p-4 gap-4 bg-gray-100 dark:bg-gray-800 rounded-lg leading-6"
              label={$t('storage')}
              valueLabel={$t('storage_usage', {
                values: {
                  used: getByteUnitString(usedBytes, $locale, 2),
                  available: getByteUnitString(availableBytes, $locale, 2),
                },
              })}
              value={usedBytes / availableBytes}
              thresholds={storageUsageThresholds}
            />
          {:else}
            <Text class="flex items-center gap-1">
              <Icon icon={mdiCheckCircle} size="1.25rem" class="text-success" />
              {$t('unlimited')}
            </Text>
          {/if}
        </AdminCard>

        <AdminCard icon={mdiDevices} title={$t('authorized_devices')}>
          <Stack gap={3}>
            {#each userSessions as session (session.id)}
              <DeviceCard {session} />
            {:else}
              <span class="text-dark">{$t('no_devices')}</span>
            {/each}
          </Stack>
        </AdminCard>
      </div>

      {@render children?.()}
    </Container>
  </div>
</AdminPageLayout>
