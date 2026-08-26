import { parseAlbumNameGroup } from '$lib/utils/album-name-group';

describe('parseAlbumNameGroup', () => {
  it('groups by the first segment before the delimiter', () => {
    expect(parseAlbumNameGroup('旅游-日本', '-')).toBe('旅游');
    expect(parseAlbumNameGroup('游戏-黑神话-DLC', '-')).toBe('游戏');
    expect(parseAlbumNameGroup('游戏/黑神话悟空', '/')).toBe('游戏');
  });

  it('uses the full name when there is no delimiter, so prefixes share a group', () => {
    expect(parseAlbumNameGroup('日常随拍', '-')).toBe('日常随拍');
    expect(parseAlbumNameGroup('aigc', '-')).toBe('aigc');
    expect(parseAlbumNameGroup('aigc-videos', '-')).toBe('aigc');
  });

  it('returns undefined when the prefix is empty', () => {
    expect(parseAlbumNameGroup('-日本', '-')).toBeUndefined();
    expect(parseAlbumNameGroup('  -日本', '-')).toBeUndefined();
    expect(parseAlbumNameGroup(' ', '-')).toBeUndefined();
  });

  it('trims whitespace around the prefix', () => {
    expect(parseAlbumNameGroup('旅游 - 日本', '-')).toBe('旅游');
  });

  it('falls back to "-" when the delimiter is empty', () => {
    expect(parseAlbumNameGroup('旅游-日本', '')).toBe('旅游');
    expect(parseAlbumNameGroup('旅游-日本')).toBe('旅游');
  });
});
