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
        <path
          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
        />
      </svg>
    </div>
    <div class="text">
      <h3>Step 1: Export from Google Photos</h3>
      <p>Click below to open Google Takeout with Google Photos pre-selected</p>
    </div>
  </div>

  <Button onclick={openTakeout} color="primary" class="takeout-button">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
      <path
        fill-rule="evenodd"
        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
        clip-rule="evenodd"
      />
      <path
        fill-rule="evenodd"
        d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
        clip-rule="evenodd"
      />
    </svg>
    Open Google Takeout
  </Button>

  <div class="instructions">
    <h4>Configure these settings in Google Takeout:</h4>

    <div class="setting-group">
      <div class="setting-number">1</div>
      <div class="setting-content">
        <div class="setting-label">Destination</div>
        <div class="setting-value">
          <strong>Add to Drive</strong> (recommended)
        </div>
        <div class="setting-hint">
          Files will be added to your Google Drive and you'll receive an email with the link. This allows direct import
          without downloading.
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-number">2</div>
      <div class="setting-content">
        <div class="setting-label">Frequency</div>
        <div class="setting-value">
          <strong>Export once</strong>
        </div>
        <div class="setting-hint">
          Creates a single export. Choose "Export every 2 months" only if you want recurring backups.
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-number">3</div>
      <div class="setting-content">
        <div class="setting-label">File type</div>
        <div class="setting-value">
          <strong>.zip</strong>
        </div>
        <div class="setting-hint">ZIP files can be opened on almost any computer. Do not use .tgz format.</div>
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-number">4</div>
      <div class="setting-content">
        <div class="setting-label">File size</div>
        <div class="setting-value">
          <strong>50 GB</strong>
        </div>
        <div class="setting-hint">
          Larger size = fewer files to manage. Your export may still be split into multiple files if your library
          exceeds this size.
        </div>
      </div>
    </div>

    <p class="note">
      <strong>Processing time:</strong> Google may take several hours (or days for very large libraries) to prepare your export.
      You'll receive an email when it's ready.
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

  .setting-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.875rem;
    background: var(--immich-bg-hover);
    border-radius: 0.5rem;
  }

  .setting-number {
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--immich-primary);
    color: white;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: 50%;
  }

  .setting-content {
    flex: 1;
    min-width: 0;
  }

  .setting-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--immich-fg-muted);
    margin-bottom: 0.25rem;
  }

  .setting-value {
    font-size: 0.9375rem;
    color: var(--immich-fg);
    margin-bottom: 0.25rem;
  }

  .setting-hint {
    font-size: 0.8125rem;
    color: var(--immich-fg-muted);
    line-height: 1.4;
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
