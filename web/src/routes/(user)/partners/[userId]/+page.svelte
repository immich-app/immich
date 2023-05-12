<script lang="ts">
	import type { PageData } from './$types';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';

	export let data: PageData;
</script>

<UserPageLayout user={data.user} title="{data.partner.firstName} {data.partner.lastName}'s Photos">
	<AssetGrid user={data.partner} />
</UserPageLayout>
