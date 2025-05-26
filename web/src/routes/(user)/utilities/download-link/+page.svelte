<script lang="ts">
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();

  const baseURL = 'https://github.com/immich-app/immich/releases/';
  const APKs = [
    'app-arm64-v8a-release.apk',
    'app-armeabi-v7a-release.apk',
    'app-release.apk',
    'app-x86_64-release.apk',
  ];

  const downloadBaseURL = new URL('download/' + data.version + '/', baseURL);
</script>

<h1>GitHub Releases Page:</h1>
<a href={baseURL} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer">
  {data.version}
  GitHub
</a>
<br />
<br />
<div>
  <h1>Android APKs:</h1>
  {#each APKs as apk (apk)}
    <a href={downloadBaseURL + apk} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer">
      {data.version}
      {apk}
    </a>
    <br />
  {/each}
</div>
<br />
<div>
  <h1>Docker Files:</h1>
  <a
    href={downloadBaseURL + '/docker-compose.yml'}
    class="underline text-sm immich-form-label"
    target="_blank"
    rel="noreferrer"
  >
    {data.version} docker-compose
  </a>
</div>
