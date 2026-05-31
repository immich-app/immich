// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OnThisDayDto {
  const OnThisDayDto({required this.year});

  /// Year for on this day memory
  final int year;

  static OnThisDayDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OnThisDayDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(year: json[r'year'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'year'] = year;
    return json;
  }

  OnThisDayDto copyWith({int? year}) {
    return .new(year: year ?? this.year);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is OnThisDayDto && year == other.year);
  }

  @override
  int get hashCode {
    return Object.hashAll([year]);
  }

  @override
  String toString() => 'OnThisDayDto(year=$year)';
}
