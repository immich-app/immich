// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PersonStatisticsResponseDto {
  const PersonStatisticsResponseDto({required this.assets});

  /// Number of assets
  final int assets;

  static PersonStatisticsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PersonStatisticsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assets: json[r'assets'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assets'] = assets;
    return json;
  }

  PersonStatisticsResponseDto copyWith({int? assets}) {
    return .new(assets: assets ?? this.assets);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is PersonStatisticsResponseDto && assets == other.assets);
  }

  @override
  int get hashCode {
    return Object.hashAll([assets]);
  }

  @override
  String toString() => 'PersonStatisticsResponseDto(assets=$assets)';
}
