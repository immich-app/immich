import 'package:dio/dio.dart';
import 'package:equatable/equatable.dart';
import 'package:photo_manager/photo_manager.dart';

import 'package:immich_mobile/modules/backup/models/available_album.model.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';

enum BackUpProgressEnum { idle, inProgress, done }

class BackUpState extends Equatable {
  // enum
  final BackUpProgressEnum backupProgress;
  final List<String> allAssetOnDatabase;
  final double progressInPercentage;
  final CancelToken cancelToken;
  final ServerInfo serverInfo;

  /// All available albums on the device
  final List<AvailableAlbum> availableAlbums;
  final Set<AssetPathEntity> selectedBackupAlbums;
  final Set<AssetPathEntity> excludedBackupAlbums;

  /// Assets that are not overlapping in selected backup albums and excluded backup albums
  final Set<AssetEntity> allUniqueAssets;

  /// All assets from the selected albums that have been backup
  final Set<String> selectedAlbumsBackupAssetsIds;

  const BackUpState({
    required this.backupProgress,
    required this.allAssetOnDatabase,
    required this.progressInPercentage,
    required this.cancelToken,
    required this.serverInfo,
    required this.availableAlbums,
    required this.selectedBackupAlbums,
    required this.excludedBackupAlbums,
    required this.allUniqueAssets,
    required this.selectedAlbumsBackupAssetsIds,
  });

  BackUpState copyWith({
    BackUpProgressEnum? backupProgress,
    List<String>? allAssetOnDatabase,
    double? progressInPercentage,
    CancelToken? cancelToken,
    ServerInfo? serverInfo,
    List<AvailableAlbum>? availableAlbums,
    Set<AssetPathEntity>? selectedBackupAlbums,
    Set<AssetPathEntity>? excludedBackupAlbums,
    Set<AssetEntity>? allUniqueAssets,
    Set<String>? selectedAlbumsBackupAssetsIds,
  }) {
    return BackUpState(
      backupProgress: backupProgress ?? this.backupProgress,
      allAssetOnDatabase: allAssetOnDatabase ?? this.allAssetOnDatabase,
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      cancelToken: cancelToken ?? this.cancelToken,
      serverInfo: serverInfo ?? this.serverInfo,
      availableAlbums: availableAlbums ?? this.availableAlbums,
      selectedBackupAlbums: selectedBackupAlbums ?? this.selectedBackupAlbums,
      excludedBackupAlbums: excludedBackupAlbums ?? this.excludedBackupAlbums,
      allUniqueAssets: allUniqueAssets ?? this.allUniqueAssets,
      selectedAlbumsBackupAssetsIds: selectedAlbumsBackupAssetsIds ?? this.selectedAlbumsBackupAssetsIds,
    );
  }

  @override
  String toString() {
    return 'BackUpState(backupProgress: $backupProgress, allAssetOnDatabase: $allAssetOnDatabase, progressInPercentage: $progressInPercentage, cancelToken: $cancelToken, serverInfo: $serverInfo, availableAlbums: $availableAlbums, selectedBackupAlbums: $selectedBackupAlbums, excludedBackupAlbums: $excludedBackupAlbums, allUniqueAssets: $allUniqueAssets, selectedAlbumsBackupAssetsIds: $selectedAlbumsBackupAssetsIds)';
  }

  @override
  List<Object> get props {
    return [
      backupProgress,
      allAssetOnDatabase,
      progressInPercentage,
      cancelToken,
      serverInfo,
      availableAlbums,
      selectedBackupAlbums,
      excludedBackupAlbums,
      allUniqueAssets,
      selectedAlbumsBackupAssetsIds,
    ];
  }
}
