// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MemoryUpdateDto {
  const MemoryUpdateDto({
    this.isSaved = const Optional.absent(),
    this.memoryAt = const Optional.absent(),
    this.seenAt = const Optional.absent(),
  });

  /// Is memory saved
  final Optional<bool> isSaved;

  /// Memory date
  final Optional<DateTime> memoryAt;

  /// Date when memory was seen
  final Optional<DateTime> seenAt;

  static MemoryUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MemoryUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      isSaved: json.containsKey(r'isSaved') ? Optional.present(json[r'isSaved'] as bool) : const Optional.absent(),
      memoryAt: json.containsKey(r'memoryAt')
          ? Optional.present(DateTime.parse(json[r'memoryAt'] as String))
          : const Optional.absent(),
      seenAt: json.containsKey(r'seenAt')
          ? Optional.present(DateTime.parse(json[r'seenAt'] as String))
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (isSaved case Present(:final value)) {
      json[r'isSaved'] = value;
    }
    if (memoryAt case Present(:final value)) {
      json[r'memoryAt'] = value.toUtc().toIso8601String();
    }
    if (seenAt case Present(:final value)) {
      json[r'seenAt'] = value.toUtc().toIso8601String();
    }
    return json;
  }

  MemoryUpdateDto copyWith({Optional<bool>? isSaved, Optional<DateTime>? memoryAt, Optional<DateTime>? seenAt}) {
    return .new(isSaved: isSaved ?? this.isSaved, memoryAt: memoryAt ?? this.memoryAt, seenAt: seenAt ?? this.seenAt);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MemoryUpdateDto && isSaved == other.isSaved && memoryAt == other.memoryAt && seenAt == other.seenAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([isSaved, memoryAt, seenAt]);
  }

  @override
  String toString() => 'MemoryUpdateDto(isSaved=$isSaved, memoryAt=$memoryAt, seenAt=$seenAt)';
}
