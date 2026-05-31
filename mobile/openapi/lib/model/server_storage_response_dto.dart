// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerStorageResponseDto {
  const ServerStorageResponseDto({
    required this.diskAvailable,
    required this.diskAvailableRaw,
    required this.diskSize,
    required this.diskSizeRaw,
    required this.diskUsagePercentage,
    required this.diskUse,
    required this.diskUseRaw,
  });

  /// Available disk space (human-readable format)
  final String diskAvailable;

  /// Available disk space in bytes
  final int diskAvailableRaw;

  /// Total disk size (human-readable format)
  final String diskSize;

  /// Total disk size in bytes
  final int diskSizeRaw;

  /// Disk usage percentage (0-100)
  final double diskUsagePercentage;

  /// Used disk space (human-readable format)
  final String diskUse;

  /// Used disk space in bytes
  final int diskUseRaw;

  static ServerStorageResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerStorageResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      diskAvailable: json[r'diskAvailable'] as String,
      diskAvailableRaw: json[r'diskAvailableRaw'] as int,
      diskSize: json[r'diskSize'] as String,
      diskSizeRaw: json[r'diskSizeRaw'] as int,
      diskUsagePercentage: (json[r'diskUsagePercentage'] as num).toDouble(),
      diskUse: json[r'diskUse'] as String,
      diskUseRaw: json[r'diskUseRaw'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'diskAvailable'] = diskAvailable;
    json[r'diskAvailableRaw'] = diskAvailableRaw;
    json[r'diskSize'] = diskSize;
    json[r'diskSizeRaw'] = diskSizeRaw;
    json[r'diskUsagePercentage'] = diskUsagePercentage;
    json[r'diskUse'] = diskUse;
    json[r'diskUseRaw'] = diskUseRaw;
    return json;
  }

  ServerStorageResponseDto copyWith({
    String? diskAvailable,
    int? diskAvailableRaw,
    String? diskSize,
    int? diskSizeRaw,
    double? diskUsagePercentage,
    String? diskUse,
    int? diskUseRaw,
  }) {
    return .new(
      diskAvailable: diskAvailable ?? this.diskAvailable,
      diskAvailableRaw: diskAvailableRaw ?? this.diskAvailableRaw,
      diskSize: diskSize ?? this.diskSize,
      diskSizeRaw: diskSizeRaw ?? this.diskSizeRaw,
      diskUsagePercentage: diskUsagePercentage ?? this.diskUsagePercentage,
      diskUse: diskUse ?? this.diskUse,
      diskUseRaw: diskUseRaw ?? this.diskUseRaw,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerStorageResponseDto &&
            diskAvailable == other.diskAvailable &&
            diskAvailableRaw == other.diskAvailableRaw &&
            diskSize == other.diskSize &&
            diskSizeRaw == other.diskSizeRaw &&
            diskUsagePercentage == other.diskUsagePercentage &&
            diskUse == other.diskUse &&
            diskUseRaw == other.diskUseRaw);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      diskAvailable,
      diskAvailableRaw,
      diskSize,
      diskSizeRaw,
      diskUsagePercentage,
      diskUse,
      diskUseRaw,
    ]);
  }

  @override
  String toString() =>
      'ServerStorageResponseDto(diskAvailable=$diskAvailable, diskAvailableRaw=$diskAvailableRaw, diskSize=$diskSize, diskSizeRaw=$diskSizeRaw, diskUsagePercentage=$diskUsagePercentage, diskUse=$diskUse, diskUseRaw=$diskUseRaw)';
}
