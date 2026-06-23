import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/edit_revert.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/stack.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/cloud_metadata.dart';
import 'package:immich_mobile/services/edit_pair.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;

final backgroundUploadServiceProvider = Provider((ref) {
  final service = BackgroundUploadService(
    ref.watch(uploadRepositoryProvider),
    ref.watch(storageRepositoryProvider),
    ref.watch(localAssetRepository),
    ref.watch(backupRepositoryProvider),
    ref.watch(assetMediaRepositoryProvider),
    ref.watch(nativeSyncApiProvider),
    ref.watch(editRevertServiceProvider),
    ref.watch(driftStackProvider),
  );

  ref.onDispose(service.dispose);
  return service;
});

/// Which hop of an iOS edit chain a background task is, so its completion knows
/// what to enqueue next. A live-photo edit runs all four hops; a plain photo edit
/// is the two-still chain baseStill -> editStill. none = a normal upload.
enum LiveEditPhase { none, baseVideo, baseStill, editVideo, editStill }

/// Metadata for upload tasks to track live photo handling
class UploadTaskMetadata {
  final String localAssetId;

  // Legacy live-photo auto-chain trigger (video upload -> enqueue its still), not
  // a media-type flag; edit-chain hops keep it false. livePhotoVideoId is no
  // longer written but stays so persisted task metadata keeps decoding.
  final bool isLivePhotos;
  final String livePhotoVideoId;

  // Path of the temp/cache file backing this task, so it can be cleaned up on a
  // terminal status.
  final String basePath;

  // Edit chain state: which hop this is, the base still temp path (carried by the
  // base video so its completion can enqueue the base still), the base still remote
  // id threaded to the edit still as its stackParentId, and the local checksum at
  // task-build time so a re-edit racing this upload can't be marked synced.
  final LiveEditPhase liveEditPhase;
  final String baseStillPath;
  final String pendingStackParentId;
  final String? checksum;

  // The dead prior a rebuild chain is replacing (prior pointed at a hard-deleted
  // remote at plan time). Lets the base junctions tell a rebuild in progress
  // (row prior still == this) from a replayed completion (prior re-stamped).
  final String stalePriorId;

  const UploadTaskMetadata({
    required this.localAssetId,
    this.isLivePhotos = false,
    this.livePhotoVideoId = '',
    this.basePath = '',
    this.liveEditPhase = LiveEditPhase.none,
    this.baseStillPath = '',
    this.pendingStackParentId = '',
    this.checksum,
    this.stalePriorId = '',
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'localAssetId': localAssetId,
      'isLivePhotos': isLivePhotos,
      'livePhotoVideoId': livePhotoVideoId,
      'basePath': basePath,
      'liveEditPhase': liveEditPhase.name,
      'baseStillPath': baseStillPath,
      'pendingStackParentId': pendingStackParentId,
      'checksum': checksum,
      'stalePriorId': stalePriorId,
    };
  }

