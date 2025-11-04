const { updateAsset, addAssetToAlbum } = Host.getFunctions();

// Helper to parse input
function parseInput() {
  return JSON.parse(Host.inputString());
}

// Helper to return output
function returnOutput(output: any) {
  Host.outputString(JSON.stringify(output));
  return 0;
}

// Triggers
export function trigger_asset_uploaded() {
  const input = parseInput();
  // Triggers just validate/transform input, typically pass through
  return returnOutput({ valid: true, context: input.context });
}

export function trigger_person_recognized() {
  const input = parseInput();
  return returnOutput({ valid: true, context: input.context });
}

// Filters
export function filter_filename() {
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

export function filter_filetype() {
  const input = parseInput();
  const { context, config } = input;
  const { fileTypes } = config;

  const assetType = context.asset.type;
  const passed = fileTypes.includes(assetType);

  return returnOutput({ passed, context });
}

export function filter_person_name() {
  const input = parseInput();
  const { context, config } = input;
  const { personNames, matchAny = true } = config;

  // Assuming context.person or context.asset.persons exists
  const detectedNames = context.person?.name
    ? [context.person.name]
    : (context.asset?.persons || []).map((p: any) => p.name);

  let passed = false;
  if (matchAny) {
    // Match if any of the person names is in the detected names
    passed = personNames.some((name: string) => detectedNames.includes(name));
  } else {
    // Match if all person names are in the detected names
    passed = personNames.every((name: string) => detectedNames.includes(name));
  }

  return returnOutput({ passed, context });
}

// Actions
export function action_archive() {
  const input = parseInput();
  const { context } = input;

  const ptr = Memory.fromString(
    JSON.stringify({
      id: context.asset.id,
      isArchived: true,
    })
  );

  updateAsset(ptr.offset);
  ptr.free();

  return returnOutput({ success: true, context });
}

export function action_favorite() {
  const input = parseInput();
  const { context, config } = input;
  const { favorite = true } = config;

  const ptr = Memory.fromString(
    JSON.stringify({
      id: context.asset.id,
      isFavorite: favorite,
    })
  );

  updateAsset(ptr.offset);
  ptr.free();

  return returnOutput({ success: true, context });
}

export function action_add_to_album() {
  const input = parseInput();
  const { context, config } = input;
  const { albumId } = config;

  const ptr = Memory.fromString(
    JSON.stringify({
      assetId: context.asset.id,
      albumId: albumId,
    })
  );

  addAssetToAlbum(ptr.offset);
  ptr.free();

  return returnOutput({ success: true, context });
}

// Legacy function for backwards compatibility
export function archiveAssetAction() {
  const event = parseInput();
  const ptr = Memory.fromString(
    JSON.stringify({
      id: event.asset.id,
      isArchived: true,
    })
  );

  updateAsset(ptr.offset);
  ptr.free();
  return 0;
}
