<script lang="ts">
  import StatisticsTable from './StatisticsTable.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    cities: Array<{
      city: string | null;
      count: number;
    }>;
    countries: Array<{
      country: string | null;
      count: number;
    }>;
    getCitySearchUrl: (city: string | null) => string;
    getCountrySearchUrl: (country: string | null) => string;
  }

  let { cities, countries, getCitySearchUrl, getCountrySearchUrl }: Props = $props();

  const cityItems = $derived.by(() =>
    cities.map((city) => ({
      label: city.city ?? $t('unknown'),
      value: city.count,
      href: getCitySearchUrl(city.city),
    })),
  );

  const countryItems = $derived.by(() =>
    countries.map((country) => ({
      label: country.country ?? $t('unknown'),
      value: country.count,
      href: getCountrySearchUrl(country.country),
    })),
  );
</script>

<section class="grid items-stretch gap-6 xl:grid-cols-2">
  {#if cities.length > 0}
    <StatisticsTable
      title={`Top ${$t('city')}`}
      subtitle={`${$t('city')} hotspots`}
      items={cityItems}
      mainColumnLabel={$t('city')}
    />
  {/if}

  {#if countries.length > 0}
    <StatisticsTable
      title={`Top ${$t('country')}`}
      subtitle={`${$t('country')} hotspots`}
      items={countryItems}
      mainColumnLabel={$t('country')}
    />
  {/if}
</section>
