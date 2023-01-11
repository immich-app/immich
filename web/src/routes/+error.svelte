<script>
	import { page } from '$app/stores';
</script>

<div class="h-screen w-screen  flex place-items-center place-content-center flex-col">
	<div class="min-w-[500px] max-w-[95vw]  bg-gray-300 rounded-2xl my-4 p-4">
		<code class="text-xs text-red-500">Error code {$page.status}</code>
		<br />
		<code class="text-sm">
			{$page.error?.message}
		</code>
		<br />
		<div class="mt-5">
			<p class="text-sm font-medium">Verbose</p>
			<pre class="text-xs">{JSON.stringify($page.error)}</pre>
		</div>

		<a
			href="https://github.com/immich-app/immich/issues/new/choose"
			target="_blank"
			rel="noopener noreferrer"
		>
			<button
				class="px-5 py-2 rounded-lg text-sm mt-6 bg-immich-primary text-white hover:bg-immich-primary/75"
				>Get help</button
			>
		</a>
	</div>
</div>
