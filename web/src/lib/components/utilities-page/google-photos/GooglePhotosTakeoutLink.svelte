<script lang="ts">
  import { Button } from '@immich/ui';

  const TAKEOUT_URL = 'https://takeout.google.com/settings/takeout/custom/photos';

  function openTakeout() {
    window.open(TAKEOUT_URL, 'google-takeout', 'width=900,height=700,menubar=no,toolbar=no');
  }
</script>

<div class="takeout-link-container">
  <div class="header">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
      </svg>
    </div>
    <div class="text">
      <h3>Step 1: Export from Google Photos</h3>
      <p>Click below to open Google Takeout with Google Photos pre-selected</p>
    </div>
  </div>

  <Button onclick={openTakeout} color="primary" class="takeout-button">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
      <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
      <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
    </svg>
    Open Google Takeout
  </Button>

  <div class="instructions">
    <h4>Quick settings to select in Google Takeout:</h4>
    <ul>
      <li><strong>File type:</strong> .zip</li>
      <li><strong>Frequency:</strong> Export once</li>
      <li><strong>File size:</strong> 50 GB (fewer files to manage)</li>
      <li>
        <strong>Destination:</strong>
        <ul>
          <li><em>Add to Drive</em> — for automatic import (recommended)</li>
          <li><em>Send download link via email</em> — for manual upload</li>
        </ul>
      </li>
    </ul>
    <p class="note">
      <strong>Note:</strong> Google may take several hours to prepare large photo libraries.
      You'll receive an email when your export is ready.
    </p>
  </div>
</div>

<style>
  .takeout-link-container {
    background: var(--immich-bg);
    border: 1px solid var(--immich-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .icon {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #4285f4;
    color: white;
    border-radius: 0.5rem;
  }

  .icon svg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .text h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .text p {
    margin: 0;
    color: var(--immich-fg-muted);
    font-size: 0.875rem;
  }

  :global(.takeout-button) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .instructions {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--immich-border);
  }

  .instructions h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .instructions ul {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--immich-fg-muted);
    font-size: 0.875rem;
  }

  .instructions li {
    margin-bottom: 0.5rem;
  }

  .instructions ul ul {
    margin-top: 0.5rem;
    padding-left: 1rem;
    list-style-type: circle;
  }

  .note {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--immich-bg-hover);
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    color: var(--immich-fg-muted);
  }
</style>
