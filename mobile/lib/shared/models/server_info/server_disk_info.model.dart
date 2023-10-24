import 'package:openapi/api.dart';

class ServerDiskInfo {
  final String diskAvailable;
  final String diskSize;
  final String diskUse;
  final double diskUsagePercentage;

  const ServerDiskInfo({
    required this.diskAvailable,
    required this.diskSize,
    required this.diskUse,
    required this.diskUsagePercentage,
  });

  ServerDiskInfo copyWith({
    String? diskAvailable,
    String? diskSize,
    String? diskUse,
    double? diskUsagePercentage,
  }) {
    return ServerDiskInfo(
      diskAvailable: diskAvailable ?? this.diskAvailable,
      diskSize: diskSize ?? this.diskSize,
      diskUse: diskUse ?? this.diskUse,
      diskUsagePercentage: diskUsagePercentage ?? this.diskUsagePercentage,
    );
  }

  @override
  String toString() {
    return 'ServerDiskInfo(diskAvailable: $diskAvailable, diskSize: $diskSize, diskUse: $diskUse, diskUsagePercentage: $diskUsagePercentage)';
  }

  ServerDiskInfo.fromDto(ServerInfoResponseDto dto)
      : diskAvailable = dto.diskAvailable,
        diskSize = dto.diskSize,
        diskUse = dto.diskUse,
        diskUsagePercentage = dto.diskUsagePercentage;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerDiskInfo &&
        other.diskAvailable == diskAvailable &&
        other.diskSize == diskSize &&
        other.diskUse == diskUse &&
        other.diskUsagePercentage == diskUsagePercentage;
  }

  @override
  int get hashCode {
    return diskAvailable.hashCode ^
        diskSize.hashCode ^
        diskUse.hashCode ^
        diskUsagePercentage.hashCode;
  }
}
