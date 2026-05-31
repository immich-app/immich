// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PartnerCreateDto {
  const PartnerCreateDto({required this.sharedWithId});

  /// User ID to share with
  final String sharedWithId;

  static PartnerCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PartnerCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(sharedWithId: json[r'sharedWithId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'sharedWithId'] = sharedWithId;
    return json;
  }

  PartnerCreateDto copyWith({String? sharedWithId}) {
    return .new(sharedWithId: sharedWithId ?? this.sharedWithId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is PartnerCreateDto && sharedWithId == other.sharedWithId);
  }

  @override
  int get hashCode {
    return Object.hashAll([sharedWithId]);
  }

  @override
  String toString() => 'PartnerCreateDto(sharedWithId=$sharedWithId)';
}
