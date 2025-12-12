import type { MenuItem } from '@immich/ui';
import type { HTMLAttributes } from 'svelte/elements';

export type ActionItem = MenuItem & { props?: Omit<HTMLAttributes<HTMLElement>, 'color'> };
