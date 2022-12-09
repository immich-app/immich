import { Asset } from './asset';
import { User } from './user';

export interface Tag {
  id: string;
  type: TagType;
  name: string;
  userId: string;
  renameTagId?: string;
  assets?: Asset[];
  user?: User;
}

export enum TagType {
  /**
   * Tag that is detected by the ML model for object detection will use this type
   */
  OBJECT = 'OBJECT',

  /**
   * Face that is detected by the ML model for facial detection (TBD/NOT YET IMPLEMENTED) will use this type
   */
  FACE = 'FACE',

  /**
   * Tag that is created by the user will use this type
   */
  CUSTOM = 'CUSTOM',
}
