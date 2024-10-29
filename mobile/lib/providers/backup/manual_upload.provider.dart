import 'dart:io';

import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/models/backup/backup_candidate.model.dart';
import 'package:immich_mobile/models/backup/success_upload_asset.model.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/models/backup/error_upload_asset.model.dart';
import 'package:immich_mobile/models/backup/manual_upload_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/error_backup_list.provider.dart';
import 'package:immich_mobile/services/backup.service.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/app_life_cycle.provider.dart';
import 'package:immich_mobile/services/local_notification.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/utils/backup_progress.dart';
import 'package:logging/logging.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart' show PMProgressHandler;

final manualUploadProvider =
    StateNotifierProvider<ManualUploadNotifier, ManualUploadState>((ref) {
  return ManualUploadNotifier(
    ref.watch(localNotificationService),
    ref.watch(backupProvider.notifier),
    ref.watch(backupServiceProvider),
    ref.watch(backupRepositoryProvider),
    ref,
  );
});

class ManualUploadNotifier extends StateNotifier<ManualUploadState> {
  final Logger _log = Logger("ManualUploadNotifier");
  final LocalNotificationService _localNotificationService;
  final BackupNotifier _backupProvider;
  final BackupService _backupService;
  final BackupRepository _backupRepository;
  final Ref ref;

  ManualUploadNotifier(
    this._localNotificationService,
    this._backupProvider,
    this._backupService,
    this._backupRepository,
    this.ref,
  ) : super(
          ManualUploadState(
            progressInPercentage: 0,
            progressInFileSize: "0 B / 0 B",
            progressInFileSpeed: 0,
            progressInFileSpeeds: const [],
            progressInFileSpeedUpdateTime: DateTime.now(),
            progressInFileSpeedUpdateSentBytes: 0,
            cancelToken: CancellationToken(),
            currentUploadAsset: CurrentUploadAsset(
              id: '...',
              fileCreatedAt: DateTime.parse('2020-10-04'),
              fileName: '...',
              fileType: '...',
            ),
            totalAssetsToUpload: 0,
            successfulUploads: 0,
            currentAssetIndex: 0,
            showDetailedNotification: false,
          ),
        );

  String _lastPrintedDetailContent = '';
  String? _lastPrintedDetailTitle;

  static const notifyInterval = Duration(milliseconds: 500);
  late final ThrottleProgressUpdate _throttledNotifiy =
      ThrottleProgressUpdate(_updateProgress, notifyInterval);
  late final ThrottleProgressUpdate _throttledDetailNotify =
      ThrottleProgressUpdate(_updateDetailProgress, notifyInterval);

  void _updateProgress(String? title, int progress, int total) {
    // Guard against throttling calling this method after the upload is done
    if (_backupProvider.backupProgress == BackUpProgressEnum.manualInProgress) {
      _localNotificationService.showOrUpdateManualUploadStatus(
        "backup_background_service_in_progress_notification".tr(),
        formatAssetBackupProgress(
          state.currentAssetIndex,
          state.totalAssetsToUpload,
        ),
        maxProgress: state.totalAssetsToUpload,
        progress: state.currentAssetIndex,
        showActions: true,
      );
    }
  }

  void _updateDetailProgress(String? title, int progress, int total) {
    // Guard against throttling calling this method after the upload is done
    if (_backupProvider.backupProgress == BackUpProgressEnum.manualInProgress) {
      final String msg =
          total > 0 ? humanReadableBytesProgress(progress, total) : "";
      // only update if message actually differs (to stop many useless notification updates on large assets or slow connections)
      if (msg != _lastPrintedDetailContent ||
          title != _lastPrintedDetailTitle) {
        _lastPrintedDetailContent = msg;
        _lastPrintedDetailTitle = title;
        _localNotificationService.showOrUpdateManualUploadStatus(
          title ?? 'Uploading',
          msg,
          progress: total > 0 ? (progress * 1000) ~/ total : 0,
          maxProgress: 1000,
          isDetailed: true,
          // Detailed noitifcation is displayed for Single asset uploads. Show actions for such case
          showActions: state.totalAssetsToUpload == 1,
        );
      }
    }
  }

  void _onAssetUploaded(SuccessUploadAsset result) {
    state = state.copyWith(successfulUploads: state.successfulUploads + 1);
    _backupProvider.updateDiskInfo();
  }

  void _onAssetUploadError(ErrorUploadAsset errorAssetInfo) {
    ref.watch(errorBackupListProvider.notifier).add(errorAssetInfo);
  }

