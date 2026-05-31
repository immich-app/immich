// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MemoryCreateDto {
  const MemoryCreateDto({
    this.assetIds = const Optional.absent(),
    required this.data,
    this.hideAt = const Optional.absent(),
    this.isSaved = const Optional.absent(),
    required this.memoryAt,
    this.seenAt = const Optional.absent(),
    this.showAt = const Optional.absent(),
    required this.type,
  });

  /// Asset IDs to associate with memory
  final Optional<List<String>> assetIds;

  final OnThisDayDto data;

  /// Date when memory should be hidden
  /// Available since server v2.6.0.
  final Optional<DateTime> hideAt;

  /// Is memory saved
  final Optional<bool> isSaved;

  /// Memory date
  final DateTime memoryAt;

  /// Date when memory was seen
  final Optional<DateTime> seenAt;

  /// Date when memory should be shown
  /// Available since server v2.6.0.
  final Optional<DateTime> showAt;

  final MemoryType type;

  static const ApiVersion hideAtAddedIn = .new(2, 6, 0);

  static const ApiState hideAtState = .stable;

  static const ApiVersion showAtAddedIn = .new(2, 6, 0);

  static const ApiState showAtState = .stable;

  static MemoryCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MemoryCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetIds: json.containsKey(r'assetIds')
          ? Optional.present(((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      data: (OnThisDayDto.fromJson(json[r'data']))!,
      hideAt: json.containsKey(r'hideAt')
          ? Optional.present(DateTime.parse(json[r'hideAt'] as String))
          : const Optional.absent(),
      isSaved: json.containsKey(r'isSaved') ? Optional.present(json[r'isSaved'] as bool) : const Optional.absent(),
      memoryAt: DateTime.parse(json[r'memoryAt'] as String),
      seenAt: json.containsKey(r'seenAt')
          ? Optional.present(DateTime.parse(json[r'seenAt'] as String))
          : const Optional.absent(),
      showAt: json.containsKey(r'showAt')
          ? Optional.present(DateTime.parse(json[r'showAt'] as String))
          : const Optional.absent(),
      type: (MemoryType.fromJson(json[r'type']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (assetIds case Present(:final value)) {
      json[r'assetIds'] = value;
    }
    json[r'data'] = data.toJson();
    if (hideAt case Present(:final value)) {
      json[r'hideAt'] = value.toUtc().toIso8601String();
    }
    if (isSaved case Present(:final value)) {
      json[r'isSaved'] = value;
    }
    json[r'memoryAt'] = memoryAt.toUtc().toIso8601String();
    if (seenAt case Present(:final value)) {
      json[r'seenAt'] = value.toUtc().toIso8601String();
    }
    if (showAt case Present(:final value)) {
      json[r'showAt'] = value.toUtc().toIso8601String();
    }
    json[r'type'] = type.toJson();
    return json;
  }

  MemoryCreateDto copyWith({
    Optional<List<String>>? assetIds,
    OnThisDayDto? data,
    Optional<DateTime>? hideAt,
    Optional<bool>? isSaved,
    DateTime? memoryAt,
    Optional<DateTime>? seenAt,
    Optional<DateTime>? showAt,
    MemoryType? type,
  }) {
    return .new(
      assetIds: assetIds ?? this.assetIds,
      data: data ?? this.data,
      hideAt: hideAt ?? this.hideAt,
      isSaved: isSaved ?? this.isSaved,
      memoryAt: memoryAt ?? this.memoryAt,
      seenAt: seenAt ?? this.seenAt,
      showAt: showAt ?? this.showAt,
      type: type ?? this.type,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MemoryCreateDto &&
            assetIds == other.assetIds &&
            data == other.data &&
            hideAt == other.hideAt &&
            isSaved == other.isSaved &&
            memoryAt == other.memoryAt &&
            seenAt == other.seenAt &&
            showAt == other.showAt &&
            type == other.type);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetIds, data, hideAt, isSaved, memoryAt, seenAt, showAt, type]);
  }

  @override
  String toString() =>
      'MemoryCreateDto(assetIds=$assetIds, data=$data, hideAt=$hideAt, isSaved=$isSaved, memoryAt=$memoryAt, seenAt=$seenAt, showAt=$showAt, type=$type)';
}
