import type { LibraryResponseDto } from '@api';

export type OnShowContextMenu = {
  showlibrarycontextmenu: OnShowContextMenuDetail;
};

export type OnClick = {
  click: OnClickDetail;
};

export type OnShowContextMenuDetail = { x: number; y: number };
export type OnClickDetail = LibraryResponseDto;
