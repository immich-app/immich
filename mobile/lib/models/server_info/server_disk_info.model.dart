// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'server_disk_info.model.freezed.dart';

@freezed
class const ServerDiskInfo({
  required final String diskAvailable,
  required final String diskSize,
  required final String diskUse,
  required final double diskUsagePercentage,
}) with _$ServerDiskInfo {
  factory ServerDiskInfo.fromDto(ServerStorageResponseDto dto) => ServerDiskInfo(
    diskAvailable: dto.diskAvailable,
    diskSize: dto.diskSize,
    diskUse: dto.diskUse,
    diskUsagePercentage: dto.diskUsagePercentage,
  );
}
