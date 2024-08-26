// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';
import 'package:immich_mobile/models/backup/backup_candidate.model.dart';

import 'package:immich_mobile/models/backup/available_album.model.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';

enum BackUpProgressEnum {
  idle,
  inProgress,
  manualInProgress,
  inBackground,
  done
}

class BackUpState {
  // enum
  final BackUpProgressEnum backupProgress;
  final List<String> allAssetsInDatabase;
  final double progressInPercentage;
  final String progressInFileSize;
  final double progressInFileSpeed;
  final List<double> progressInFileSpeeds;
  final DateTime progressInFileSpeedUpdateTime;
  final int progressInFileSpeedUpdateSentBytes;
  final double iCloudDownloadProgress;
  final CancellationToken cancelToken;
  final ServerDiskInfo serverInfo;
  final bool autoBackup;
  final bool backgroundBackup;
  final bool backupRequireWifi;
  final bool backupRequireCharging;
  final int backupTriggerDelay;

  /// All available albums on the device
  final List<AvailableAlbum> availableAlbums;
  final Set<AvailableAlbum> selectedBackupAlbums;
  final Set<AvailableAlbum> excludedBackupAlbums;

  /// Assets that are not overlapping in selected backup albums and excluded backup albums
  final Set<BackupCandidate> allUniqueAssets;

  /// All assets from the selected albums that have been backup
  final Set<String> selectedAlbumsBackupAssetsIds;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;

  const BackUpState({
    required this.backupProgress,
    required this.allAssetsInDatabase,
    required this.progressInPercentage,
    required this.progressInFileSize,
    required this.progressInFileSpeed,
    required this.progressInFileSpeeds,
    required this.progressInFileSpeedUpdateTime,
    required this.progressInFileSpeedUpdateSentBytes,
    required this.iCloudDownloadProgress,
    required this.cancelToken,
    required this.serverInfo,
    required this.autoBackup,
    required this.backgroundBackup,
    required this.backupRequireWifi,
    required this.backupRequireCharging,
    required this.backupTriggerDelay,
    required this.availableAlbums,
    required this.selectedBackupAlbums,
    required this.excludedBackupAlbums,
    required this.allUniqueAssets,
    required this.selectedAlbumsBackupAssetsIds,
    required this.currentUploadAsset,
  });

  BackUpState copyWith({
    BackUpProgressEnum? backupProgress,
    List<String>? allAssetsInDatabase,
    double? progressInPercentage,
    String? progressInFileSize,
    double? progressInFileSpeed,
    List<double>? progressInFileSpeeds,
    DateTime? progressInFileSpeedUpdateTime,
    int? progressInFileSpeedUpdateSentBytes,
    double? iCloudDownloadProgress,
    CancellationToken? cancelToken,
    ServerDiskInfo? serverInfo,
    bool? autoBackup,
    bool? backgroundBackup,
    bool? backupRequireWifi,
    bool? backupRequireCharging,
    int? backupTriggerDelay,
    List<AvailableAlbum>? availableAlbums,
    Set<AvailableAlbum>? selectedBackupAlbums,
    Set<AvailableAlbum>? excludedBackupAlbums,
    Set<BackupCandidate>? allUniqueAssets,
    Set<String>? selectedAlbumsBackupAssetsIds,
    CurrentUploadAsset? currentUploadAsset,
  }) {
    return BackUpState(
      backupProgress: backupProgress ?? this.backupProgress,
      allAssetsInDatabase: allAssetsInDatabase ?? this.allAssetsInDatabase,
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      progressInFileSize: progressInFileSize ?? this.progressInFileSize,
      progressInFileSpeed: progressInFileSpeed ?? this.progressInFileSpeed,
      progressInFileSpeeds: progressInFileSpeeds ?? this.progressInFileSpeeds,
      progressInFileSpeedUpdateTime:
          progressInFileSpeedUpdateTime ?? this.progressInFileSpeedUpdateTime,
      progressInFileSpeedUpdateSentBytes: progressInFileSpeedUpdateSentBytes ??
          this.progressInFileSpeedUpdateSentBytes,
      iCloudDownloadProgress:
          iCloudDownloadProgress ?? this.iCloudDownloadProgress,
      cancelToken: cancelToken ?? this.cancelToken,
      serverInfo: serverInfo ?? this.serverInfo,
      autoBackup: autoBackup ?? this.autoBackup,
      backgroundBackup: backgroundBackup ?? this.backgroundBackup,
      backupRequireWifi: backupRequireWifi ?? this.backupRequireWifi,
      backupRequireCharging:
          backupRequireCharging ?? this.backupRequireCharging,
      backupTriggerDelay: backupTriggerDelay ?? this.backupTriggerDelay,
      availableAlbums: availableAlbums ?? this.availableAlbums,
      selectedBackupAlbums: selectedBackupAlbums ?? this.selectedBackupAlbums,
      excludedBackupAlbums: excludedBackupAlbums ?? this.excludedBackupAlbums,
      allUniqueAssets: allUniqueAssets ?? this.allUniqueAssets,
      selectedAlbumsBackupAssetsIds:
          selectedAlbumsBackupAssetsIds ?? this.selectedAlbumsBackupAssetsIds,
      currentUploadAsset: currentUploadAsset ?? this.currentUploadAsset,
    );
  }

