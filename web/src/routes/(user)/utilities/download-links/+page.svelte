<script lang="ts">
  import type { PageProps } from './$types';
  // load data (specifically version) from `+page.ts`
  const { data }: PageProps = $props();
  // initialize constants, apks and docker files are arrays so we can iterate later
  // files should not have slashes in front (eg. `app-release.apk` not `/app-release.apk`)
  const baseURL = 'https://github.com/immich-app/immich/releases/';
  const APKs = [
    'app-arm64-v8a-release.apk',
    'app-armeabi-v7a-release.apk',
    'app-release.apk',
    'app-x86_64-release.apk',
  ];
  const dockerFiles = ['docker-compose.yml', 'example.env', 'hwaccel.ml.yml', 'hwaccel.transcoding.yml'];
  const prometheus = 'prometheus.yml';

  const downloadBaseURL = new URL('download/' + data.version + '/', baseURL);
</script>

<div>
  <h1>GitHub Releases Page:</h1>
  <a href={baseURL} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer">
    {data.version}
    GitHub
  </a>
  <br />
  <br />
</div>
<div>
  <h1>Android APKs:</h1>
  {#each APKs as file (file)}
    <a href={downloadBaseURL + file} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer">
      {data.version}
      {file}
    </a>
    <br />
  {/each}
</div>
<br />
<div>
  <h1>Docker Files:</h1>
  {#each dockerFiles as file (file)}
    <a href={downloadBaseURL + file} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer">
      {data.version}
      {file}
    </a>
    <br />
  {/each}
  <a href={downloadBaseURL + prometheus} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer">
    {data.version}
    {prometheus}
  </a>
</div>