  factory UploadTaskMetadata.fromMap(Map<String, dynamic> map) {
    return UploadTaskMetadata(
      localAssetId: map['localAssetId'] as String,
      isLivePhotos: (map['isLivePhotos'] as bool?) ?? false,
      livePhotoVideoId: (map['livePhotoVideoId'] as String?) ?? '',
      basePath: (map['basePath'] as String?) ?? '',
      liveEditPhase: LiveEditPhase.values.asNameMap()[map['liveEditPhase'] as String?] ?? LiveEditPhase.none,
      baseStillPath: (map['baseStillPath'] as String?) ?? '',
      pendingStackParentId: (map['pendingStackParentId'] as String?) ?? '',
      checksum: map['checksum'] as String?,
      stalePriorId: (map['stalePriorId'] as String?) ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory UploadTaskMetadata.fromJson(String source) =>
      UploadTaskMetadata.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'UploadTaskMetadata(localAssetId: $localAssetId, isLivePhotos: $isLivePhotos, livePhotoVideoId: $livePhotoVideoId, basePath: $basePath, liveEditPhase: $liveEditPhase, baseStillPath: $baseStillPath, pendingStackParentId: $pendingStackParentId, checksum: $checksum, stalePriorId: $stalePriorId)';

  @override
  bool operator ==(covariant UploadTaskMetadata other) {
    if (identical(this, other)) {
      return true;
    }

    return other.localAssetId == localAssetId &&
        other.isLivePhotos == isLivePhotos &&
        other.livePhotoVideoId == livePhotoVideoId &&
        other.basePath == basePath &&
        other.liveEditPhase == liveEditPhase &&
        other.baseStillPath == baseStillPath &&
        other.pendingStackParentId == pendingStackParentId &&
        other.checksum == checksum &&
        other.stalePriorId == stalePriorId;
  }

  @override
  int get hashCode =>
      localAssetId.hashCode ^
      isLivePhotos.hashCode ^
      livePhotoVideoId.hashCode ^
      basePath.hashCode ^
      liveEditPhase.hashCode ^
      baseStillPath.hashCode ^
      pendingStackParentId.hashCode ^
      checksum.hashCode ^
      stalePriorId.hashCode;
}

/// Service for handling background uploads using iOS URLSession (background_downloader)
///
/// This service handles asynchronous background uploads that can continue
/// even when the app is suspended. Primarily used for iOS background backup.
class BackgroundUploadService {
  BackgroundUploadService(
    this._uploadRepository,
    this._storageRepository,
    this._localAssetRepository,
    this._backupRepository,
    this._assetMediaRepository,
    this._nativeSyncApi,
    this._editRevertService,
    this._stackRepository,
  ) {
    _uploadRepository.onUploadStatus = _onUploadCallback;
    _uploadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  final UploadRepository _uploadRepository;
  final StorageRepository _storageRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftBackupRepository _backupRepository;
  final AssetMediaRepository _assetMediaRepository;
  final NativeSyncApi _nativeSyncApi;
  final EditRevertService _editRevertService;
  final DriftStackRepository _stackRepository;
  final Logger _logger = Logger('BackgroundUploadService');

  final StreamController<TaskStatusUpdate> _taskStatusController = StreamController<TaskStatusUpdate>.broadcast();
  final StreamController<TaskProgressUpdate> _taskProgressController = StreamController<TaskProgressUpdate>.broadcast();

  Stream<TaskStatusUpdate> get taskStatusStream => _taskStatusController.stream;
  Stream<TaskProgressUpdate> get taskProgressStream => _taskProgressController.stream;

  bool shouldAbortQueuingTasks = false;

  // Burst ids whose gated members have already been re-enqueued this session, so
  // the re-enqueue fires exactly once per burst no matter which frame's
  // completion triggers it (and never double-enqueues in-flight members).
  final Set<String> _reenqueuedBurstIds = {};

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    if (!_taskProgressController.isClosed) {
      _taskProgressController.add(update);
    }
  }

  void _onUploadCallback(TaskStatusUpdate update) {
    if (!_taskStatusController.isClosed) {
      _taskStatusController.add(update);
    }
    _handleTaskStatusUpdate(update);
  }

  void dispose() {
    _taskStatusController.close();
    _taskProgressController.close();
  }

  /// Enqueue tasks to the background upload queue
  Future<List<bool>> enqueueTasks(List<UploadTask> tasks) {
    return _uploadRepository.enqueueBackgroundAll(tasks);
  }

  /// Get a list of tasks that are ENQUEUED or RUNNING
  Future<List<Task>> getActiveTasks(String group) {
    return _uploadRepository.getActiveTasks(group);
  }

  /// Active tasks across every backup group. The resume gate needs this so a chain
  /// stalled mid-flight in the live/edit groups (with the normal group already empty)
  /// resumes instead of kicking off a duplicate cycle.
  Future<int> getActiveBackupTaskCount() async {
    final counts = await Future.wait([
      _uploadRepository.getActiveTasks(kBackupGroup),
      _uploadRepository.getActiveTasks(kBackupEditPairGroup),
      _uploadRepository.getActiveTasks(kBackupLivePhotoGroup),
    ]);
    return counts.fold<int>(0, (sum, tasks) => sum + tasks.length);
  }

  /// Start background upload using iOS URLSession
  ///
  /// Finds backup candidates, builds upload tasks, and enqueues them
  /// for background processing.
  Future<void> uploadBackupCandidates(String userId) async {
    await _storageRepository.clearCache();
    // Safe here: the caller only starts a fresh cycle when no tasks are active in
    // any backup group, so no pending chain still references these base temps.
    await _storageRepository.clearEditBaseCache();
    shouldAbortQueuingTasks = false;
    // Fresh cycle: let each burst's fast re-enqueue fire again (members that
    // failed last cycle can be retried by the completion-driven path).
    _reenqueuedBurstIds.clear();

    final candidates = await _backupRepository.getCandidates(userId);
    if (candidates.isEmpty) {
      _logger.info("No new backup candidates found, finishing background upload");
      return;
    }

    _logger.info("Found ${candidates.length} backup candidates for background tasks");

    final ownerId = Store.tryGet(StoreKey.currentUser)?.id;
    const batchSize = 100;
    List<UploadTask> tasks = [];

    // Walk the full candidate list until a batch is filled: deferred or
    // unbuildable assets return no task and must not starve what's behind them.
    for (final asset in candidates) {
      if (tasks.length >= batchSize || shouldAbortQueuingTasks) {
        break;
      }
      final task = await getUploadTask(asset, ownerId: ownerId);
      if (task != null) {
        tasks.add(task);
      }
    }

    if (tasks.isNotEmpty && !shouldAbortQueuingTasks) {
      _logger.info("Enqueuing ${tasks.length} background upload tasks");
      await enqueueTasks(tasks);
    }
  }

  /// Cancel all ongoing background uploads and reset the upload queue
  ///
  /// Returns the number of tasks left in the queue
  Future<int> cancel() async {
    shouldAbortQueuingTasks = true;
    _reenqueuedBurstIds.clear();

    await _storageRepository.clearCache();
    await _storageRepository.clearEditBaseCache();
    await _uploadRepository.reset(kBackupGroup);
    await _uploadRepository.reset(kBackupEditPairGroup);
    await _uploadRepository.deleteDatabaseRecords(kBackupGroup);
    await _uploadRepository.deleteDatabaseRecords(kBackupEditPairGroup);

    final activeTasks = await _uploadRepository.getActiveTasks(kBackupGroup);
    final activeEditTasks = await _uploadRepository.getActiveTasks(kBackupEditPairGroup);
    return activeTasks.length + activeEditTasks.length;
  }

  /// Resume background backup processing
  Future<void> resume() {
    return _uploadRepository.start();
  }

  void _handleTaskStatusUpdate(TaskStatusUpdate update) async {
    UploadTaskMetadata? metadata;
    if (update.task.metaData.isNotEmpty) {
      try {
        metadata = UploadTaskMetadata.fromJson(update.task.metaData);
      } catch (_) {
        metadata = null;
      }
    }

    switch (update.status) {
      case TaskStatus.complete:
        unawaited(_handleLivePhoto(update, metadata));
        unawaited(_advanceChainAndBurst(update, metadata));

        if (CurrentPlatform.isIOS) {
          try {
            final path = await update.task.filePath();
            await File(path).delete();
          } catch (e) {
            _logger.severe('Error deleting file path for iOS: $e');
          }
        }

        break;

      case TaskStatus.failed:
      case TaskStatus.canceled:
      case TaskStatus.notFound:
        unawaited(_cleanupTempResourceOnFailure(metadata));
        unawaited(_clearDeadPriorOnStack400(update, metadata));
        break;

      default:
        break;
    }
  }

  Future<void> _handleLivePhoto(TaskStatusUpdate update, UploadTaskMetadata? metadata) async {
    try {
      if (metadata == null || !metadata.isLivePhotos) {
        return;
      }

      final remoteId = _remoteIdFromResponse(update);
      if (remoteId == null) {
        return;
      }

      final localAsset = await _localAssetRepository.getById(metadata.localAssetId);
      if (localAsset == null) {
        return;
      }

      // Edited since the video task was built (redelivered completion): uploading
      // the still now would ship the edit standalone and stamp it synced. Drop —
      // the asset is a candidate and the edit chain handles it. The row itself
      // can be stale in the same window (local sync hasn't seen the edit yet),
      // so also confirm with the offline adjustment read; un-edited photos have
      // no adjustment plist, making this a cheap resources lookup.
      if (metadata.checksum != null && metadata.checksum != localAsset.checksum) {
        return;
      }
      // No positive edit evidence (null on timeout/error) → proceed like before.
      if (await _probeEditState(localAsset.id) == EditState.edited) {
        return;
      }

      final uploadTask = await getLivePhotoUploadTask(localAsset, remoteId);

      if (uploadTask == null) {
        return;
      }

      await enqueueTasks([uploadTask]);
    } catch (error, stackTrace) {
      dPrint(() => "Error handling live photo upload task: $error $stackTrace");
    }
  }

  /// Runs the edit-chain advance and prior-stamping in order, then re-enqueues a
  /// burst's gated members once its representative's terminal upload has stamped
  /// a prior. Serialized so the re-enqueue sees the stamp regardless of which
  /// path wrote it (normal completion via [recordPriorRemoteIdOnSuccess], or the
  /// edit chain's final still). Mid-chain hops are skipped so members enqueue
  /// exactly once.
  Future<void> _advanceChainAndBurst(TaskStatusUpdate update, UploadTaskMetadata? metadata) async {
    await handleLiveEditChain(update, metadata);
    await recordPriorRemoteIdOnSuccess(update, metadata);
    final phase = metadata?.liveEditPhase ?? LiveEditPhase.none;
    if (phase == LiveEditPhase.none || phase == LiveEditPhase.editStill) {
      await _maybeReenqueueBurstChildren(metadata);
    }
  }

  /// Once a burst's anchor frame has uploaded, its gated members become eligible
  /// (their [getBurstParentRemoteId] gate now resolves). Background batches
  /// enqueue once, so re-enqueue just this burst's members here instead of
  /// waiting for the next resume. Keyed on `burstId`, NOT the representative flag:
  /// iOS can move the representative (a Photos re-pick) between task build and
  /// here, so "is this the rep" is unreliable — the anchor (whichever frame
  /// uploaded first) is what members stack under. The per-burst once-guard makes
  /// this fire exactly once, so member completions never re-trigger it and
  /// double-enqueue in-flight uploads. Scoped to the burst, so it never re-walks
  /// the full candidate list.
  Future<void> _maybeReenqueueBurstChildren(UploadTaskMetadata? metadata) async {
    // Bursts are iOS-only; skip the per-completion DB lookup on Android entirely.
    if (!CurrentPlatform.isIOS || metadata == null || metadata.localAssetId.isEmpty || shouldAbortQueuingTasks) {
      return;
    }
    try {
      final completed = await _localAssetRepository.getById(metadata.localAssetId);
      final burstId = completed?.burstId;
      if (burstId == null || _reenqueuedBurstIds.contains(burstId)) {
        return;
      }
      final ownerId = Store.tryGet(StoreKey.currentUser)?.id;
      if (ownerId == null) {
        return;
      }
      final anchorRemoteId = await _localAssetRepository.getBurstParentRemoteId(burstId, ownerId: ownerId);
      if (anchorRemoteId == null) {
        return;
      }
      final members = await _backupRepository.getCandidates(ownerId, burstId: burstId);
      if (members.isEmpty) {
        return;
      }
      // Claim the burst in one synchronous slice (re-check after the awaits above):
      // two completions for the same burst can both pass the early contains-check,
      // so the claim-right-before-the-loop is what makes the re-enqueue fire once.
      if (_reenqueuedBurstIds.contains(burstId)) {
        return;
      }
      _reenqueuedBurstIds.add(burstId);
      final tasks = <UploadTask>[];
      for (final member in members) {
        if (shouldAbortQueuingTasks) {
          break;
        }
        // Skip a member already in flight (e.g. from the main pass) so we don't
        // re-upload it + repeat the heavy native resource fetch / iCloud pull.
        if (await _hasActiveTask(member.id)) {
          continue;
        }
        // Anchor fetched once above and threaded in, so the member loop doesn't
        // repeat an identical lookup per frame.
        final task = await getUploadTask(member, ownerId: ownerId, burstAnchorRemoteId: anchorRemoteId);
        if (task != null) {
          tasks.add(task);
        }
      }
      if (tasks.isNotEmpty && !shouldAbortQueuingTasks) {
        await enqueueTasks(tasks);
      }
    } catch (error, stack) {
      dPrint(() => "burst child re-enqueue failed: $error $stack");
    }
  }

  /// Advances the edit chain on each hop's completion. Live photo:
  /// base video → base still → edit video → edit still; plain photo:
  /// base still → edit still. The base still completion stamps priorRemoteId so
  /// an app kill mid-chain resumes onto the already-uploaded original (via
  /// AbsorbIntoPrior) instead of re-uploading it; the base junctions skip once
  /// the stamp advances past what the chain knew (stalePriorId tells a rebuild
  /// over a dead prior apart from a replay) and every enqueue is skipped while a
  /// task with the same id is already active, so a replayed completion can't
  /// fork a second chain. Completions redelivered on a later launch after the
  /// chain has finished (syncedChecksum already matches) are dropped outright,
  /// and the edit hops are dropped when the photo was re-edited or reverted
  /// while the chain was in flight.
  @visibleForTesting
  Future<void> handleLiveEditChain(TaskStatusUpdate update, UploadTaskMetadata? metadata) async {
    try {
      if (metadata == null || metadata.liveEditPhase == LiveEditPhase.none) {
        return;
      }
      final remoteId = _remoteIdFromResponse(update);
      if (remoteId == null) {
        return;
      }
      final localAsset = await _localAssetRepository.getById(metadata.localAssetId);
      if (localAsset == null) {
        return;
      }

      // Finished-chain replays drop here. Rebuild AND absorb chains can start
      // while the row still carries the previous terminal stamps (synced ==
      // checksum) — those hops carry the dead prior as stalePriorId, so the
      // drop only fires once the prior advanced past it (chain re-stamped and
      // finished). Plain chains carry no marker and drop as before.
      final hasFinishedStamps = localAsset.checksum != null && localAsset.syncedChecksum == localAsset.checksum;
      if (hasFinishedStamps && (metadata.stalePriorId.isEmpty || localAsset.priorRemoteId != metadata.stalePriorId)) {
        return;
      }

      switch (metadata.liveEditPhase) {
        case LiveEditPhase.baseVideo:
          if (_priorAdvanced(localAsset, metadata) || await _hasActiveTask('${localAsset.id}_bs')) {
            return;
          }
          final next = await _buildBaseStillTask(
            localAsset,
            metadata.baseStillPath,
            baseVideoId: remoteId,
            stalePriorId: metadata.stalePriorId,
          );
          if (!await _enqueueChainTask(next)) {
            await _deleteTempFile(metadata.baseStillPath);
          }
        case LiveEditPhase.baseStill:
          if (_priorAdvanced(localAsset, metadata)) {
            return;
          }
          await _localAssetRepository.markSynced(metadata.localAssetId, priorRemoteId: remoteId, syncedChecksum: null);
          if (await _editDriftedMidChain(localAsset, metadata)) {
            return;
          }
          final next = await _buildEditTask(localAsset, stackParentId: remoteId);
          if (next != null) {
            await _enqueueChainTask(next);
          }
        case LiveEditPhase.editVideo:
          if (await _hasActiveTask(localAsset.id)) {
            return;
          }
          if (await _editDriftedMidChain(localAsset, metadata)) {
            return;
          }
          final next = await _buildEditStillTask(
            localAsset,
            editVideoId: remoteId,
            stackParentId: metadata.pendingStackParentId,
            stalePriorId: metadata.stalePriorId,
          );
          if (next != null) {
            await _enqueueChainTask(next);
          }
        case LiveEditPhase.editStill:
          await _localAssetRepository.markSynced(
            metadata.localAssetId,
            priorRemoteId: remoteId,
            syncedChecksum: metadata.checksum ?? localAsset.checksum,
          );
        case LiveEditPhase.none:
          break;
      }
    } catch (error, stackTrace) {
      dPrint(() => "Error handling live edit chain: $error $stackTrace");
    }
  }

  /// The next hop after the base still: the edit video for a live photo (so the
  /// edit keeps its motion), the edit still for a plain photo.
  Future<UploadTask?> _buildEditTask(LocalAsset asset, {required String stackParentId}) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }
    return entity.isLivePhoto
        ? _buildEditVideoTask(asset, stackParentId: stackParentId)
        : _buildEditStillTask(asset, editVideoId: null, stackParentId: stackParentId);
  }

