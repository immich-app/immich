import 'dart:convert';

class ServerInfo {
  final String diskSize;
  final String diskUse;
  final String diskAvailable;
  final int diskSizeRaw;
  final int diskUseRaw;
  final int diskAvailableRaw;
  final double diskUsagePercentage;
  ServerInfo({
    required this.diskSize,
    required this.diskUse,
    required this.diskAvailable,
    required this.diskSizeRaw,
    required this.diskUseRaw,
    required this.diskAvailableRaw,
    required this.diskUsagePercentage,
  });

  ServerInfo copyWith({
    String? diskSize,
    String? diskUse,
    String? diskAvailable,
    int? diskSizeRaw,
    int? diskUseRaw,
    int? diskAvailableRaw,
    double? diskUsagePercentage,
  }) {
    return ServerInfo(
      diskSize: diskSize ?? this.diskSize,
      diskUse: diskUse ?? this.diskUse,
      diskAvailable: diskAvailable ?? this.diskAvailable,
      diskSizeRaw: diskSizeRaw ?? this.diskSizeRaw,
      diskUseRaw: diskUseRaw ?? this.diskUseRaw,
      diskAvailableRaw: diskAvailableRaw ?? this.diskAvailableRaw,
      diskUsagePercentage: diskUsagePercentage ?? this.diskUsagePercentage,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'diskSize': diskSize,
      'diskUse': diskUse,
      'diskAvailable': diskAvailable,
      'diskSizeRaw': diskSizeRaw,
      'diskUseRaw': diskUseRaw,
      'diskAvailableRaw': diskAvailableRaw,
      'diskUsagePercentage': diskUsagePercentage,
    };
  }

  factory ServerInfo.fromMap(Map<String, dynamic> map) {
    return ServerInfo(
      diskSize: map['diskSize'] ?? '',
      diskUse: map['diskUse'] ?? '',
      diskAvailable: map['diskAvailable'] ?? '',
      diskSizeRaw: map['diskSizeRaw']?.toInt() ?? 0,
      diskUseRaw: map['diskUseRaw']?.toInt() ?? 0,
      diskAvailableRaw: map['diskAvailableRaw']?.toInt() ?? 0,
      diskUsagePercentage: map['diskUsagePercentage']?.toDouble() ?? 0.0,
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerInfo.fromJson(String source) =>
      ServerInfo.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ServerInfo(diskSize: $diskSize, diskUse: $diskUse, diskAvailable: $diskAvailable, diskSizeRaw: $diskSizeRaw, diskUseRaw: $diskUseRaw, diskAvailableRaw: $diskAvailableRaw, diskUsagePercentage: $diskUsagePercentage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerInfo &&
        other.diskSize == diskSize &&
        other.diskUse == diskUse &&
        other.diskAvailable == diskAvailable &&
        other.diskSizeRaw == diskSizeRaw &&
        other.diskUseRaw == diskUseRaw &&
        other.diskAvailableRaw == diskAvailableRaw &&
        other.diskUsagePercentage == diskUsagePercentage;
  }

  @override
  int get hashCode {
    return diskSize.hashCode ^
        diskUse.hashCode ^
        diskAvailable.hashCode ^
        diskSizeRaw.hashCode ^
        diskUseRaw.hashCode ^
        diskAvailableRaw.hashCode ^
        diskUsagePercentage.hashCode;
  }
}
