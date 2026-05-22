import { WorkflowTrigger, type WorkflowStepDto } from '@immich/sdk';
import { mdiMonitorScreenshot } from '@mdi/js';

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStepDto[];
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Archive screenshots to album',
    description: 'Add uploads with "screenshot" in the filename to an album and archive them',
    icon: mdiMonitorScreenshot,
    trigger: WorkflowTrigger.AssetCreate,
    steps: [
      {
        method: 'immich-plugin-core#assetFileFilter',
        config: {
          pattern: 'screenshot',
          matchType: 'contains',
          caseSensitive: false,
        },
      },
      {
        method: 'immich-plugin-core#assetAddToAlbums',
        config: { albumIds: [] },
      },
      {
        method: 'immich-plugin-core#assetArchive',
        config: { inverse: false },
      },
    ],
  },
];