  Future<bool> _hasActiveTask(String taskId) async {
    try {
      return await _uploadRepository.getTaskById(taskId) != null;
    } catch (_) {
      return false;
    }
  }

  /// The row's prior moved past what this chain knew: stamped by a normal chain
  /// (no stale prior) or re-stamped past the dead prior a rebuild was replacing.
  /// Either way this completion is a replay, not a live junction.
  bool _priorAdvanced(LocalAsset asset, UploadTaskMetadata metadata) {
    final prior = asset.priorRemoteId;
    if (prior == null) {
      return false;
    }
    return metadata.stalePriorId.isEmpty || prior != metadata.stalePriorId;
  }

  /// The photo changed under a mid-flight chain: re-edited (checksum moved since
  /// the hop was built) or reverted (positive notEdited probe, cheap offline
  /// read). The chain drops its edit hops — the asset is still a candidate and
  /// re-plans fresh next cycle; the uploaded base stays stamped for resume.
  Future<bool> _editDriftedMidChain(LocalAsset asset, UploadTaskMetadata metadata) async {
    if (metadata.checksum != null && metadata.checksum != asset.checksum) {
      return true;
    }
    // No positive revert evidence (null on timeout/error) → let the chain finish.
    return await _probeEditState(asset.id) == EditState.notEdited;
  }

