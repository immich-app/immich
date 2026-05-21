import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

/// What to do with an edited iOS photo when backing it up.
sealed class EditPairPlan {
  const EditPairPlan();
}

/// Not something we stack: positively not edited, identical bytes, or the
/// original resource simply isn't there to recover.
class NoEditPair extends EditPairPlan {
  const NoEditPair();
}

/// Can't be decided right now: the prior upload sits in the server trash, or the
/// adjustment metadata / original couldn't be read (offloaded to iCloud, network
/// off, stalled read). Skip the asset this cycle — it stays a candidate and
/// resolves once conditions change. Uploading anyway would mark the edit synced
/// and permanently drop the original from backup.
class DeferEditPair extends EditPairPlan {
  const DeferEditPair();
}

/// Already uploaded before; stack the edit onto that remote id.
class AbsorbIntoPrior extends EditPairPlan {
  final String parentId;
  const AbsorbIntoPrior(this.parentId);
}

/// Upload the original first; [base] is its temp file.
class UploadBaseFirst extends EditPairPlan {
  final BaseResource base;
  const UploadBaseFirst(this.base);
}

/// Live photo edit: upload the original pair first (the [still] always, the [video]
/// when one survives) and stack the edited live photo onto the original still.
/// [video] is null when the original has no paired video to recover (e.g. the edit
/// turned Live off), which degrades to a still-only parent.
class UploadBaseLivePhotoFirst extends EditPairPlan {
  final BaseResource still;
  final BaseResource? video;
  const UploadBaseLivePhotoFirst(this.still, this.video);
}

/// Works out how an edited photo should stack: reuse a prior upload, upload the
/// original first, do nothing, or defer to a later cycle. Shared by the foreground
/// and background upload paths. The caller already checked it's iOS; pass
/// [isLivePhoto] for a live photo so the original pair (still + paired video) is
/// read instead of a single still.
///
/// A photo that was never edited only carries the capture-time Photographic Style,
/// which iOS stamps at [LocalAsset.createdAt]; a real edit moves [LocalAsset.adjustmentTime]
/// later. When they match (or there's no adjustment at all) there's nothing to stack, so
/// we skip the native read. Anything that moved the timestamp (edit, retime, revert) falls
/// through to [NativeSyncApi.getBaseResource] / [NativeSyncApi.getBaseLivePhoto], which read
/// the adjustment plist and decide.
Future<EditPairPlan> resolveEditPair(
  NativeSyncApi nativeSyncApi,
  LocalAsset asset, {
  required DriftStackRepository stackRepository,
  required String? ownerId,
  Logger? log,
  bool isLivePhoto = false,
}) async {
  final priorRemoteId = asset.priorRemoteId;
  if (priorRemoteId != null) {
    PriorState priorState;
    try {
      priorState = await stackRepository.priorState(priorRemoteId);
    } catch (error, stack) {
      log?.warning(() => "Failed to check prior remote $priorRemoteId for ${asset.id}", error, stack);
      return const DeferEditPair();
    }
    switch (priorState) {
      case PriorState.live:
        return AbsorbIntoPrior(priorRemoteId);
      case PriorState.trashed:
        // The prior sits in the server trash. Re-uploading the base would just
        // dedupe onto the trashed row and the edit would 400 stacking onto it
        // ("Cannot stack onto a trashed or missing asset"), so wait: restore
        // makes it live (absorb), emptying trash makes it missing (rebuild).
        return const DeferEditPair();
      case PriorState.missing:
        // No synced row for the stamp. With syncedChecksum unset a chain is
        // mid-flight and the row just hasn't synced back yet — resume onto it.
        // With syncedChecksum set the completed prior has since vanished from
        // the server (hard delete), so fall through and re-resolve from scratch.
        if (asset.syncedChecksum == null) {
          return AbsorbIntoPrior(priorRemoteId);
        }
    }
  }

  if (!_mightBeEdited(asset)) {
    return const NoEditPair();
  }

  if (isLivePhoto) {
    return _resolveLivePair(nativeSyncApi, asset, stackRepository: stackRepository, ownerId: ownerId, log: log);
  }

  BaseResource? base;
  try {
    // Native bounds each resource read (classify + still) at 120s idle; the outer
    // timeout only catches a reply that never comes back across the platform channel.
    base = await nativeSyncApi.getBaseResource(asset.id, allowNetworkAccess: true).timeout(_baseReadTimeout);
  } catch (error, stack) {
    // Transient (timeout, unreadable plist, iCloud hiccup): defer instead of
    // uploading the edit standalone, which would permanently skip the original.
    log?.warning(() => "Failed to read base resource for ${asset.id}, deferring", error, stack);
    return const DeferEditPair();
  }
  if (base == null) {
    return const NoEditPair();
  }

  // Identical bytes (e.g. auto-HDR), nothing real to stack. Drop the temp copy.
  if (base.sha1 == asset.checksum) {
    await _deleteTemp(base.path);
    return const NoEditPair();
  }

  switch (await _planForExistingBase(stackRepository, base.sha1, ownerId, log: log)) {
    case AbsorbIntoPrior(:final parentId):
      await _deleteTemp(base.path);
      return AbsorbIntoPrior(parentId);
    case DeferEditPair():
      await _deleteTemp(base.path);
      return const DeferEditPair();
    default:
      return UploadBaseFirst(base);
  }
}

