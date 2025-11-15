// Preset workflow templates for common use cases
export interface WorkflowTemplate {
  name: string;
  description: string;
  triggerType: 'AssetCreate' | 'PersonRecognized';
  enabled: boolean;
  filters: Array<{ filterId: string; filterConfig?: object }>;
  actions: Array<{ actionId: string; actionConfig?: object }>;
}

// Note: These templates use placeholder filter/action IDs that need to be resolved
// from the actual plugin data at runtime
export const workflowTemplates = {
  archiveOldPhotos: {
    name: 'Archive Old Photos',
    description: 'Automatically archive photos matching certain criteria',
    triggerType: 'AssetCreate' as const,
    enabled: false,
    filters: [
      // This will need to be populated with actual filter IDs from plugins
    ],
    actions: [
      // This will need to be populated with actual action IDs from plugins
    ],
  },
  favoritePhotos: {
    name: 'Auto-Favorite Photos',
    description: 'Automatically mark photos as favorites based on criteria',
    triggerType: 'AssetCreate' as const,
    enabled: false,
    filters: [],
    actions: [],
  },
  addToAlbum: {
    name: 'Add to Album',
    description: 'Automatically add assets to a specific album',
    triggerType: 'AssetCreate' as const,
    enabled: false,
    filters: [],
    actions: [],
  },
  blank: {
    name: 'New Workflow',
    description: '',
    triggerType: 'AssetCreate' as const,
    enabled: true,
    filters: [],
    actions: [],
  },
};

export type WorkflowTemplateName = keyof typeof workflowTemplates;
