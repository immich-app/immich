// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class FaceDto {
  const FaceDto({required this.id});

  /// Face ID
  final String id;

  static FaceDto? fromJson(dynamic value) {
    ApiCompat.upgrade<FaceDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(id: json[r'id'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'id'] = id;
    return json;
  }

  FaceDto copyWith({String? id}) {
    return .new(id: id ?? this.id);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is FaceDto && id == other.id);
  }

  @override
  int get hashCode {
    return Object.hashAll([id]);
  }

  @override
  String toString() => 'FaceDto(id=$id)';
}
