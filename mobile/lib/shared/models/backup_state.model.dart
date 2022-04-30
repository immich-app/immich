import 'dart:convert';

import 'package:dio/dio.dart';

import 'package:immich_mobile/shared/models/server_info.model.dart';

enum BackUpProgressEnum { idle, inProgress, done }

class BackUpState {
  final BackUpProgressEnum backupProgress;
  final int totalAssetCount;
  final int remainderAssetCount;
  final int assetOnDatabase;
  final double progressInPercentage;
  final CancelToken cancelToken;
  final ServerInfo serverInfo;

  BackUpState({
    required this.backupProgress,
    required this.totalAssetCount,
    required this.remainderAssetCount,
    required this.assetOnDatabase,
    required this.progressInPercentage,
    required this.cancelToken,
    required this.serverInfo,
  });

  BackUpState copyWith({
    BackUpProgressEnum? backupProgress,
    int? totalAssetCount,
    int? remainderAssetCount,
    int? assetOnDatabase,
    double? progressInPercentage,
    CancelToken? cancelToken,
    ServerInfo? serverInfo,
  }) {
    return BackUpState(
      backupProgress: backupProgress ?? this.backupProgress,
      totalAssetCount: totalAssetCount ?? this.totalAssetCount,
      remainderAssetCount: remainderAssetCount ?? this.remainderAssetCount,
      assetOnDatabase: assetOnDatabase ?? this.assetOnDatabase,
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      cancelToken: cancelToken ?? this.cancelToken,
      serverInfo: serverInfo ?? this.serverInfo,
    );
  }

  @override
  String toString() {
    return 'BackUpState(backupProgress: $backupProgress, totalAssetCount: $totalAssetCount, remainderAssetCount: $remainderAssetCount, assetOnDatabase: $assetOnDatabase, progressInPercentage: $progressInPercentage, cancelToken: $cancelToken, serverInfo: $serverInfo)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is BackUpState &&
        other.backupProgress == backupProgress &&
        other.totalAssetCount == totalAssetCount &&
        other.remainderAssetCount == remainderAssetCount &&
        other.assetOnDatabase == assetOnDatabase &&
        other.progressInPercentage == progressInPercentage &&
        other.cancelToken == cancelToken &&
        other.serverInfo == serverInfo;
  }

  @override
  int get hashCode {
    return backupProgress.hashCode ^
        totalAssetCount.hashCode ^
        remainderAssetCount.hashCode ^
        assetOnDatabase.hashCode ^
        progressInPercentage.hashCode ^
        cancelToken.hashCode ^
        serverInfo.hashCode;
  }
}
