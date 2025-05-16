<script lang="ts">
  import { t } from 'svelte-i18n';
</script>

<div class="mt-4 text-sm">
  <h4>{$t('other_variables').toUpperCase()}</h4>
</div>

<div class="p-4 mt-2 text-xs bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-immich-dark-fg">
  <div class="flex gap-[50px]">
    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('filename').toUpperCase()}</p>
      <ul>
        <li>{`{{filename}}`} - IMG_123</li>
        <li>{`{{ext}}`} - jpg</li>
      </ul>
    </div>

    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary">{$t('filetype').toUpperCase()}</p>
      <ul>
        <li>{`{{filetype}}`} - VID or IMG</li>
        <li>{`{{filetypefull}}`} - VIDEO or IMAGE</li>
      </ul>
    </div>
    <div>
      <p class="font-medium text-immich-primary dark:text-immich-dark-primary uppercase">{$t('other').toUpperCase()}</p>
      <ul>
        <li>{`{{assetId}}`} - Asset ID</li>
        <li>{`{{assetIdShort}}`} - Asset ID (last 12 characters)</li>
        <li>{`{{album}}`} - Album Name</li>
        <li>
          {`{{album-startDate-x}}`} - Album Start Date and Time (e.g. album-startDate-yy).
          {$t('admin.storage_template_date_time_sample', { values: { date: '2021-12-31T05:32:41.750' } })}
        </li>
        <li>
          {`{{album-endDate-x}}`} - Album End Date and Time (e.g. album-endDate-MM).
          {$t('admin.storage_template_date_time_sample', { values: { date: '2023-05-06T09:15:17.100' } })}
        </li>
      </ul>
    </div>
  </div>
</div>
