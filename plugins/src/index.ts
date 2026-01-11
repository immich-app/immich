const { updateAsset, addAssetToAlbum } = Host.getFunctions();

function parseInput() {
  return JSON.parse(Host.inputString());
}

function returnOutput(output: any) {
  Host.outputString(JSON.stringify(output));
  return 0;
}

export function filterPerson() {
  const input = parseInput();

  const { data, config } = input;
  const { personIds, matchMode } = config;

  const faces = data.faces || [];

  if (faces.length === 0) {
    return returnOutput({ passed: false });
  }

  const assetPersonIds: string[] = faces
    .filter((face: { personId: string | null }) => face.personId !== null)
    .map((face: { personId: string }) => face.personId);

  let passed = false;

  if (!personIds || personIds.length === 0) {
    passed = true;
  } else if (matchMode === 'any') {
    passed = personIds.some((id: string) => assetPersonIds.includes(id));
  } else if (matchMode === 'all') {
    passed = personIds.every((id: string) => assetPersonIds.includes(id));
  } else if (matchMode === 'exact') {
    const uniquePersonIds = new Set(personIds);
    const uniqueAssetPersonIds = new Set(assetPersonIds);

    passed =
      uniquePersonIds.size === uniqueAssetPersonIds.size &&
      personIds.every((id: string) => uniqueAssetPersonIds.has(id));
  }

  return returnOutput({ passed });
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
