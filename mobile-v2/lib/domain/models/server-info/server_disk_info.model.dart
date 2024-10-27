class ServerDiskInfo {
  final int diskAvailableInBytes;
  final int diskSizeInBytes;
  final int diskUseInBytes;
  final double diskUsagePercentage;

  const ServerDiskInfo({
    required this.diskAvailableInBytes,
    required this.diskSizeInBytes,
    required this.diskUseInBytes,
    required this.diskUsagePercentage,
  });

  const ServerDiskInfo.initial()
      : diskSizeInBytes = -1,
        diskUseInBytes = -1,
        diskAvailableInBytes = -1,
        diskUsagePercentage = -1;

  ServerDiskInfo copyWith({
    int? diskAvailableInBytes,
    int? diskSizeInBytes,
    int? diskUseInBytes,
    double? diskUsagePercentage,
  }) {
    return ServerDiskInfo(
      diskAvailableInBytes: diskAvailableInBytes ?? this.diskAvailableInBytes,
      diskSizeInBytes: diskSizeInBytes ?? this.diskSizeInBytes,
      diskUseInBytes: diskUseInBytes ?? this.diskUseInBytes,
      diskUsagePercentage: diskUsagePercentage ?? this.diskUsagePercentage,
    );
  }

  @override
  String toString() {
    return 'ServerDiskInfo(diskAvailableInBytes: $diskAvailableInBytes, diskSizeInBytes: $diskSizeInBytes, diskUseInBytes: $diskUseInBytes, diskUsagePercentage: $diskUsagePercentage)';
  }

  @override
  bool operator ==(covariant ServerDiskInfo other) {
    if (identical(this, other)) return true;

    return other.diskAvailableInBytes == diskAvailableInBytes &&
        other.diskSizeInBytes == diskSizeInBytes &&
        other.diskUseInBytes == diskUseInBytes &&
        other.diskUsagePercentage == diskUsagePercentage;
  }

  @override
  int get hashCode {
    return diskAvailableInBytes.hashCode ^
        diskSizeInBytes.hashCode ^
        diskUseInBytes.hashCode ^
        diskUsagePercentage.hashCode;
  }
}
