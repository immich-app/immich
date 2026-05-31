// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AvatarUpdate {
  const AvatarUpdate({this.color});

  final UserAvatarColor? color;

  static const _undefined = Object();

  static AvatarUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<AvatarUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(color: UserAvatarColor.fromJson(json[r'color']));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (color != null) {
      json[r'color'] = color!.toJson();
    }
    return json;
  }

  AvatarUpdate copyWith({Object? color = _undefined}) {
    return .new(color: identical(color, _undefined) ? this.color : color as UserAvatarColor?);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AvatarUpdate && color == other.color);
  }

  @override
  int get hashCode {
    return Object.hashAll([color]);
  }

  @override
  String toString() => 'AvatarUpdate(color=$color)';
}
