import type { AlbumResponseDto } from '@api';

export type OnShowContextMenu = {
	showalbumcontextmenu: OnShowContextMenuDetail;
};

export type OnClick = {
	click: OnClickDetail;
};

export type OnShowContextMenuDetail = { x: number; y: number };
export type OnClickDetail = AlbumResponseDto;
