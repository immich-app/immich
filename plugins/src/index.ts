const { updateAsset, addAssetToAlbum, getFacesForAsset } = Host.getFunctions();

function parseInput() {
  return JSON.parse(Host.inputString());
}

function returnOutput(output: any) {
  Host.outputString(JSON.stringify(output));
  return 0;
}

/**
 * Filter by person - checks if the recognized person matches the configured person IDs.
 *
 * For PersonRecognized trigger:
 * - data.personId contains the ID of the person that was just recognized
 * - Checks if personId is in the configured list
 *
 * matchMode options:
 * - 'any': passes if the triggering person is in the list
 * - 'all': passes if all configured persons are present in the asset
 * - 'exact': passes if the asset contains exactly the configured persons
 */
export function filterPerson() {
  const input = parseInput();
  const { authToken, data, config } = input;
  const { personIds, matchMode = 'any' } = config;

  if (!personIds || personIds.length === 0) {
    return returnOutput({ passed: true });
  }

  const triggerPersonId = data.personId;

  if (matchMode === 'any') {
    const passed = triggerPersonId && personIds.includes(triggerPersonId);
    return returnOutput({ passed });
  }

  const payload = Memory.fromJsonObject({
    authToken,
    assetId: data.asset.id,
  });

  const resultPtr = getFacesForAsset(payload.offset);
  payload.free();

  const faces = JSON.parse(Memory.find(resultPtr).readJsonObject());

  const assetPersonIds: string[] = faces
    .filter((face: { personId: string | null }) => face.personId !== null)
    .map((face: { personId: string }) => face.personId);

  let passed = false;

  if (matchMode === 'all') {
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
    }),
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
    }),
  );

  updateAsset(ptr.offset);
  ptr.free();

  return returnOutput({ success: true });
}
