import 'dart:convert';

const _defaultRotationMinutes = 30;

enum RotationMode { lockUnlock, minutes, hours, daily }

extension RotationModeExtension on RotationMode {
  String get label {
    switch (this) {
      case RotationMode.lockUnlock:
        return 'Lock/Unlock';
      case RotationMode.minutes:
        return 'Minute';
      case RotationMode.hours:
        return 'Hour';
      case RotationMode.daily:
        return 'Daily';
    }
  }

  Duration get duration {
    switch (this) {
      case RotationMode.lockUnlock:
        return Duration.zero; // Special case for lock/unlock
      case RotationMode.minutes:
        return const Duration(minutes: 1);
      case RotationMode.hours:
        return const Duration(hours: 1);
      case RotationMode.daily:
        return const Duration(days: 1);
    }
  }
}

class LiveWallpaperPreferences {
  const LiveWallpaperPreferences({
    required this.enabled,
    required this.personIds,
    required this.rotationInterval,
    required this.rotationMode,
    required this.allowCellularData,
    this.lastAssetId,
    this.lastUpdated,
  });

  const LiveWallpaperPreferences.defaults()
    : enabled = false,
      personIds = const [],
      rotationInterval = const Duration(minutes: _defaultRotationMinutes),
      rotationMode = RotationMode.minutes,
      allowCellularData = false,
      lastAssetId = null,
      lastUpdated = null;

  final bool enabled;
  final List<String> personIds;
  final Duration rotationInterval;
  final RotationMode rotationMode;
  final bool allowCellularData;
  final String? lastAssetId;
  final DateTime? lastUpdated;

  bool get hasSelection => personIds.isNotEmpty;

  LiveWallpaperPreferences copyWith({
    bool? enabled,
    List<String>? personIds,
    Duration? rotationInterval,
    RotationMode? rotationMode,
    bool? allowCellularData,
    String? lastAssetId,
    DateTime? lastUpdated,
  }) {
    return LiveWallpaperPreferences(
      enabled: enabled ?? this.enabled,
      personIds: personIds ?? this.personIds,
      rotationInterval: rotationInterval ?? this.rotationInterval,
      rotationMode: rotationMode ?? this.rotationMode,
      allowCellularData: allowCellularData ?? this.allowCellularData,
      lastAssetId: lastAssetId ?? this.lastAssetId,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'enabled': enabled,
      'personIds': personIds,
      'rotationMinutes': rotationInterval.inMinutes,
      'rotationMode': rotationMode.name,
      'allowCellularData': allowCellularData,
      'lastAssetId': lastAssetId,
      'lastUpdated': lastUpdated?.toIso8601String(),
    };
  }

  String encode() => jsonEncode(toJson());

  static LiveWallpaperPreferences decode(String? source) {
    if (source == null || source.isEmpty) {
      return const LiveWallpaperPreferences.defaults();
    }

    try {
      final map = jsonDecode(source) as Map<String, dynamic>;
      return LiveWallpaperPreferences(
        enabled: map['enabled'] as bool? ?? false,
        personIds: (map['personIds'] as List? ?? const []).cast<String>(),
        rotationInterval: Duration(minutes: _parseInt(map['rotationMinutes'], _defaultRotationMinutes)),
        rotationMode: _parseRotationMode(map['rotationMode'] as String?),
        allowCellularData: map['allowCellularData'] as bool? ?? false,
        lastAssetId: map['lastAssetId'] as String?,
        lastUpdated: _parseDate(map['lastUpdated'] as String?),
      );
    } catch (_) {
      return const LiveWallpaperPreferences.defaults();
    }
  }

  static int _parseInt(Object? value, int fallback) {
    if (value is int) return value;
    if (value is String) {
      final parsed = int.tryParse(value);
      if (parsed != null) return parsed;
    }
    return fallback;
  }

  static DateTime? _parseDate(String? value) {
    if (value == null || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }

  static RotationMode _parseRotationMode(String? value) {
    if (value == null) return RotationMode.minutes;
    try {
      return RotationMode.values.firstWhere((e) => e.name == value);
    } catch (_) {
      return RotationMode.minutes;
    }
  }
}
