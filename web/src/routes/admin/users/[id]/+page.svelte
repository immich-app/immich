<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import FeatureSetting from '$lib/components/users/FeatureSetting.svelte';
  import PasswordResetSuccessModal from '$lib/modals/PasswordResetSuccessModal.svelte';
  import UserDeleteConfirmModal from '$lib/modals/UserDeleteConfirmModal.svelte';
  import UserEditModal from '$lib/modals/UserEditModal.svelte';
  import UserRestoreConfirmModal from '$lib/modals/UserRestoreConfirmModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { user as authUser } from '$lib/stores/user.store';
  import { createDateFormatter, findLocale } from '$lib/utils';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUserAdmin } from '@immich/sdk';
  import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Code,
    Container,
    getByteUnitString,
    Heading,
    HStack,
    Icon,
    modalManager,
    Stack,
    Text,
  } from '@immich/ui';
  import {
    mdiAccountOutline,
    mdiCameraIris,
    mdiChartPie,
    mdiChartPieOutline,
    mdiCheckCircle,
    mdiDeleteRestore,
    mdiFeatureSearchOutline,
    mdiLockSmart,
    mdiOnepassword,
    mdiPencilOutline,
    mdiPlayCircle,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let user = $derived(data.user);
  const userPreferences = $derived(data.userPreferences);
  const userStatistics = $derived(data.userStatistics);

  const TiB = 1024 ** 4;
  const usage = $derived(user.quotaUsageInBytes ?? 0);
  let [statsUsage, statsUsageUnit] = $derived(getBytesWithUnit(usage, usage > TiB ? 2 : 0));

  const usedBytes = $derived(user.quotaUsageInBytes ?? 0);
  const availableBytes = $derived(user.quotaSizeInBytes ?? 1);
  let usedPercentage = $derived(Math.min(Math.round((usedBytes / availableBytes) * 100), 100));
  let canResetPassword = $derived($authUser.id !== user.id);
  let newPassword = $state<string>('');

  let editedLocale = $derived(findLocale($locale).code);
  let createAtDate: Date = $derived(new Date(user.createdAt));
  let updatedAtDate: Date = $derived(new Date(user.updatedAt));
  let userCreatedAtDateAndTime: string = $derived(createDateFormatter(editedLocale).formatDateTime(createAtDate));
  let userUpdatedAtDateAndTime: string = $derived(createDateFormatter(editedLocale).formatDateTime(updatedAtDate));

  const handleEdit = async () => {
    const result = await modalManager.show(UserEditModal, { user: { ...user } });
    if (result) {
      user = result;
    }
  };

  const handleDelete = async () => {
    const result = await modalManager.show(UserDeleteConfirmModal, { user });
    if (result) {
      user = result;
    }
  };

  const handleRestore = async () => {
    const result = await modalManager.show(UserRestoreConfirmModal, { user });
    if (result) {
      user = result;
    }
  };

  const getUsageClass = () => {
    if (usedPercentage >= 95) {
      return 'bg-red-500';
    }

    if (usedPercentage > 80) {
      return 'bg-yellow-500';
    }

    return 'bg-primary';
  };

  const handleResetPassword = async () => {
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('admin.confirm_user_password_reset', { values: { user: user.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      newPassword = generatePassword();

      await updateUserAdmin({
        id: user.id,
        userAdminUpdateDto: {
          password: newPassword,
          shouldChangePassword: true,
        },
      });

      await modalManager.show(PasswordResetSuccessModal, { newPassword });
    } catch (error) {
      handleError(error, $t('errors.unable_to_reset_password'));
    }
  };

  const handleResetUserPinCode = async () => {
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('admin.confirm_user_pin_code_reset', { values: { user: user.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await updateUserAdmin({ id: user.id, userAdminUpdateDto: { pinCode: null } });

      notificationController.show({ type: NotificationType.Info, message: $t('pin_code_reset_successfully') });
    } catch (error) {
      handleError(error, $t('errors.unable_to_reset_pin_code'));
    }
  };

  // TODO move password reset server-side
  function generatePassword(length: number = 16) {
    let generatedPassword = '';

    const characterSet = '0123456789' + 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + ',.-{}+!#$%/()=?';

    for (let i = 0; i < length; i++) {
      let randomNumber = crypto.getRandomValues(new Uint32Array(1))[0];
      randomNumber = randomNumber / 2 ** 32;
      randomNumber = Math.floor(randomNumber * characterSet.length);

      generatedPassword += characterSet[randomNumber];
    }

    return generatedPassword;
  }
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={0}>
      {#if canResetPassword}
        <Button
          color="secondary"
          size="small"
          variant="ghost"
          leadingIcon={mdiOnepassword}
          onclick={handleResetPassword}
        >
          <Text class="hidden md:block">{$t('reset_password')}</Text>
        </Button>
      {/if}

      <Button
        color="secondary"
        size="small"
        variant="ghost"
        leadingIcon={mdiLockSmart}
        onclick={handleResetUserPinCode}
      >
        <Text class="hidden md:block">{$t('reset_pin_code')}</Text>
      </Button>
      <Button
        color="secondary"
        size="small"
        variant="ghost"
        leadingIcon={mdiPencilOutline}
        onclick={() => handleEdit()}
      >
        <Text class="hidden md:block">{$t('edit_user')}</Text>
      </Button>
      {#if user.deletedAt}
        <Button
          color="primary"
          size="small"
          variant="ghost"
          leadingIcon={mdiDeleteRestore}
          class="ms-1"
          onclick={() => handleRestore()}
        >
          <Text class="hidden md:block">{$t('restore_user')}</Text>
        </Button>
      {:else}
        <Button
          color="danger"
          size="small"
          variant="ghost"
          leadingIcon={mdiTrashCanOutline}
          onclick={() => handleDelete()}
        >
          <Text class="hidden md:block">{$t('delete_user')}</Text>
        </Button>
      {/if}
    </HStack>
  {/snippet}
  <div>
    <Container size="large" center>
      {#if user.deletedAt}
        <Alert color="danger" class="my-4" title={$t('user_has_been_deleted')} icon={mdiTrashCanOutline} />
      {/if}

      <div class="grid gap-4 grod-cols-1 lg:grid-cols-2 w-full">
        <div class="col-span-full flex gap-4 items-center my-4">
          <UserAvatar {user} size="md" />
          <Heading tag="h1" size="large">{user.name}</Heading>
        </div>
        <div class="col-span-full">
          <div class="flex flex-col lg:flex-row gap-4 w-full">
            <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} value={userStatistics.images} />
            <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} value={userStatistics.videos} />
            <ServerStatisticsCard icon={mdiChartPie} title={$t('storage')} value={statsUsage} unit={statsUsageUnit} />
          </div>
        </div>
        <div>
          <Card color="secondary">
            <CardHeader>
              <div class="flex items-center gap-2 px-4 py-2 text-primary">
                <Icon icon={mdiAccountOutline} size="1.5rem" />
                <CardTitle>{$t('profile')}</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div class="px-4 pb-7">
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
              </div>
            </CardBody>
          </Card>
        </div>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2 px-4 py-2 text-primary">
              <Icon icon={mdiFeatureSearchOutline} size="1.5rem" />
              <CardTitle>{$t('features')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div class="px-4 pb-4">
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
            </div>
          </CardBody>
        </Card>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2 px-4 py-2 text-primary">
              <Icon icon={mdiChartPieOutline} size="1.5rem" />
              <CardTitle>{$t('storage_quota')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div class="px-4 pb-4">
              {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
                <Text>
                  {$t('storage_usage', {
                    values: {
                      used: getByteUnitString(usedBytes, $locale, 3),
                      available: getByteUnitString(availableBytes, $locale, 3),
                    },
                  })}
                </Text>
              {:else}
                <Text class="flex items-center gap-1">
                  <Icon icon={mdiCheckCircle} size="1.25rem" class="text-success" />
                  {$t('unlimited')}
                </Text>
              {/if}
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
</AdminPageLayout>