  void _onProgress(int sent, int total) {
    double lastUploadSpeed = state.progressInFileSpeed;
    List<double> lastUploadSpeeds = state.progressInFileSpeeds.toList();
    DateTime lastUpdateTime = state.progressInFileSpeedUpdateTime;
    int lastSentBytes = state.progressInFileSpeedUpdateSentBytes;

    final now = DateTime.now();
    final duration = now.difference(lastUpdateTime);

    // Keep the upload speed average span limited, to keep it somewhat relevant
    if (lastUploadSpeeds.length > 10) {
      lastUploadSpeeds.removeAt(0);
    }

    if (duration.inSeconds > 0) {
      lastUploadSpeeds.add(
        ((sent - lastSentBytes) / duration.inSeconds).abs().roundToDouble(),
      );

      lastUploadSpeed = lastUploadSpeeds.average.abs().roundToDouble();
      lastUpdateTime = now;
      lastSentBytes = sent;
    }

    state = state.copyWith(
      progressInPercentage: (sent.toDouble() / total.toDouble() * 100),
      progressInFileSize: humanReadableFileBytesProgress(sent, total),
      progressInFileSpeed: lastUploadSpeed,
      progressInFileSpeeds: lastUploadSpeeds,
      progressInFileSpeedUpdateTime: lastUpdateTime,
      progressInFileSpeedUpdateSentBytes: lastSentBytes,
    );

    if (state.showDetailedNotification) {
      final title = "backup_background_service_current_upload_notification"
          .tr(args: [state.currentUploadAsset.fileName]);
      _throttledDetailNotify(title: title, progress: sent, total: total);
    }
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    state = state.copyWith(
      currentUploadAsset: currentUploadAsset,
      currentAssetIndex: state.currentAssetIndex + 1,
    );
    if (state.totalAssetsToUpload > 1) {
      _throttledNotifiy();
    }
    if (state.showDetailedNotification) {
      _throttledDetailNotify.title =
          "backup_background_service_current_upload_notification"
              .tr(args: [currentUploadAsset.fileName]);
      _throttledDetailNotify.progress = 0;
      _throttledDetailNotify.total = 0;
    }
  }

  Future<bool> _startUpload(Iterable<Asset> allManualUploads) async {
    bool hasErrors = false;
    try {
      _backupProvider.updateBackupProgress(BackUpProgressEnum.manualInProgress);

      if (ref.read(galleryPermissionNotifier.notifier).hasPermission) {
        await ref.read(fileMediaRepositoryProvider).clearFileCache();

        final allAssetsFromDevice =
            allManualUploads.where((e) => e.isLocal && !e.isRemote).toList();

        if (allAssetsFromDevice.length != allManualUploads.length) {
          _log.warning(
            '[_startUpload] Refreshed upload list -> ${allManualUploads.length - allAssetsFromDevice.length} asset will not be uploaded',
          );
        }

        final selectedBackupAlbums =
            await _backupRepository.getAllBySelection(BackupSelection.select);
        final excludedBackupAlbums =
            await _backupRepository.getAllBySelection(BackupSelection.exclude);

        // Get candidates from selected albums and excluded albums
        Set<BackupCandidate> candidates =
            await _backupService.buildUploadCandidates(
          selectedBackupAlbums,
          excludedBackupAlbums,
          useTimeFilter: false,
        );

        // Extrack candidate from allAssetsFromDevice
        final uploadAssets = candidates.where(
          (candidate) =>
              allAssetsFromDevice.firstWhereOrNull(
                (asset) => asset.localId == candidate.asset.localId,
              ) !=
              null,
        );

        if (uploadAssets.isEmpty) {
          debugPrint("[_startUpload] No Assets to upload - Abort Process");
          _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
          return false;
        }

        state = state.copyWith(
          progressInPercentage: 0,
          progressInFileSize: "0 B / 0 B",
          progressInFileSpeed: 0,
          totalAssetsToUpload: uploadAssets.length,
          successfulUploads: 0,
          currentAssetIndex: 0,
          currentUploadAsset: CurrentUploadAsset(
            id: '...',
            fileCreatedAt: DateTime.parse('2020-10-04'),
            fileName: '...',
            fileType: '...',
          ),
          cancelToken: CancellationToken(),
        );
        // Reset Error List
        ref.watch(errorBackupListProvider.notifier).empty();

        if (state.totalAssetsToUpload > 1) {
          _throttledNotifiy();
        }

        // Show detailed asset if enabled in settings or if a single asset is uploaded
        bool showDetailedNotification =
            ref.read(appSettingsServiceProvider).getSetting<bool>(
                      AppSettingsEnum.backgroundBackupSingleProgress,
                    ) ||
                state.totalAssetsToUpload == 1;
        state =
            state.copyWith(showDetailedNotification: showDetailedNotification);
        final pmProgressHandler = Platform.isIOS ? PMProgressHandler() : null;

        final bool ok = await ref.read(backupServiceProvider).backupAsset(
              uploadAssets,
              state.cancelToken,
              pmProgressHandler: pmProgressHandler,
              onSuccess: _onAssetUploaded,
              onProgress: _onProgress,
              onCurrentAsset: _onSetCurrentBackupAsset,
              onError: _onAssetUploadError,
            );

        // Close detailed notification
        await _localNotificationService.closeNotification(
          LocalNotificationService.manualUploadDetailedNotificationID,
        );

        _log.info(
          '[_startUpload] Manual Upload Completed - success: ${state.successfulUploads},'
          ' failed: ${state.totalAssetsToUpload - state.successfulUploads}',
        );

        // User cancelled upload
        if (!ok && state.cancelToken.isCancelled) {
          await _localNotificationService.showOrUpdateManualUploadStatus(
            "backup_manual_title".tr(),
            "backup_manual_cancelled".tr(),
            presentBanner: true,
          );
          hasErrors = true;
        } else if (state.successfulUploads == 0 ||
            (!ok && !state.cancelToken.isCancelled)) {
          await _localNotificationService.showOrUpdateManualUploadStatus(
            "backup_manual_title".tr(),
            "backup_manual_failed".tr(),
            presentBanner: true,
          );
          hasErrors = true;
        } else {
          await _localNotificationService.showOrUpdateManualUploadStatus(
            "backup_manual_title".tr(),
            "backup_manual_success".tr(),
            presentBanner: true,
          );
        }
      } else {
        openAppSettings();
        debugPrint("[_startUpload] Do not have permission to the gallery");
      }
    } catch (e) {
      debugPrint("ERROR _startUpload: ${e.toString()}");
      hasErrors = true;
    } finally {
      _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
      _handleAppInActivity();
      await _localNotificationService.closeNotification(
        LocalNotificationService.manualUploadDetailedNotificationID,
      );
      await _backupProvider.notifyBackgroundServiceCanRun();
    }
    return !hasErrors;
  }

