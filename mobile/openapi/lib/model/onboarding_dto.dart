// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OnboardingDto {
  const OnboardingDto({required this.isOnboarded});

  /// Is user onboarded
  final bool isOnboarded;

  static OnboardingDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OnboardingDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(isOnboarded: json[r'isOnboarded'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'isOnboarded'] = isOnboarded;
    return json;
  }

  OnboardingDto copyWith({bool? isOnboarded}) {
    return .new(isOnboarded: isOnboarded ?? this.isOnboarded);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is OnboardingDto && isOnboarded == other.isOnboarded);
  }

  @override
  int get hashCode {
    return Object.hashAll([isOnboarded]);
  }

  @override
  String toString() => 'OnboardingDto(isOnboarded=$isOnboarded)';
}
