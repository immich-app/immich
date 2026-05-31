// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetBulkDeleteDto {
  const AssetBulkDeleteDto({this.force = const Optional.absent(), required this.ids});

  /// Force delete even if in use
  final Optional<bool> force;

  /// IDs to process
  final List<String> ids;

  static AssetBulkDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetBulkDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      force: json.containsKey(r'force') ? Optional.present(json[r'force'] as bool) : const Optional.absent(),
      ids: ((json[r'ids'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (force case Present(:final value)) {
      json[r'force'] = value;
    }
    json[r'ids'] = ids;
    return json;
  }

  AssetBulkDeleteDto copyWith({Optional<bool>? force, List<String>? ids}) {
    return .new(force: force ?? this.force, ids: ids ?? this.ids);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetBulkDeleteDto && force == other.force && const DeepCollectionEquality().equals(ids, other.ids));
  }

  @override
  int get hashCode {
    return Object.hashAll([force, const DeepCollectionEquality().hash(ids)]);
  }

  @override
  String toString() => 'AssetBulkDeleteDto(force=$force, ids=$ids)';
}
