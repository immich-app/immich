import 'package:cancellation_token_http/http.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/manual_upload_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/local_notification.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/backup_progress.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart';

final manualUploadProvider =
    StateNotifierProvider<ManualUploadNotifier, ManualUploadState>((ref) {
  return ManualUploadNotifier(
    ref.watch(localNotificationService),
    ref.watch(backgroundServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(backupProvider.notifier),
    ref,
  );
});

class ManualUploadNotifier extends StateNotifier<ManualUploadState> {
  final LocalNotificationService _localNotificationService;
  final BackgroundService _backgroundService;
  final BackupService _backupService;
  final BackupNotifier _backupProvider;
  final Ref ref;

  ManualUploadNotifier(
    this._localNotificationService,
    this._backgroundService,
    this._backupService,
    this._backupProvider,
    this.ref,
  ) : super(
          ManualUploadState(
            progressInPercentage: 0,
            cancelToken: CancellationToken(),
            currentUploadAsset: CurrentUploadAsset(
              id: '...',
              fileCreatedAt: DateTime.parse('2020-10-04'),
              fileName: '...',
              fileType: '...',
            ),
            manualUploadsTotal: 0,
            manualUploadSuccess: 0,
            manualUploadFailures: 0,
          ),
        );

  int get _uploadedAssetsCount =>
      state.manualUploadSuccess + state.manualUploadFailures;

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
          _uploadedAssetsCount,
          state.manualUploadsTotal,
        ),
        maxProgress: state.manualUploadsTotal,
        progress: _uploadedAssetsCount,
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
        );
      }
    }
  }

  void _onManualAssetUploaded(
    String deviceAssetId,
    String deviceId,
    bool isDuplicated,
  ) {
    state = state.copyWith(manualUploadSuccess: state.manualUploadSuccess + 1);
    _backupProvider.updateServerInfo();
    if (state.manualUploadsTotal > 1) {
      _throttledNotifiy();
    }
  }

  void _onManualBackupError(ErrorUploadAsset errorAssetInfo) {
    state =
        state.copyWith(manualUploadFailures: state.manualUploadFailures + 1);
    if (state.manualUploadsTotal > 1) {
      _throttledNotifiy();
    }
  }

  void _onProgress(int sent, int total) {
    final title = "backup_background_service_current_upload_notification"
        .tr(args: [state.currentUploadAsset.fileName]);
    _throttledDetailNotify(title: title, progress: sent, total: total);
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    state = state.copyWith(currentUploadAsset: currentUploadAsset);
    _throttledDetailNotify.title =
        "backup_background_service_current_upload_notification"
            .tr(args: [currentUploadAsset.fileName]);
    _throttledDetailNotify.progress = 0;
    _throttledDetailNotify.total = 0;
  }

  Future<bool> _startUpload(Iterable<Asset> allManualUploads) async {
    try {
      _backupProvider.updateBackupProgress(BackUpProgressEnum.manualInProgress);

      if (ref.read(galleryPermissionNotifier.notifier).hasPermission) {
        await PhotoManager.clearFileCache();

        Set<AssetEntity> allUploadAssets = allManualUploads
            .where((e) => e.isLocal && e.local != null)
            .map((e) => e.local!)
            .toSet();

        if (allUploadAssets.isEmpty) {
          debugPrint("[_startUpload] No Assets to upload - Abort Process");
          _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
          return false;
        }

        // Reset state
        state = state.copyWith(
          manualUploadsTotal: allManualUploads.length,
          manualUploadSuccess: 0,
          manualUploadFailures: 0,
          currentUploadAsset: CurrentUploadAsset(
            id: '...',
            fileCreatedAt: DateTime.parse('2020-10-04'),
            fileName: '...',
            fileType: '...',
          ),
          cancelToken: CancellationToken(),
        );

        if (state.manualUploadsTotal > 1) {
          _throttledNotifiy();
        }

        // Show detailed asset if enabled in settings or if a single asset is uploaded
        bool showDetailedNotification =
            ref.read(appSettingsServiceProvider).getSetting<bool>(
                      AppSettingsEnum.backgroundBackupSingleProgress,
                    ) ||
                state.manualUploadsTotal == 1;

        final bool ok = await _backupService.backupAsset(
          allUploadAssets,
          state.cancelToken,
          _onManualAssetUploaded,
          showDetailedNotification ? _onProgress : (sent, total) {},
          showDetailedNotification ? _onSetCurrentBackupAsset : (asset) {},
          _onManualBackupError,
        );

        // Close detailed notification
        await _localNotificationService.closeNotification(
          LocalNotificationService.manualUploadDetailedNotificationID,
        );

        bool hasErrors = false;
        if ((state.manualUploadFailures != 0 &&
                state.manualUploadSuccess == 0) ||
            (!ok && !state.cancelToken.isCancelled)) {
          await _localNotificationService.showOrUpdateManualUploadStatus(
            "backup_manual_title".tr(),
            "backup_manual_failed".tr(),
            presentBanner: true,
          );
          hasErrors = true;
        } else if (state.manualUploadSuccess != 0) {
          await _localNotificationService.showOrUpdateManualUploadStatus(
            "backup_manual_title".tr(),
            "backup_manual_success".tr(),
            presentBanner: true,
          );
        }

        _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
        await _backupProvider.notifyBackgroundServiceCanRun();
        return !hasErrors;
      } else {
        openAppSettings();
        debugPrint("[_startUpload] Do not have permission to the gallery");
      }
    } catch (e) {
      debugPrint("ERROR _startUpload: ${e.toString()}");
    }
    await _localNotificationService.closeNotification(
      LocalNotificationService.manualUploadDetailedNotificationID,
    );
    _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
    await _backupProvider.notifyBackgroundServiceCanRun();
    return false;
  }

  void cancelBackup() {
    if (_backupProvider.backupProgress != BackUpProgressEnum.manualInProgress) {
      _backupProvider.notifyBackgroundServiceCanRun();
    }
    state.cancelToken.cancel();
    _backupProvider.updateBackupProgress(BackUpProgressEnum.idle);
  }

  Future<bool> uploadAssets(
    BuildContext context,
    Iterable<Asset> allManualUploads,
  ) async {
    // assumes the background service is currently running and
    // waits until it has stopped to start the backup.
    final bool hasLock = await _backgroundService.acquireLock();
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
