// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OnboardingResponseDto {
  const OnboardingResponseDto({required this.isOnboarded});

  /// Is user onboarded
  final bool isOnboarded;

  static OnboardingResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OnboardingResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(isOnboarded: json[r'isOnboarded'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'isOnboarded'] = isOnboarded;
    return json;
  }

  OnboardingResponseDto copyWith({bool? isOnboarded}) {
    return .new(isOnboarded: isOnboarded ?? this.isOnboarded);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is OnboardingResponseDto && isOnboarded == other.isOnboarded);
  }

  @override
  int get hashCode {
    return Object.hashAll([isOnboarded]);
  }

  @override
  String toString() => 'OnboardingResponseDto(isOnboarded=$isOnboarded)';
}