  void _handleAppInActivity() {
    final appState = ref.read(appStateProvider.notifier).getAppState();
    // The app is currently in background. Perform the necessary cleanups which
    // are on-hold for upload completion
    if (appState != AppLifeCycleEnum.active &&
        appState != AppLifeCycleEnum.resumed) {
      ref.read(backupProvider.notifier).cancelBackup();
    }
  }

  void cancelBackup() {
    if (_backupProvider.backupProgress != BackUpProgressEnum.inProgress &&
        _backupProvider.backupProgress != BackUpProgressEnum.manualInProgress) {
      _backupProvider.notifyBackgroundServiceCanRun();
    }
    state.cancelToken.cancel();
    if (_backupProvider.backupProgress != BackUpProgressEnum.manualInProgress) {
      _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
    }
    state = state.copyWith(
      progressInPercentage: 0,
      progressInFileSize: "0 B / 0 B",
      progressInFileSpeed: 0,
      progressInFileSpeedUpdateTime: DateTime.now(),
      progressInFileSpeedUpdateSentBytes: 0,
    );
  }

  Future<bool> uploadAssets(
    BuildContext context,
    Iterable<Asset> allManualUploads,
  ) async {
    // assumes the background service is currently running and
    // waits until it has stopped to start the backup.
    final bool hasLock =
        await ref.read(backgroundServiceProvider).acquireLock();
    if (!hasLock) {
      debugPrint("[uploadAssets] could not acquire lock, exiting");
      ImmichToast.show(
        context: context,
        msg: "backup_manual_failed".tr(),
        toastType: ToastType.info,
        gravity: ToastGravity.BOTTOM,
        durationInSecond: 3,
      );
      return false;
    }

    bool showInProgress = false;

    // check if backup is already in process - then return
    if (_backupProvider.backupProgress == BackUpProgressEnum.manualInProgress) {
      debugPrint("[uploadAssets] Manual upload is already running - abort");
      showInProgress = true;
    }

    if (_backupProvider.backupProgress == BackUpProgressEnum.inProgress) {
      debugPrint("[uploadAssets] Auto Backup is already in progress - abort");
      showInProgress = true;
      return false;
    }

    if (_backupProvider.backupProgress == BackUpProgressEnum.inBackground) {
      debugPrint("[uploadAssets] Background backup is running - abort");
      showInProgress = true;
    }

    if (showInProgress) {
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: "backup_manual_in_progress".tr(),
          toastType: ToastType.info,
          gravity: ToastGravity.BOTTOM,
          durationInSecond: 3,
        );
      }
      return false;
    }

    return _startUpload(allManualUploads);
  }
}
