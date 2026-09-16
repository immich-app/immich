import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'server_disk_info.model.freezed.dart';

@freezed
abstract class ServerDiskInfo with _$ServerDiskInfo {
  const factory ServerDiskInfo({
    required String diskAvailable,
    required String diskSize,
    required String diskUse,
    required double diskUsagePercentage,
  }) = _ServerDiskInfo;

  factory ServerDiskInfo.fromDto(ServerStorageResponseDto dto) => ServerDiskInfo(
    diskAvailable: dto.diskAvailable,
    diskSize: dto.diskSize,
    diskUse: dto.diskUse,
    diskUsagePercentage: dto.diskUsagePercentage,
  );
}
