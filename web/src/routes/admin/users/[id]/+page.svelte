<script lang="ts">
  import StatsCard from '$lib/components/admin-page/server-stats/stats-card.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import PasswordResetSuccessModal from '$lib/modals/PasswordResetSuccessModal.svelte';
  import UserDeleteConfirmModal from '$lib/modals/UserDeleteConfirmModal.svelte';
  import UserEditModal from '$lib/modals/UserEditModal.svelte';
  import UserRestoreConfirmModal from '$lib/modals/UserRestoreConfirmModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { user as authUser } from '$lib/stores/user.store';
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
    Field,
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

    return 'bg-immich-primary dark:bg-immich-dark-primary';
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
                <Field readOnly label={$t('email_notifications')}>
                  <Switch checked={userPreferences.emailNotifications.enabled} color="primary" />
                </Field>
                <Field readOnly label={$t('folders')}>
                  <Switch checked={userPreferences.folders.enabled} color="primary" />
                </Field>
                <Field readOnly label={$t('memories')}>
                  <Switch checked={userPreferences.memories.enabled} color="primary" />
                </Field>
                <Field readOnly label={$t('people')}>
                  <Switch checked={userPreferences.people.enabled} color="primary" />
                </Field>
                <Field readOnly label={$t('rating')}>
                  <Switch checked={userPreferences.ratings.enabled} color="primary" />
                </Field>
                <Field readOnly label={$t('shared_links')}>
                  <Switch checked={userPreferences.sharedLinks.enabled} color="primary" />
                </Field>
                <Field readOnly label={$t('show_supporter_badge')}>
                  <Switch checked={userPreferences.purchase.showSupportBadge} color="primary" />
                </Field>
                <Field readOnly label={$t('tags')}>
                  <Switch checked={userPreferences.tags.enabled} color="primary" />
                </Field>
              </Stack>
            </div>
          </CardBody>
        </Card>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Icon icon={mdiChartPieOutline} size="1.5rem" />
              <CardTitle>{$t('storage_quota')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div>
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
