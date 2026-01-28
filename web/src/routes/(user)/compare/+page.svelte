<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { formatAge } from '$lib/services/family-member.service';
  import { getFamilyMemberAgeComparison, getAssetThumbnailPath, type FamilyMemberResponseDto } from '@immich/sdk';
  import { Button, Container, HStack, Heading, Slider, Text } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let ageMonths = $state(data.initialAgeMonths);
  let loading = $state(false);
  let comparisonData: {
    age: string;
    comparisons: Array<{
      member: FamilyMemberResponseDto;
      photos: Array<{ id: string; fileCreatedAt: string }>;
      exactAge: string;
    }>;
  } | null = $state(null);

  const formatAgeLabel = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  const loadComparison = async () => {
    if (data.familyMembers.length === 0) {
      comparisonData = null;
      return;
    }

    loading = true;
    try {
      const response = await getFamilyMemberAgeComparison({
        ageMonths,
        toleranceMonths: 1,
      });
      // Parse the response - it comes back as text from the API
      comparisonData = typeof response === 'string' ? JSON.parse(response) : response;
    } catch (error) {
      console.error('Failed to load comparison:', error);
      comparisonData = null;
    } finally {
      loading = false;
    }
  };

  const incrementAge = () => {
    ageMonths = Math.min(ageMonths + 6, 216); // Max 18 years
  };

  const decrementAge = () => {
    ageMonths = Math.max(ageMonths - 6, 0); // Min 0 months
  };

  // Load comparison when age changes
  $effect(() => {
    loadComparison();
  });
</script>

<UserPageLayout title={data.meta.title}>
  <Container center size="large" class="py-8">
    <!-- Age selector -->
    <div class="mb-8 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
      <div class="mb-4 flex items-center justify-between">
        <Heading size="small">{$t('compare_at_age')}</Heading>
        <Text size="large" class="font-semibold">{formatAgeLabel(ageMonths)}</Text>
      </div>

      <div class="flex items-center gap-4">
        <Button variant="outline" onclick={decrementAge} disabled={ageMonths <= 0}>
          <Icon icon={mdiChevronLeft} size={24} />
        </Button>

        <div class="flex-1">
          <input
            type="range"
            min="0"
            max="216"
            step="1"
            bind:value={ageMonths}
            class="w-full cursor-pointer"
          />
        </div>

        <Button variant="outline" onclick={incrementAge} disabled={ageMonths >= 216}>
          <Icon icon={mdiChevronRight} size={24} />
        </Button>
      </div>

      <div class="mt-2 flex justify-between text-sm text-gray-500">
        <span>0</span>
        <span>3 years</span>
        <span>6 years</span>
        <span>9 years</span>
        <span>12 years</span>
        <span>15 years</span>
        <span>18 years</span>
      </div>
    </div>

    <!-- Comparison results -->
    {#if data.familyMembers.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <Text size="large" class="text-gray-500">{$t('no_family_members')}</Text>
        <Text size="small" class="mt-2 text-gray-400">{$t('no_family_members_description')}</Text>
      </div>
    {:else if loading}
      <div class="flex items-center justify-center py-12">
        <Text>{$t('loading')}...</Text>
      </div>
    {:else if comparisonData && comparisonData.comparisons.length > 0}
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each comparisonData.comparisons as comparison (comparison.member.id)}
          <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div class="mb-4 flex items-center gap-3">
              {#if comparison.member.color}
                <span
                  class="inline-block h-4 w-4 rounded-full"
                  style="background-color: {comparison.member.color}"
                ></span>
              {/if}
              <div>
                <Heading size="small">{comparison.member.name}</Heading>
                <Text size="small" class="text-gray-500">{comparison.exactAge}</Text>
              </div>
            </div>

            {#if comparison.photos.length > 0}
              <div class="grid grid-cols-2 gap-2">
                {#each comparison.photos.slice(0, 4) as photo (photo.id)}
                  <a
                    href="/photos/{photo.id}"
                    class="aspect-square overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
                  >
                    <img
                      src={getAssetThumbnailPath(photo.id)}
                      alt="{comparison.member.name} at {comparison.exactAge}"
                      class="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </a>
                {/each}
              </div>
              {#if comparison.photos.length > 4}
                <Text size="small" class="mt-2 text-center text-gray-500">
                  +{comparison.photos.length - 4} more photos
                </Text>
              {/if}
            {:else}
              <div class="flex h-32 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <Text size="small" class="text-gray-400">{$t('no_photos_at_age')}</Text>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <Text size="large" class="text-gray-500">{$t('no_photos_at_age')}</Text>
        <Text size="small" class="mt-2 text-gray-400">
          {$t('no_photos_at_age_description')}
        </Text>
      </div>
    {/if}
  </Container>
</UserPageLayout>
