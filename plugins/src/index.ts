const { updateAsset } = Host.getFunctions();

export function archiveAssetAction() {
  const event = JSON.parse(Host.inputString());
  const ptr = Memory.fromString(
    JSON.stringify({
      id: event.asset.id,
      visibility: 'archive',
    })
  );

  updateAsset(ptr.offset);

  ptr.free();
  return 0;
}