  // Offline edit-state read with a hard 30s cap; null on timeout/error so the
  // caller falls back to its no-evidence path.
  Future<EditState?> _probeEditState(String id) async {
    try {
      return await _nativeSyncApi.getEditState(id, allowNetworkAccess: false).timeout(const Duration(seconds: 30));
    } catch (_) {
      return null;
    }
  }

  Future<bool> _enqueueChainTask(UploadTask task) async {
    if (shouldAbortQueuingTasks) {
      return false;
    }
    try {
      final results = await enqueueTasks([task]);
      if (results.every((enqueued) => enqueued)) {
        return true;
      }
    } catch (error, stack) {
      _logger.warning(() => "Failed to enqueue chain task ${task.taskId}", error, stack);
      return false;
    }
    _logger.warning(() => "Failed to enqueue chain task ${task.taskId}");
    return false;
  }

  Future<void> _deleteTempFile(String path) async {
    if (path.isEmpty) {
      return;
    }
    try {
      await File(path).delete();
    } catch (_) {}
  }

  /// Saves the uploaded remote id as the asset's priorRemoteId so a later edit
  /// stacks onto it. Edit-chain hops are skipped here; the chain router stamps them.
  @visibleForTesting
  Future<void> recordPriorRemoteIdOnSuccess(TaskStatusUpdate update, UploadTaskMetadata? metadata) async {
    try {
      // Edit stacking is iOS-only; don't stamp prior/synced state on Android.
      if (!CurrentPlatform.isIOS ||
          metadata == null ||
          metadata.isLivePhotos ||
          metadata.liveEditPhase != LiveEditPhase.none ||
          metadata.localAssetId.isEmpty) {
        return;
      }
      final remoteId = _remoteIdFromResponse(update);
      if (remoteId == null) {
        return;
      }
      // metadata.checksum is what actually uploaded (captured at build time). A
      // legacy task without it must NOT fall back to the current row checksum:
      // the photo may have been edited while the task sat in the queue, and
      // stamping the new checksum would suppress that edit forever. null keeps
      // the asset re-resolvable.
      await _localAssetRepository.markSynced(
        metadata.localAssetId,
        priorRemoteId: remoteId,
        syncedChecksum: metadata.checksum,
      );
    } catch (error, stackTrace) {
      dPrint(() => "Error recording priorRemoteId: $error $stackTrace");
    }
  }