  @override
  String toString() {
    return 'BackUpState(backupProgress: $backupProgress, allAssetsInDatabase: $allAssetsInDatabase, progressInPercentage: $progressInPercentage, progressInFileSize: $progressInFileSize, progressInFileSpeed: $progressInFileSpeed, progressInFileSpeeds: $progressInFileSpeeds, progressInFileSpeedUpdateTime: $progressInFileSpeedUpdateTime, progressInFileSpeedUpdateSentBytes: $progressInFileSpeedUpdateSentBytes, iCloudDownloadProgress: $iCloudDownloadProgress, cancelToken: $cancelToken, serverInfo: $serverInfo, autoBackup: $autoBackup, backgroundBackup: $backgroundBackup, backupRequireWifi: $backupRequireWifi, backupRequireCharging: $backupRequireCharging, backupTriggerDelay: $backupTriggerDelay, availableAlbums: $availableAlbums, selectedBackupAlbums: $selectedBackupAlbums, excludedBackupAlbums: $excludedBackupAlbums, allUniqueAssets: $allUniqueAssets, selectedAlbumsBackupAssetsIds: $selectedAlbumsBackupAssetsIds, currentUploadAsset: $currentUploadAsset)';
  }

  @override
  bool operator ==(covariant BackUpState other) {
    if (identical(this, other)) return true;
    final collectionEquals = const DeepCollectionEquality().equals;

    return other.backupProgress == backupProgress &&
        collectionEquals(other.allAssetsInDatabase, allAssetsInDatabase) &&
        other.progressInPercentage == progressInPercentage &&
        other.progressInFileSize == progressInFileSize &&
        other.progressInFileSpeed == progressInFileSpeed &&
        collectionEquals(other.progressInFileSpeeds, progressInFileSpeeds) &&
        other.progressInFileSpeedUpdateTime == progressInFileSpeedUpdateTime &&
        other.progressInFileSpeedUpdateSentBytes ==
            progressInFileSpeedUpdateSentBytes &&
        other.iCloudDownloadProgress == iCloudDownloadProgress &&
        other.cancelToken == cancelToken &&
        other.serverInfo == serverInfo &&
        other.autoBackup == autoBackup &&
        other.backgroundBackup == backgroundBackup &&
        other.backupRequireWifi == backupRequireWifi &&
        other.backupRequireCharging == backupRequireCharging &&
        other.backupTriggerDelay == backupTriggerDelay &&
        collectionEquals(other.availableAlbums, availableAlbums) &&
        collectionEquals(other.selectedBackupAlbums, selectedBackupAlbums) &&
        collectionEquals(other.excludedBackupAlbums, excludedBackupAlbums) &&
        collectionEquals(other.allUniqueAssets, allUniqueAssets) &&
        collectionEquals(
          other.selectedAlbumsBackupAssetsIds,
          selectedAlbumsBackupAssetsIds,
        ) &&
        other.currentUploadAsset == currentUploadAsset;
  }

  @override
  int get hashCode {
    return backupProgress.hashCode ^
        allAssetsInDatabase.hashCode ^
        progressInPercentage.hashCode ^
        progressInFileSize.hashCode ^
        progressInFileSpeed.hashCode ^
        progressInFileSpeeds.hashCode ^
        progressInFileSpeedUpdateTime.hashCode ^
        progressInFileSpeedUpdateSentBytes.hashCode ^
        iCloudDownloadProgress.hashCode ^
        cancelToken.hashCode ^
        serverInfo.hashCode ^
        autoBackup.hashCode ^
        backgroundBackup.hashCode ^
        backupRequireWifi.hashCode ^
        backupRequireCharging.hashCode ^
        backupTriggerDelay.hashCode ^
        availableAlbums.hashCode ^
        selectedBackupAlbums.hashCode ^
        excludedBackupAlbums.hashCode ^
        allUniqueAssets.hashCode ^
        selectedAlbumsBackupAssetsIds.hashCode ^
        currentUploadAsset.hashCode;
  }
}
