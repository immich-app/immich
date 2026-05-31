// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncPersonDeleteV1 {
  const SyncPersonDeleteV1({required this.personId});

  /// Person ID
  final String personId;

  static SyncPersonDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncPersonDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(personId: json[r'personId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'personId'] = personId;
    return json;
  }

  SyncPersonDeleteV1 copyWith({String? personId}) {
    return .new(personId: personId ?? this.personId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncPersonDeleteV1 && personId == other.personId);
  }

  @override
  int get hashCode {
    return Object.hashAll([personId]);
  }

  @override
  String toString() => 'SyncPersonDeleteV1(personId=$personId)';
}