  @visibleForTesting
  Future<void> cleanupTempResourceOnFailure(UploadTaskMetadata? metadata) => _cleanupTempResourceOnFailure(metadata);

  Future<void> _cleanupTempResourceOnFailure(UploadTaskMetadata? metadata) async {
    if (metadata == null) {
      return;
    }
    // basePath = the failed hop's own temp; baseStillPath = the base still a live-edit
    // base video carries forward (leaks otherwise when the chain aborts at hop one).
    for (final path in [metadata.basePath, metadata.baseStillPath]) {
      await _deleteTempFile(path);
    }
  }

  /// A failed hop naming a dead stack parent means the stamped prior no longer
  /// exists server-side; clear the stamps so the next cycle re-resolves fresh
  /// instead of looping on the same dead id.
  Future<void> _clearDeadPriorOnStack400(TaskStatusUpdate update, UploadTaskMetadata? metadata) async {
    try {
      if (metadata == null || metadata.localAssetId.isEmpty) {
        return;
      }
      final serverMessage = '${update.responseBody ?? ''} ${update.exception?.description ?? ''}';
      if (!serverMessage.contains(kDeadStackParentError)) {
        return;
      }
      await _localAssetRepository.clearSyncStamps(metadata.localAssetId);
    } catch (error, stackTrace) {
      dPrint(() => "Error clearing dead prior: $error $stackTrace");
    }
  }

  /// The new asset's remote id from an upload's response body, or null if the
  /// body is missing/malformed.
  String? _remoteIdFromResponse(TaskStatusUpdate update) {
    final body = update.responseBody;
    if (body == null || body.isEmpty) {
      return null;
    }
    try {
      return jsonDecode(body)['id'] as String?;
    } catch (_) {
      return null;
    }
  }

  /// Entry of the live-photo edit chain. With an original video, upload it first so
  /// the base still can link to it; without one (the edit turned Live off) the base
  /// degrades to a still-only stack parent.
  Future<UploadTask?> _buildLiveEntryTask(
    LocalAsset asset,
    BaseResource still,
    BaseResource? video, {
    required String stalePriorId,
  }) {
    if (video != null) {
      return _buildBaseVideoTask(asset, still.path, video.path, stalePriorId: stalePriorId);
    }
    return _buildBaseStillTask(asset, still.path, baseVideoId: null, chainEntry: true, stalePriorId: stalePriorId);
  }

