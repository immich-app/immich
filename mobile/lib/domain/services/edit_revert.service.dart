import 'dart:async';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';

/// Handles an edit that was reverted in Photos. The local was uploaded as an edit
/// before but isn't edited now, so flip the stack primary back to the original (via
/// prior_remote_id) and mark it handled so we don't re-upload the reverted render.
/// Nothing is trashed; all the edits stay in the stack.
class EditRevertService {
  final NativeSyncApi _nativeSyncApi;
  final DriftStackRepository _stackRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final AssetApiRepository _assetApiRepository;
  final _log = Logger('EditRevertService');

  EditRevertService({
    required this._nativeSyncApi,
    required this._stackRepository,
    required this._localAssetRepository,
    required this._assetApiRepository,
  });

  /// Returns true if the asset was a revert and was handled (caller skips the
  /// upload); false to fall through to the normal upload path.
  Future<bool> tryHandleRevert(LocalAsset asset) async {
    if (asset.priorRemoteId == null) {
      return false;
    }

    // Only "not edited" is a revert. `edited` is a fresh edit, so let the pair flow
    // take it. `unknown` means we couldn't read the adjustment (offloaded to iCloud,
    // network off); bail there too instead of mistaking an unreadable edit for a
    // revert and flipping the stack. Network off keeps this a cheap offline read.
    try {
      final editState = await _nativeSyncApi
          .getEditState(asset.id, allowNetworkAccess: false)
          .timeout(const Duration(seconds: 30));
      if (editState != EditState.notEdited) {
        return false;
      }
    } catch (error, stack) {
      _log.warning("edit-state probe failed for ${asset.id}", error, stack);
      return false;
    }

    // It's a revert. Styled photos hit this path because iOS re-encodes the revert to
    // fresh bytes, so it looks like a new backup candidate and reaches upload.
    // Non-styled reverts hash back to the base instead, aren't candidates, and get
    // flipped at hash time in HashService._reconcileReverts. Fresh bytes match nothing
    // remote, so flip by structure: prior_remote_id is the current primary (the latest
    // edit), flip it back to the base.
    final String stackId;
    final String baseId;
    try {
      final foundStack = await _stackRepository.findStackIdByRemoteId(asset.priorRemoteId!);
      if (foundStack == null) {
        return false;
      }
      final base = await _stackRepository.findStackBaseId(foundStack, excludeId: asset.priorRemoteId!);
      if (base == null) {
        return false;
      }
      stackId = foundStack;
      baseId = base;
    } catch (error, stack) {
      _log.warning("revert stack lookup failed for ${asset.id}", error, stack);
      return false;
    }

    try {
      await _assetApiRepository.setStackPrimary(stackId, baseId);
    } catch (error, stack) {
      _log.warning("revert primary flip failed for ${asset.id}", error, stack);
      return false;
    }

    // The server flip is what makes the revert handled. If the local writes fail,
    // returning false would upload the reverted render as a brand-new edit — the
    // opposite of the user's action — so log and let checkpoint sync heal local state.
    try {
      await _stackRepository.setPrimary(stackId, baseId);
      await _localAssetRepository.markSynced(asset.id, priorRemoteId: baseId, syncedChecksum: asset.checksum);
    } catch (error, stack) {
      _log.warning("revert local reconcile failed for ${asset.id}", error, stack);
    }

    return true;
  }
}
