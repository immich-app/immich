// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DuplicateResolveDto {
  const DuplicateResolveDto({required this.groups});

  /// List of duplicate groups to resolve
  final List<DuplicateResolveGroupDto> groups;

  static DuplicateResolveDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DuplicateResolveDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      groups: ((json[r'groups'] as List?)
          ?.map(($e) => (DuplicateResolveGroupDto.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'groups'] = groups.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  DuplicateResolveDto copyWith({List<DuplicateResolveGroupDto>? groups}) {
    return .new(groups: groups ?? this.groups);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DuplicateResolveDto && const DeepCollectionEquality().equals(groups, other.groups));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(groups)]);
  }

  @override
  String toString() => 'DuplicateResolveDto(groups=$groups)';
}
