<script lang="ts">
  import StatsCard from '$lib/components/admin-page/server-stats/stats-card.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Code,
    Container,
    Field,
    FormatBytes,
    getByteUnitString,
    Heading,
    HStack,
    Icon,
    Stack,
    Switch,
    Text,
  } from '@immich/ui';
  import {
    mdiAccountOutline,
    mdiCameraIris,
    mdiChartPie,
    mdiChartPieOutline,
    mdiCloudUploadOutline,
    mdiFeatureSearchOutline,
    mdiLockReset,
    mdiPlayCircle,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const user = $derived(data.user);
  const userPreferences = $derived(data.userPreferences);
  const userStatistics = $derived(data.userStatistics);

  const TiB = 1024 ** 4;
  const usage = $derived(user.quotaUsageInBytes ?? 0);
  let [statsUsage, statsUsageUnit] = $derived(getBytesWithUnit(usage, usage > TiB ? 2 : 0));

  const usedBytes = $derived(user.quotaUsageInBytes ?? 0);
  const availableBytes = $derived(user.quotaSizeInBytes ?? 1);
  let usedPercentage = $derived(Math.min(Math.round((usedBytes / availableBytes) * 100), 100));

  const handleSomething = () => {};

  const getUsageClass = () => {
    if (usedPercentage >= 95) {
      return 'bg-red-500';
    }

    if (usedPercentage > 80) {
      return 'bg-yellow-500';
    }

    return 'bg-immich-primary dark:bg-immich-dark-primary';
  };
</script>

<UserPageLayout title={data.meta.title} admin>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button leadingIcon={mdiLockReset} onclick={() => handleSomething} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('reset_password')}</Text>
      </Button>
      <Button
        color="danger"
        leadingIcon={mdiTrashCanOutline}
        onclick={() => handleSomething}
        size="small"
        variant="ghost"
      >
        <Text class="hidden md:block">{$t('delete_user')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <div>
    <Container size="large" center>
      <div class="grid gap-4 grod-cols-1 lg:grid-cols-2 w-full">
        <div class="col-span-full flex gap-4 items-center my-4">
          <UserAvatar {user} size="md" />
          <Heading tag="h1" size="large">{user.name}</Heading>
        </div>
        <div class="col-span-full">
          <div class="flex flex-col lg:flex-row gap-4">
            <StatsCard icon={mdiCameraIris} title={$t('photos').toUpperCase()} value={userStatistics.images} />
            <StatsCard icon={mdiPlayCircle} title={$t('videos').toUpperCase()} value={userStatistics.videos} />
            <StatsCard
              icon={mdiChartPie}
              title={$t('storage').toUpperCase()}
              value={statsUsage}
              unit={statsUsageUnit}
            />
          </div>
        </div>
        <div>
          <Card color="secondary">
            <CardHeader>
              <div class="flex items-center gap-2">
                <Icon icon={mdiAccountOutline} size="1.5rem" />
                <CardTitle>{$t('profile')}</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
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
                  <Text>{user.createdAt}</Text>
                </div>
                <div>
                  <Heading tag="h3" size="tiny">{$t('updated_at')}</Heading>
                  <Text>{user.updatedAt}</Text>
                </div>
                <div>
                  <Heading tag="h3" size="tiny">{$t('id')}</Heading>
                  <Code>{user.id}</Code>
                </div>
              </Stack>
            </CardBody>
          </Card>
        </div>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Icon icon={mdiFeatureSearchOutline} size="1.5rem" />
              <CardTitle>{$t('features')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div>
              <Stack gap={2}>
                <Field readOnly label="Email Notifications">
                  <Switch checked={userPreferences.emailNotifications.enabled} color="primary" />
                </Field>
                <Field readOnly label="Folders">
                  <Switch checked={userPreferences.folders.enabled} color="primary" />
                </Field>
                <Field readOnly label="Memories">
                  <Switch checked={userPreferences.memories.enabled} color="primary" />
                </Field>
                <Field readOnly label="People">
                  <Switch checked={userPreferences.people.enabled} color="primary" />
                </Field>
                <Field readOnly label="Rating">
                  <Switch checked={userPreferences.ratings.enabled} color="primary" />
                </Field>
                <Field readOnly label="Shared Links">
                  <Switch checked={userPreferences.sharedLinks.enabled} color="primary" />
                </Field>
                <Field readOnly label="Support Badge">
                  <Switch checked={userPreferences.purchase.showSupportBadge} color="primary" />
                </Field>
                <Field readOnly label="Tags">
                  <Switch checked={userPreferences.tags.enabled} color="primary" />
                </Field>
              </Stack>
            </div>
          </CardBody>
        </Card>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Icon icon={mdiCloudUploadOutline} size="1.5rem" />
              <CardTitle>Backup Status</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <Heading tag="h3" size="tiny">Last Sync</Heading>
            <Text>TODO</Text>
          </CardBody>
        </Card>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Icon icon={mdiChartPieOutline} size="1.5rem" />
              <CardTitle>Quota</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div class="grid grid-cols-2">
              <div>
                <Heading tag="h3" size="tiny">Usage</Heading>
                <FormatBytes bytes={user.quotaUsageInBytes || 0} />
              </div>
              <div>
                <Heading tag="h3" size="tiny">Quota</Heading>
                {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
                  <FormatBytes bytes={user.quotaSizeInBytes} />
                {:else}
                  <Text>Unlimited</Text>
                {/if}
              </div>
            </div>

            {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
              <div
                class="storage-status p-4 mt-4 bg-gray-100 dark:bg-immich-dark-primary/10 rounded-lg text-sm w-full"
                title={$t('storage_usage', {
                  values: {
                    used: getByteUnitString(usedBytes, $locale, 3),
                    available: getByteUnitString(availableBytes, $locale, 3),
                  },
                })}
              >
                <p class="font-medium text-immich-dark-gray dark:text-white mb-2">{$t('storage')}</p>
                <div class="mt-4 h-[7px] w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div class="h-[7px] rounded-full {getUsageClass()}" style="width: {usedPercentage}%"></div>
                </div>
              </div>
            {/if}
          </CardBody>
        </Card>
      </div>
    </Container>
  </div>
</UserPageLayout>