/// The base bytes may already be on the server: backed up before the stamps
/// existed, by another install, or after the stamps were belt-cleared. Absorb
/// straight onto a live copy instead of re-uploading bytes the server has;
/// defer while that copy sits in the trash — uploading would just dedupe onto
/// the trashed row and the stack would 400. null = no copy, upload the base.
Future<EditPairPlan?> _planForExistingBase(
  DriftStackRepository stackRepository,
  String baseSha1,
  String? ownerId, {
  Logger? log,
}) async {
  if (ownerId == null) {
    return null;
  }
  try {
    final dup = await stackRepository.remoteByChecksum(baseSha1, ownerId);
    return switch (dup.state) {
      PriorState.live => AbsorbIntoPrior(dup.remoteId!),
      PriorState.trashed => const DeferEditPair(),
      PriorState.missing => null,
    };
  } catch (error, stack) {
    log?.warning(() => "Failed to check base checksum against synced remotes", error, stack);
    return const DeferEditPair();
  }
}

/// Reads the original pair of an edited live photo. Skips stacking when the original
/// still matches the current bytes (e.g. a video-only trim) — the base still would
/// dedupe to the edit itself on the server, so it can't be its own stack parent; the
/// edit just uploads normally. Temps are dropped on every non-stack outcome.
Future<EditPairPlan> _resolveLivePair(
  NativeSyncApi nativeSyncApi,
  LocalAsset asset, {
  required DriftStackRepository stackRepository,
  required String? ownerId,
  Logger? log,
}) async {
  BaseLivePhoto? live;
  try {
    // Up to three native reads here (classify + still + paired video), 120s idle each.
    live = await nativeSyncApi.getBaseLivePhoto(asset.id, allowNetworkAccess: true).timeout(_baseLiveReadTimeout);
  } catch (error, stack) {
    log?.warning(() => "Failed to read base live photo for ${asset.id}, deferring", error, stack);
    return const DeferEditPair();
  }
  if (live == null) {
    return const NoEditPair();
  }

  if (live.still.sha1 == asset.checksum) {
    await _deleteTemp(live.still.path);
    await _deleteTemp(live.video?.path);
    return const NoEditPair();
  }

  switch (await _planForExistingBase(stackRepository, live.still.sha1, ownerId, log: log)) {
    case AbsorbIntoPrior(:final parentId):
      await _deleteTemp(live.still.path);
      await _deleteTemp(live.video?.path);
      return AbsorbIntoPrior(parentId);
    case DeferEditPair():
      await _deleteTemp(live.still.path);
      await _deleteTemp(live.video?.path);
      return const DeferEditPair();
    default:
      return UploadBaseLivePhotoFirst(live.still, live.video);
  }
}

Future<void> _deleteTemp(String? path) async {
  if (path == null) {
    return;
  }
  try {
    await File(path).delete();
  } catch (_) {}
}

/// iOS stamps the capture-time Photographic Style at the creation time and moves the
/// adjustment timestamp on any later change. A gap past a small tolerance (capture jitter
/// is sub-second, real edits are seconds apart) is worth a native check; no adjustment at
/// all means the photo was never touched.
bool _mightBeEdited(LocalAsset asset) {
  final adjustedAt = asset.adjustmentTime;
  if (adjustedAt == null) {
    return false;
  }
  return adjustedAt.difference(asset.createdAt).inSeconds.abs() > _editTimestampToleranceSeconds;
}

const _editTimestampToleranceSeconds = 2;
// Generous on purpose: the native idle watchdog (120s without a chunk) owns
// stall detection, so these only catch a reply lost on the platform channel —
// a tight bound here would kill big-but-flowing iCloud downloads.
const _baseReadTimeout = Duration(minutes: 30);
const _baseLiveReadTimeout = Duration(minutes: 45);
