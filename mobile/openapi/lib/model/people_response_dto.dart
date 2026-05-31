// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// People response
final class PeopleResponseDto {
  const PeopleResponseDto({this.hasNextPage, required this.hidden, required this.people, required this.total});

  /// Whether there are more pages
  /// Available since server v1.110.0.
  final bool? hasNextPage;

  /// Number of hidden people
  final int hidden;

  final List<PersonResponseDto> people;

  /// Total number of people
  final int total;

  static const _undefined = Object();

  static const ApiVersion hasNextPageAddedIn = .new(1, 110, 0);

  static const ApiState hasNextPageState = .stable;

  static PeopleResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PeopleResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      hasNextPage: (json[r'hasNextPage'] as bool?),
      hidden: json[r'hidden'] as int,
      people: ((json[r'people'] as List?)?.map(($e) => (PersonResponseDto.fromJson($e))!).toList(growable: false))!,
      total: json[r'total'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (hasNextPage != null) {
      json[r'hasNextPage'] = hasNextPage!;
    }
    json[r'hidden'] = hidden;
    json[r'people'] = people.map(($e) => $e.toJson()).toList(growable: false);
    json[r'total'] = total;
    return json;
  }

  PeopleResponseDto copyWith({
    Object? hasNextPage = _undefined,
    int? hidden,
    List<PersonResponseDto>? people,
    int? total,
  }) {
    return .new(
      hasNextPage: identical(hasNextPage, _undefined) ? this.hasNextPage : hasNextPage as bool?,
      hidden: hidden ?? this.hidden,
      people: people ?? this.people,
      total: total ?? this.total,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PeopleResponseDto &&
            hasNextPage == other.hasNextPage &&
            hidden == other.hidden &&
            const DeepCollectionEquality().equals(people, other.people) &&
            total == other.total);
  }

  @override
  int get hashCode {
    return Object.hashAll([hasNextPage, hidden, const DeepCollectionEquality().hash(people), total]);
  }

  @override
  String toString() => 'PeopleResponseDto(hasNextPage=$hasNextPage, hidden=$hidden, people=$people, total=$total)';
}
