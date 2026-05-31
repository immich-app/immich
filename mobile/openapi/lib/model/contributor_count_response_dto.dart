// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ContributorCountResponseDto {
  const ContributorCountResponseDto({required this.assetCount, required this.userId});

  /// Number of assets contributed
  final int assetCount;

  /// User ID
  final String userId;

  static ContributorCountResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ContributorCountResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetCount: json[r'assetCount'] as int, userId: json[r'userId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetCount'] = assetCount;
    json[r'userId'] = userId;
    return json;
  }

  ContributorCountResponseDto copyWith({int? assetCount, String? userId}) {
    return .new(assetCount: assetCount ?? this.assetCount, userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ContributorCountResponseDto && assetCount == other.assetCount && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetCount, userId]);
  }

  @override
  String toString() => 'ContributorCountResponseDto(assetCount=$assetCount, userId=$userId)';
}
