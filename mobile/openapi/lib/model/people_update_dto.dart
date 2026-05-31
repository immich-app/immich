// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PeopleUpdateDto {
  const PeopleUpdateDto({required this.people});

  /// People to update
  final List<PeopleUpdateItem> people;

  static PeopleUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PeopleUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      people: ((json[r'people'] as List?)?.map(($e) => (PeopleUpdateItem.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'people'] = people.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  PeopleUpdateDto copyWith({List<PeopleUpdateItem>? people}) {
    return .new(people: people ?? this.people);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PeopleUpdateDto && const DeepCollectionEquality().equals(people, other.people));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(people)]);
  }

  @override
  String toString() => 'PeopleUpdateDto(people=$people)';
}
