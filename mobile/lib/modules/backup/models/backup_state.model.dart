// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';
import 'package:immich_mobile/shared/models/asset.dart';

import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_disk_info.model.dart';

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
  final double iCloudDownloadProgress;
  final CancellationToken cancelToken;
  final ServerDiskInfo serverInfo;
  final bool autoBackup;
  final bool backgroundBackup;
  final bool backupRequireWifi;
  final bool backupRequireCharging;
  final int backupTriggerDelay;

  /// Assets that are not overlapping in selected backup albums and excluded backup albums
  final Set<Asset> allUniqueAssets;

  /// All assets from the selected albums that have been backup
  final int backedUpAssetsCount;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;

  const BackUpState({
    required this.backupProgress,
    required this.allAssetsInDatabase,
    required this.progressInPercentage,
    required this.iCloudDownloadProgress,
    required this.cancelToken,
    required this.serverInfo,
    required this.autoBackup,
    required this.backgroundBackup,
    required this.backupRequireWifi,
    required this.backupRequireCharging,
    required this.backupTriggerDelay,
    required this.allUniqueAssets,
    required this.backedUpAssetsCount,
    required this.currentUploadAsset,
  });

  BackUpState copyWith({
    BackUpProgressEnum? backupProgress,
    List<String>? allAssetsInDatabase,
    double? progressInPercentage,
    double? iCloudDownloadProgress,
    CancellationToken? cancelToken,
    ServerDiskInfo? serverInfo,
    bool? autoBackup,
    bool? backgroundBackup,
    bool? backupRequireWifi,
    bool? backupRequireCharging,
    int? backupTriggerDelay,
    Set<Asset>? allUniqueAssets,
    int? backedUpAssetsCount,
    CurrentUploadAsset? currentUploadAsset,
  }) {
    return BackUpState(
      backupProgress: backupProgress ?? this.backupProgress,
      allAssetsInDatabase: allAssetsInDatabase ?? this.allAssetsInDatabase,
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
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
      allUniqueAssets: allUniqueAssets ?? this.allUniqueAssets,
      backedUpAssetsCount: backedUpAssetsCount ?? this.backedUpAssetsCount,
      currentUploadAsset: currentUploadAsset ?? this.currentUploadAsset,
    );
  }

  @override
  String toString() {
    return 'BackUpState(backupProgress: $backupProgress, allAssetsInDatabase: $allAssetsInDatabase, progressInPercentage: $progressInPercentage, iCloudDownloadProgress: $iCloudDownloadProgress, cancelToken: $cancelToken, serverInfo: $serverInfo, autoBackup: $autoBackup, backgroundBackup: $backgroundBackup, backupRequireWifi: $backupRequireWifi, backupRequireCharging: $backupRequireCharging, backupTriggerDelay: $backupTriggerDelay, allUniqueAssets: $allUniqueAssets, backedUpAssetsCount: $backedUpAssetsCount, currentUploadAsset: $currentUploadAsset)';
  }

  @override
  bool operator ==(covariant BackUpState other) {
    if (identical(this, other)) return true;
    final collectionEquals = const DeepCollectionEquality().equals;

    return other.backupProgress == backupProgress &&
        collectionEquals(other.allAssetsInDatabase, allAssetsInDatabase) &&
        other.progressInPercentage == progressInPercentage &&
        other.iCloudDownloadProgress == iCloudDownloadProgress &&
        other.cancelToken == cancelToken &&
        other.serverInfo == serverInfo &&
        other.autoBackup == autoBackup &&
        other.backgroundBackup == backgroundBackup &&
        other.backupRequireWifi == backupRequireWifi &&
        other.backupRequireCharging == backupRequireCharging &&
        other.backupTriggerDelay == backupTriggerDelay &&
        collectionEquals(other.allUniqueAssets, allUniqueAssets) &&
        other.backedUpAssetsCount == backedUpAssetsCount &&
        other.currentUploadAsset == currentUploadAsset;
  }

  @override
  int get hashCode {
    return backupProgress.hashCode ^
        allAssetsInDatabase.hashCode ^
        progressInPercentage.hashCode ^
        iCloudDownloadProgress.hashCode ^
        cancelToken.hashCode ^
        serverInfo.hashCode ^
        autoBackup.hashCode ^
        backgroundBackup.hashCode ^
        backupRequireWifi.hashCode ^
        backupRequireCharging.hashCode ^
        backupTriggerDelay.hashCode ^
        allUniqueAssets.hashCode ^
        backedUpAssetsCount.hashCode ^
        currentUploadAsset.hashCode;
  }
}
