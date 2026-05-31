// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AdminOnboardingUpdateDto {
  const AdminOnboardingUpdateDto({required this.isOnboarded});

  /// Is admin onboarded
  final bool isOnboarded;

  static AdminOnboardingUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AdminOnboardingUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(isOnboarded: json[r'isOnboarded'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'isOnboarded'] = isOnboarded;
    return json;
  }

  AdminOnboardingUpdateDto copyWith({bool? isOnboarded}) {
    return .new(isOnboarded: isOnboarded ?? this.isOnboarded);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AdminOnboardingUpdateDto && isOnboarded == other.isOnboarded);
  }

  @override
  int get hashCode {
    return Object.hashAll([isOnboarded]);
  }

  @override
  String toString() => 'AdminOnboardingUpdateDto(isOnboarded=$isOnboarded)';
}
