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
  const { context, config } = input;
  const { pattern, matchType = 'contains', caseSensitive = false } = config;

  const fileName =
    context.asset.originalFileName || context.asset.fileName || '';
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

  return returnOutput({ passed, context });
}

export function actionAddToAlbum() {
  console.log('Executing action action_add_to_album');
  const input = parseInput();
  const { context, config } = input;
  const { albumId } = config;

  const ptr = Memory.fromString(
    JSON.stringify({
      jwtToken: context.jwtToken,
      assetId: context.asset.id,
      albumId: albumId,
    })
  );

  addAssetToAlbum(ptr.offset);
  ptr.free();

  return returnOutput({ success: true, context });
}

export function actionArchive() {
  const input = parseInput();
  const { context } = input;
  const ptr = Memory.fromString(
    JSON.stringify({
      jwtToken: context.jwtToken,
      id: context.asset.id,
      visibility: 'archive',
    })
  );

  updateAsset(ptr.offset);
  ptr.free();

  return returnOutput({ success: true, context });
}
