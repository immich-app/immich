// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncStreamDto {
  const SyncStreamDto({this.reset = const Optional.absent(), required this.types});

  /// Reset sync state
  final Optional<bool> reset;

  /// Sync request types
  final List<SyncRequestType> types;

  static SyncStreamDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncStreamDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      reset: json.containsKey(r'reset') ? Optional.present(json[r'reset'] as bool) : const Optional.absent(),
      types: ((json[r'types'] as List?)?.map(($e) => (SyncRequestType.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (reset case Present(:final value)) {
      json[r'reset'] = value;
    }
    json[r'types'] = types.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  SyncStreamDto copyWith({Optional<bool>? reset, List<SyncRequestType>? types}) {
    return .new(reset: reset ?? this.reset, types: types ?? this.types);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncStreamDto && reset == other.reset && const DeepCollectionEquality().equals(types, other.types));
  }

  @override
  int get hashCode {
    return Object.hashAll([reset, const DeepCollectionEquality().hash(types)]);
  }

  @override
  String toString() => 'SyncStreamDto(reset=$reset, types=$types)';
}
