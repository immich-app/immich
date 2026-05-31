// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAckDeleteDto {
  const SyncAckDeleteDto({this.types = const Optional.absent()});

  /// Sync entity types to delete acks for
  final Optional<List<SyncEntityType>> types;

  static SyncAckDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAckDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      types: json.containsKey(r'types')
          ? Optional.present(
              ((json[r'types'] as List?)?.map(($e) => (SyncEntityType.fromJson($e))!).toList(growable: false))!,
            )
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (types case Present(:final value)) {
      json[r'types'] = value.map(($e) => $e.toJson()).toList(growable: false);
    }
    return json;
  }

  SyncAckDeleteDto copyWith({Optional<List<SyncEntityType>>? types}) {
    return .new(types: types ?? this.types);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAckDeleteDto && types == other.types);
  }

  @override
  int get hashCode {
    return Object.hashAll([types]);
  }

  @override
  String toString() => 'SyncAckDeleteDto(types=$types)';
}