  Future<UploadTask> _buildBaseVideoTask(
    LocalAsset asset,
    String baseStillPath,
    String baseVideoPath, {
    String stalePriorId = '',
  }) {
    final metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      liveEditPhase: LiveEditPhase.baseVideo,
      basePath: baseVideoPath,
      baseStillPath: baseStillPath,
      checksum: asset.checksum,
      stalePriorId: stalePriorId,
    ).toJson();

    return buildUploadTask(
      File(baseVideoPath),
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: p.setExtension(asset.name, p.extension(baseVideoPath)),
      deviceAssetId: '${asset.id}_bv',
      metadata: metadata,
      fields: {'visibility': kHiddenVisibility},
      group: kBackupGroup,
      isFavorite: asset.isFavorite,
      requiresWiFi: _shouldRequireWiFi(asset),
    );
  }

  /// [chainEntry] = this base still starts the chain (plain-photo edit, or a live
  /// edit with no recoverable original video), so it queues like any new upload;
  /// a continuation hop runs at top priority to finish the started chain first.
  Future<UploadTask> _buildBaseStillTask(
    LocalAsset asset,
    String baseStillPath, {
    required String? baseVideoId,
    bool chainEntry = false,
    String stalePriorId = '',
  }) {
    final metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      liveEditPhase: LiveEditPhase.baseStill,
      basePath: baseStillPath,
      checksum: asset.checksum,
      stalePriorId: stalePriorId,
    ).toJson();

    return buildUploadTask(
      File(baseStillPath),
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: p.setExtension(asset.name, p.extension(baseStillPath)),
      deviceAssetId: '${asset.id}_bs',
      metadata: metadata,
      fields: baseVideoId != null ? {'livePhotoVideoId': baseVideoId} : null,
      group: chainEntry ? kBackupGroup : kBackupEditPairGroup,
      priority: chainEntry ? null : 0,
      isFavorite: asset.isFavorite,
      requiresWiFi: _shouldRequireWiFi(asset),
      // base = the unedited original, so cloudId but no adjustmentTime
      cloudId: asset.cloudId,
      latitude: asset.latitude?.toString(),
      longitude: asset.longitude?.toString(),
    );
  }

  Future<UploadTask?> _buildEditVideoTask(
    LocalAsset asset, {
    required String stackParentId,
    String stalePriorId = '',
  }) async {
    final motion = await _storageRepository.getMotionFileForAsset(asset);
    if (motion == null) {
      _logger.warning("Failed to get motion file for live edit ${asset.id} - ${asset.name}");
      return null;
    }
    final originalFileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
    final metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      liveEditPhase: LiveEditPhase.editVideo,
      basePath: motion.path,
      pendingStackParentId: stackParentId,
      checksum: asset.checksum,
      stalePriorId: stalePriorId,
    ).toJson();

    return buildUploadTask(
      motion,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: p.setExtension(originalFileName, p.extension(motion.path)),
      deviceAssetId: '${asset.id}_ev',
      metadata: metadata,
      fields: {'visibility': kHiddenVisibility},
      group: kBackupGroup,
      priority: 0,
      isFavorite: asset.isFavorite,
      requiresWiFi: _shouldRequireWiFi(asset),
    );
  }

  /// The terminal hop: the edited still, linked to its own motion ([editVideoId],
  /// live photos only) and stacked onto the base still ([stackParentId]).
  Future<UploadTask?> _buildEditStillTask(
    LocalAsset asset, {
    required String? editVideoId,
    required String stackParentId,
    String stalePriorId = '',
  }) async {
    final file = await _storageRepository.getFileForAsset(asset.id);
    if (file == null) {
      _logger.warning("Failed to get still file for live edit ${asset.id} - ${asset.name}");
      return null;
    }
    final originalFileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
    final metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      liveEditPhase: LiveEditPhase.editStill,
      basePath: file.path,
      checksum: asset.checksum,
      stalePriorId: stalePriorId,
    ).toJson();

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      metadata: metadata,
      fields: {
        if (editVideoId != null) 'livePhotoVideoId': editVideoId,
        if (stackParentId.isNotEmpty) 'stackParentId': stackParentId,
      },
      group: kBackupEditPairGroup,
      priority: 0,
      isFavorite: asset.isFavorite,
      requiresWiFi: _shouldRequireWiFi(asset),
      // edit = WITH adjustmentTime so the server keeps the edit timestamp
      cloudId: asset.cloudId,
      adjustmentTime: asset.adjustmentTime?.toIso8601String(),
      latitude: asset.latitude?.toString(),
      longitude: asset.longitude?.toString(),
    );
  }

  @visibleForTesting
  Future<UploadTask?> getUploadTask(
    LocalAsset asset, {
    String group = kBackupGroup,
    int? priority,
    String? ownerId,
    String? burstAnchorRemoteId,
  }) async {
    // iOS burst non-representative member: photo_manager can't resolve it
    // (getAssetEntityForAsset returns null), so fetch its bytes natively and
    // upload it stacked under the burst's representative. The representative
    // itself falls through to the normal path below (it's resolvable, and an
    // edited one still gets edit-pair stacking) and becomes the stack anchor.
    if (CurrentPlatform.isIOS && asset.burstId != null && !asset.isBurstRepresentative) {
      return _buildBurstMemberTask(asset, knownAnchorRemoteId: burstAnchorRemoteId, ownerId: ownerId);
    }

    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      _logger.warning("Asset entity not found for ${asset.id} - ${asset.name}");
      return null;
    }

    // iOS edit pair: stack a user edit onto its original. resolveEditPair reads the edit
    // state and decides whether to reuse a prior upload or upload the original first.
    if (CurrentPlatform.isIOS) {
      // A reverted edit flips the stack back to the original and skips the upload.
      if (asset.priorRemoteId != null && await _editRevertService.tryHandleRevert(asset) != null) {
        return null;
      }
      final plan = await resolveEditPair(
        _nativeSyncApi,
        asset,
        stackRepository: _stackRepository,
        ownerId: ownerId ?? Store.tryGet(StoreKey.currentUser)?.id,
        log: _logger,
        isLivePhoto: entity.isLivePhoto,
      );
      switch (plan) {
        case UploadBaseFirst(:final base):
          return _buildBaseStillTask(
            asset,
            base.path,
            baseVideoId: null,
            chainEntry: true,
            stalePriorId: asset.priorRemoteId ?? '',
          );
        case UploadBaseLivePhotoFirst(:final still, :final video):
          return _buildLiveEntryTask(asset, still, video, stalePriorId: asset.priorRemoteId ?? '');
        case AbsorbIntoPrior(:final parentId):
          // Re-editing an already-stacked live photo uploads its new video then still so
          // the edit keeps its motion; a plain photo just stacks the still. The current
          // prior rides along as stalePriorId: an absorb can start while the row still
          // carries finished-chain stamps (prior hard-deleted, base re-found by checksum),
          // and the junctions must not mistake its hops for finished-chain replays.
          return entity.isLivePhoto
              ? _buildEditVideoTask(asset, stackParentId: parentId, stalePriorId: asset.priorRemoteId ?? '')
              : _buildEditStillTask(
                  asset,
                  editVideoId: null,
                  stackParentId: parentId,
                  stalePriorId: asset.priorRemoteId ?? '',
                );
        case NoEditPair():
          break;
        case DeferEditPair():
          // Undecidable right now (prior in server trash, or the original
          // couldn't be read). The asset stays a candidate; retry next cycle.
          _logger.fine(() => "Deferring upload for ${asset.id} - ${asset.name}");
          return null;
      }
    }

    File? file;

    /// iOS LivePhoto has two files: a photo and a video.
    /// They are uploaded separately, with video file being upload first, then returned with the assetId
    /// The assetId is then used as a metadata for the photo file upload task.
    ///
    /// We implement two separate upload groups for this, the normal one for the video file
    /// and the higher priority group for the photo file because the video file is already uploaded.
    ///
    /// The cancel operation will only cancel the video group (normal group), the photo group will not
    /// be touched, as the video file is already uploaded.

    if (entity.isLivePhoto) {
      file = await _storageRepository.getMotionFileForAsset(asset);
    } else {
      file = await _storageRepository.getFileForAsset(asset.id);
    }

    if (file == null) {
      _logger.warning("Failed to get file for asset ${asset.id} - ${asset.name}");
      return null;
    }

    String fileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
    final hasExtension = p.extension(fileName).isNotEmpty;
    if (!hasExtension) {
      fileName = p.setExtension(fileName, p.extension(asset.name));
    }

    final originalFileName = entity.isLivePhoto ? p.setExtension(fileName, p.extension(file.path)) : fileName;

    String metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      isLivePhotos: entity.isLivePhoto,
      checksum: asset.checksum,
    ).toJson();

    final requiresWiFi = _shouldRequireWiFi(asset);

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      metadata: metadata,
      // for a live photo this is the motion video — upload it hidden so it never
      // flashes onto the timeline before its still (a later fire) links it.
      fields: entity.isLivePhoto ? {'visibility': kHiddenVisibility} : null,
      group: group,
      priority: priority,
      isFavorite: asset.isFavorite,
      requiresWiFi: requiresWiFi,
      cloudId: entity.isLivePhoto ? null : asset.cloudId,
      adjustmentTime: entity.isLivePhoto ? null : asset.adjustmentTime?.toIso8601String(),
      latitude: entity.isLivePhoto ? null : asset.latitude?.toString(),
      longitude: entity.isLivePhoto ? null : asset.longitude?.toString(),
    );
  }

  /// iOS burst non-representative upload. Streams the same rendition the hash
  /// measured ([NativeSyncApi.getCurrentResource]) — burst members are invisible
  /// to photo_manager, so this is the only way to read them, and matching the
  /// hashed bytes keeps the asset merging with its local instead of showing
  /// cloud-only. Stacks under the burst anchor with `keepPrimary` so the
  /// representative stays the stack primary. Gated until the anchor has a remote
  /// id; returns null to wait, retried once the representative lands.
  @visibleForTesting
  Future<UploadTask?> buildBurstMemberTask(LocalAsset asset, {String? ownerId}) =>
      _buildBurstMemberTask(asset, ownerId: ownerId);

  Future<UploadTask?> _buildBurstMemberTask(LocalAsset asset, {String? knownAnchorRemoteId, String? ownerId}) async {
    // The re-enqueue path fetches the anchor once and threads it in; the main
    // backup pass passes null and each member resolves its own (still indexed).
    final parentRemoteId =
        knownAnchorRemoteId ?? await _localAssetRepository.getBurstParentRemoteId(asset.burstId!, ownerId: ownerId);
    if (parentRemoteId == null) {
      // No anchor. If the burst still has a representative the member is just
      // gated until the rep uploads — wait. If the group is rep-less (Keep
      // Everything / re-pick), it can never anchor, so upload the frame
      // standalone (no stack) instead of gating it forever.
      if (await _localAssetRepository.burstHasRepresentative(asset.burstId!)) {
        return null;
      }
    }

    BaseResource? resource;
    try {
      resource = await _nativeSyncApi.getCurrentResource(asset.id, allowNetworkAccess: true);
    } catch (error, stack) {
      _logger.warning(() => "burst getCurrentResource failed for ${asset.id}: $error", error, stack);
      return null;
    }
    if (resource == null) {
      _logger.warning("burst getCurrentResource returned null for ${asset.id} - ${asset.name}");
      return null;
    }

    // basePath records the temp so a failed upload cleans it up; a successful one
    // is deleted by the iOS terminal-status handler. Not an edit chain, so the
    // success handler stamps its prior like any normal upload.
    final metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      basePath: resource.path,
      checksum: asset.checksum,
    ).toJson();

    final baseName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
    return buildUploadTask(
      File(resource.path),
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: p.setExtension(baseName, p.extension(resource.path)),
      deviceAssetId: asset.id,
      metadata: metadata,
      // Rep-less group → standalone (no stack); otherwise stack under the anchor.
      fields: burstStackFields(parentRemoteId),
      group: kBackupGroup,
      isFavorite: asset.isFavorite,
      requiresWiFi: _shouldRequireWiFi(asset),
      cloudId: asset.cloudId,
      adjustmentTime: asset.adjustmentTime?.toIso8601String(),
      latitude: asset.latitude?.toString(),
      longitude: asset.longitude?.toString(),
    );
  }

  @visibleForTesting
  Future<UploadTask?> getLivePhotoUploadTask(LocalAsset asset, String livePhotoVideoId) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    final file = await _storageRepository.getFileForAsset(asset.id);
    if (file == null) {
      return null;
    }

    final fields = {'livePhotoVideoId': livePhotoVideoId};

    final requiresWiFi = _shouldRequireWiFi(asset);
    final originalFileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      // so recordPriorRemoteIdOnSuccess stamps the still's remote id and a later
      // edit absorbs onto it instead of rebuilding the whole base pair.
      metadata: UploadTaskMetadata(localAssetId: asset.id, checksum: asset.checksum).toJson(),
      fields: fields,
      group: kBackupLivePhotoGroup,
      priority: 0, // Highest priority to get upload immediately
      isFavorite: asset.isFavorite,
      requiresWiFi: requiresWiFi,
      cloudId: asset.cloudId,
      adjustmentTime: asset.adjustmentTime?.toIso8601String(),
      latitude: asset.latitude?.toString(),
      longitude: asset.longitude?.toString(),
    );
  }

  bool _shouldRequireWiFi(LocalAsset asset) {
    final backup = SettingsRepository.instance.appConfig.backup;
    if (asset.isVideo && backup.useCellularForVideos) {
      return false;
    }
    if (!asset.isVideo && backup.useCellularForPhotos) {
      return false;
    }
    return true;
  }

  Future<UploadTask> buildUploadTask(
    File file, {
    required String group,
    required DateTime createdAt,
    required DateTime modifiedAt,
    Map<String, String>? fields,
    String? originalFileName,
    String? deviceAssetId,
    String? metadata,
    int? priority,
    bool? isFavorite,
    bool requiresWiFi = true,
    String? cloudId,
    String? adjustmentTime,
    String? latitude,
    String? longitude,
  }) async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);
    final (baseDirectory, directory, filename) = await Task.split(filePath: file.path);
    final cloudMetadata = cloudMetadataJson(
      cloudId: cloudId,
      createdAt: createdAt,
      adjustmentTime: adjustmentTime,
      latitude: latitude,
      longitude: longitude,
    );
    final fieldsMap = {
      'filename': originalFileName ?? filename,
      // deviceAssetId/deviceId required by server v2.7.5 and below (drop in v4.0 per #27818).
      'deviceAssetId': deviceAssetId ?? '',
      'deviceId': deviceId,
      'fileCreatedAt': createdAt.toUtc().toIso8601String(),
      'fileModifiedAt': modifiedAt.toUtc().toIso8601String(),
      'isFavorite': isFavorite?.toString() ?? 'false',
      'duration': '0',
      if (fields != null) ...fields,
      if (cloudMetadata != null) 'metadata': cloudMetadata,
    };

    return UploadTask(
      taskId: deviceAssetId,
      displayName: originalFileName ?? filename,
      httpRequestMethod: 'POST',
      url: url,
      headers: headers,
      filename: filename,
      fields: fieldsMap,
      baseDirectory: baseDirectory,
      directory: directory,
      fileField: 'assetData',
      metaData: metadata ?? '',
      group: group,
      requiresWiFi: requiresWiFi,
      priority: priority ?? 5,
      updates: Updates.statusAndProgress,
      retries: 3,
    );
  }
}
