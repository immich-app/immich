// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAckSetDto {
  const SyncAckSetDto({required this.acks});

  /// Acknowledgment IDs (max 1000)
  final List<String> acks;

  static SyncAckSetDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAckSetDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(acks: ((json[r'acks'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'acks'] = acks;
    return json;
  }

  SyncAckSetDto copyWith({List<String>? acks}) {
    return .new(acks: acks ?? this.acks);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAckSetDto && const DeepCollectionEquality().equals(acks, other.acks));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(acks)]);
  }

  @override
  String toString() => 'SyncAckSetDto(acks=$acks)';
}
