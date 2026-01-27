<script lang="ts">
  import { Card, CardBody, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<Text size="small">{$t('other_variables')}</Text>

<Card class="mt-2 text-sm bg-light-50 shadow-none">
  <CardBody>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('filename')}</Text>
        <ul>
          <li>{`{{filename}}`} - IMG_123</li>
          <li>{`{{ext}}`} - jpg</li>
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('filetype')}</Text>
        <ul>
          <li>{`{{filetype}}`} - VID or IMG</li>
          <li>{`{{filetypefull}}`} - VIDEO or IMAGE</li>
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('camera')}</Text>
        <ul>
          <li>{`{{make}}`} - FUJIFILM</li>
          <li>{`{{model}}`} - X-T50</li>
          <li>{`{{lensModel}}`} - XF27mm F2.8 R WR</li>
        </ul>
      </div>

      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('album')}</Text>
        <ul>
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
      <div>
        <Text fontWeight="medium" size="tiny" color="primary" class="mb-1">{$t('other')}</Text>
        <ul>
          <li>{`{{assetId}}`} - Asset ID</li>
          <li>{`{{assetIdShort}}`} - Asset ID (last 12 characters)</li>
        </ul>
      </div>
    </div>
  </CardBody>
</Card>
