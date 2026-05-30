import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

/// The quality at which an asset is shared.
enum ShareAssetQuality {
  /// Share the full original file. Read from the device when available,
  /// otherwise downloaded from the server.
  original,

  /// Share the server-generated JPEG preview. Smaller and faster to send, and
  /// never exposes the original (e.g. RAW) file.
  preview,
}

/// Where the bytes of a shared asset are obtained from.
enum ShareSourceKind {
  /// Read the original file directly from the device.
  localFile,

  /// Download the full original file from the server.
  remoteOriginal,

  /// Download the server-generated JPEG preview from the server.
  remotePreview,
}

/// Resolved instruction describing how a single asset should be shared.
///
/// This is a plain value object produced by [resolveShareSource] so that the
/// decision of *what* to share can be unit-tested independently from the side
/// effects of actually reading/downloading and handing the file to the OS share
/// sheet.
class ShareSource {
  final ShareSourceKind kind;

  /// Device asset id, set when [kind] is [ShareSourceKind.localFile].
  final String? localId;

  /// Server asset id, set when [kind] requires a download.
  final String? remoteId;

  const ShareSource._({required this.kind, this.localId, this.remoteId});

  const ShareSource.localFile(String id) : this._(kind: ShareSourceKind.localFile, localId: id);

  const ShareSource.remoteOriginal(String id) : this._(kind: ShareSourceKind.remoteOriginal, remoteId: id);

  const ShareSource.remotePreview(String id) : this._(kind: ShareSourceKind.remotePreview, remoteId: id);

  /// Whether the file is read from the device instead of downloaded.
  bool get isLocal => kind == ShareSourceKind.localFile;

  /// Whether the JPEG preview (rather than the original) is shared.
  bool get isPreview => kind == ShareSourceKind.remotePreview;

  /// Whether the file has to be fetched from the server.
  bool get requiresDownload => kind != ShareSourceKind.localFile;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ShareSource && other.kind == kind && other.localId == localId && other.remoteId == remoteId);

  @override
  int get hashCode => Object.hash(kind, localId, remoteId);

  @override
  String toString() => 'ShareSource(kind: $kind, localId: $localId, remoteId: $remoteId)';
}

/// Whether [asset] can be shared as a JPEG preview.
///
/// The preview is generated and stored by the server, so it only exists for
/// assets that have a remote copy. It is a still JPEG, so it only makes sense
/// for images - sharing a still frame of a video would be surprising.
bool canShareAsPreview(BaseAsset asset) => asset.isImage && asset.remoteId != null;

/// Whether offering a quality choice is meaningful for [assets].
///
/// The choice only matters when at least one asset can actually provide a JPEG
/// preview; otherwise sharing always falls back to the original and the picker
/// would be a no-op.
bool shouldOfferShareQualityChoice(Iterable<BaseAsset> assets) => assets.any(canShareAsPreview);

/// Resolves how [asset] should be shared at the requested [quality].
///
/// Handles all three asset states - local-only, remote-only and merged - and
/// degrades gracefully when the requested quality is not available:
///
///  * [ShareAssetQuality.preview] needs a remote image. For videos or
///    local-only assets it is not available, so the original is shared instead.
///  * [ShareAssetQuality.original] prefers the on-device file, but server-side
///    edits only exist remotely, so an edited asset must be downloaded.
///
/// Returns `null` when the asset can neither be read locally nor downloaded.
ShareSource? resolveShareSource(BaseAsset asset, ShareAssetQuality quality) {
  final localId = asset.localId;
  final remoteId = asset.remoteId;

  if (quality == ShareAssetQuality.preview && canShareAsPreview(asset)) {
    // canShareAsPreview guarantees a non-null remoteId.
    return ShareSource.remotePreview(remoteId!);
  }

  // Original quality.
  // The on-device file is the true original, but an edited asset only carries
  // its edits on the server, so prefer the remote copy in that case.
  if (localId != null && !asset.isEdited) {
    return ShareSource.localFile(localId);
  }

  if (remoteId != null) {
    return ShareSource.remoteOriginal(remoteId);
  }

  // Local-only asset flagged as edited: there is no remote to download from, so
  // fall back to the local file.
  if (localId != null) {
    return ShareSource.localFile(localId);
  }

  return null;
}

/// Builds the filename to use for the shared file.
///
/// Path separators are stripped to keep the name safe to write to a temporary
/// directory. Previews are always JPEG, so the extension is normalized to
/// `.jpg` (the original might be e.g. a `.CR2`/`.dng` RAW file).
String shareFilename(BaseAsset asset, ShareSource source) {
  final sanitized = asset.name.replaceAll(RegExp(r'[\\/]'), '_');
  if (!source.isPreview) {
    return sanitized;
  }

  final dotIndex = sanitized.lastIndexOf('.');
  final base = dotIndex > 0 ? sanitized.substring(0, dotIndex) : sanitized;
  return '$base.jpg';
}
