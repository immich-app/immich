const { updateAsset, addAssetToAlbum } = Host.getFunctions();

function parseInput() {
  return JSON.parse(Host.inputString());
}

function returnOutput(output: any) {
  Host.outputString(JSON.stringify(output));
  return 0;
}

export function filterFileName() {
  const input = parseInput();
  const { data, config } = input;
  const { pattern, matchType = 'contains', caseSensitive = false } = config;

  const fileName = data.asset.originalFileName || data.asset.fileName || '';
  const searchName = caseSensitive ? fileName : fileName.toLowerCase();
  const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

  let passed = false;

  if (matchType === 'exact') {
    passed = searchName === searchPattern;
  } else if (matchType === 'regex') {
    const flags = caseSensitive ? '' : 'i';
    const regex = new RegExp(searchPattern, flags);
    passed = regex.test(fileName);
  } else {
    // contains
    passed = searchName.includes(searchPattern);
  }

  return returnOutput({ passed });
}

export function actionAddToAlbum() {
  const input = parseInput();
  const { authToken, config, data } = input;
  const { albumId } = config;

  const ptr = Memory.fromString(
    JSON.stringify({
      authToken,
      assetId: data.asset.id,
      albumId: albumId,
    })
  );

  addAssetToAlbum(ptr.offset);
  ptr.free();

  return returnOutput({ success: true });
}

export function actionArchive() {
  const input = parseInput();
  const { authToken, data } = input;
  const ptr = Memory.fromString(
    JSON.stringify({
      authToken,
      id: data.asset.id,
      visibility: 'archive',
    })
  );

  updateAsset(ptr.offset);
  ptr.free();

  return returnOutput({ success: true });
}
