// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PeopleUpdateItem {
  const PeopleUpdateItem({
    this.birthDate,
    this.color,
    this.featureFaceAssetId,
    required this.id,
    this.isFavorite,
    this.isHidden,
    this.name,
  });

  /// Person date of birth
  final DateTime? birthDate;

  /// Person color (hex)
  final String? color;

  /// Asset ID used for feature face thumbnail
  final String? featureFaceAssetId;

  /// Person ID
  final String id;

  /// Mark as favorite
  final bool? isFavorite;

  /// Person visibility (hidden)
  final bool? isHidden;

  /// Person name
  final String? name;

  static const _undefined = Object();

  static PeopleUpdateItem? fromJson(dynamic value) {
    ApiCompat.upgrade<PeopleUpdateItem>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      birthDate: (json[r'birthDate'] == null ? null : DateTime.parse(json[r'birthDate'] as String)),
      color: (json[r'color'] as String?),
      featureFaceAssetId: (json[r'featureFaceAssetId'] as String?),
      id: json[r'id'] as String,
      isFavorite: (json[r'isFavorite'] as bool?),
      isHidden: (json[r'isHidden'] as bool?),
      name: (json[r'name'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (birthDate != null) {
      json[r'birthDate'] = birthDate!.toUtc().toIso8601String();
    }
    if (color != null) {
      json[r'color'] = color!;
    }
    if (featureFaceAssetId != null) {
      json[r'featureFaceAssetId'] = featureFaceAssetId!;
    }
    json[r'id'] = id;
    if (isFavorite != null) {
      json[r'isFavorite'] = isFavorite!;
    }
    if (isHidden != null) {
      json[r'isHidden'] = isHidden!;
    }
    if (name != null) {
      json[r'name'] = name!;
    }
    return json;
  }

  PeopleUpdateItem copyWith({
    Object? birthDate = _undefined,
    Object? color = _undefined,
    Object? featureFaceAssetId = _undefined,
    String? id,
    Object? isFavorite = _undefined,
    Object? isHidden = _undefined,
    Object? name = _undefined,
  }) {
    return .new(
      birthDate: identical(birthDate, _undefined) ? this.birthDate : birthDate as DateTime?,
      color: identical(color, _undefined) ? this.color : color as String?,
      featureFaceAssetId: identical(featureFaceAssetId, _undefined)
          ? this.featureFaceAssetId
          : featureFaceAssetId as String?,
      id: id ?? this.id,
      isFavorite: identical(isFavorite, _undefined) ? this.isFavorite : isFavorite as bool?,
      isHidden: identical(isHidden, _undefined) ? this.isHidden : isHidden as bool?,
      name: identical(name, _undefined) ? this.name : name as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PeopleUpdateItem &&
            birthDate == other.birthDate &&
            color == other.color &&
            featureFaceAssetId == other.featureFaceAssetId &&
            id == other.id &&
            isFavorite == other.isFavorite &&
            isHidden == other.isHidden &&
            name == other.name);
  }

  @override
  int get hashCode {
    return Object.hashAll([birthDate, color, featureFaceAssetId, id, isFavorite, isHidden, name]);
  }

  @override
  String toString() =>
      'PeopleUpdateItem(birthDate=$birthDate, color=$color, featureFaceAssetId=$featureFaceAssetId, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name)';
}
