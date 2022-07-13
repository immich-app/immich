import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

import 'package:immich_mobile/modules/backup/models/available_album.model.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';

enum BackUpProgressEnum { idle, inProgress, done }

class BackUpState {
  // enum
  final BackUpProgressEnum backupProgress;
  final List<String> allAssetsInDatabase;
  final double progressInPercentage;
  final CancellationToken cancelToken;
  final ServerInfoResponseDto serverInfo;

  /// All available albums on the device
  final List<AvailableAlbum> availableAlbums;
  final Set<AssetPathEntity> selectedBackupAlbums;
  final Set<AssetPathEntity> excludedBackupAlbums;

  /// Assets that are not overlapping in selected backup albums and excluded backup albums
  final Set<AssetEntity> allUniqueAssets;

  /// All assets from the selected albums that have been backup
  final Set<String> selectedAlbumsBackupAssetsIds;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;

  const BackUpState({
    required this.backupProgress,
    required this.allAssetsInDatabase,
    required this.progressInPercentage,
    required this.cancelToken,
    required this.serverInfo,
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
    CancellationToken? cancelToken,
    ServerInfoResponseDto? serverInfo,
    List<AvailableAlbum>? availableAlbums,
    Set<AssetPathEntity>? selectedBackupAlbums,
    Set<AssetPathEntity>? excludedBackupAlbums,
    Set<AssetEntity>? allUniqueAssets,
    Set<String>? selectedAlbumsBackupAssetsIds,
    CurrentUploadAsset? currentUploadAsset,
  }) {
    return BackUpState(
      backupProgress: backupProgress ?? this.backupProgress,
      allAssetsInDatabase: allAssetsInDatabase ?? this.allAssetsInDatabase,
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      cancelToken: cancelToken ?? this.cancelToken,
      serverInfo: serverInfo ?? this.serverInfo,
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
    return 'BackUpState(backupProgress: $backupProgress, allAssetsInDatabase: $allAssetsInDatabase, progressInPercentage: $progressInPercentage, cancelToken: $cancelToken, serverInfo: $serverInfo, availableAlbums: $availableAlbums, selectedBackupAlbums: $selectedBackupAlbums, excludedBackupAlbums: $excludedBackupAlbums, allUniqueAssets: $allUniqueAssets, selectedAlbumsBackupAssetsIds: $selectedAlbumsBackupAssetsIds, currentUploadAsset: $currentUploadAsset)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final collectionEquals = const DeepCollectionEquality().equals;

    return other is BackUpState &&
        other.backupProgress == backupProgress &&
        collectionEquals(other.allAssetsInDatabase, allAssetsInDatabase) &&
        other.progressInPercentage == progressInPercentage &&
        other.cancelToken == cancelToken &&
        other.serverInfo == serverInfo &&
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
        cancelToken.hashCode ^
        serverInfo.hashCode ^
        availableAlbums.hashCode ^
        selectedBackupAlbums.hashCode ^
        excludedBackupAlbums.hashCode ^
        allUniqueAssets.hashCode ^
        selectedAlbumsBackupAssetsIds.hashCode ^
        currentUploadAsset.hashCode;
  }
}
