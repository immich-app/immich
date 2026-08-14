import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

part 'user_metadata.model.freezed.dart';

enum UserMetadataKey {
  // do not change this order!
  onboarding,
  preferences,
  license,
}

@freezed
abstract class Onboarding with _$Onboarding {
  const Onboarding._();

  const factory Onboarding({required bool isOnboarded}) = _Onboarding;

  factory Onboarding.fromMap(Map<String, Object?> map) {
    return Onboarding(isOnboarded: map["isOnboarded"]! as bool);
  }
}

@freezed
abstract class Preferences with _$Preferences {
  const Preferences._();

  const factory Preferences({
    @Default(false) bool foldersEnabled,
    @Default(true) bool memoriesEnabled,
    @Default(true) bool peopleEnabled,
    @Default(false) bool ratingsEnabled,
    @Default(true) bool sharedLinksEnabled,
    @Default(false) bool tagsEnabled,
    @Default(AvatarColor.primary) AvatarColor userAvatarColor,
    @Default(true) bool showSupportBadge,
    @Default(3) int minimumFaces,
  }) = _Preferences;

  factory Preferences.fromMap(Map<String, Object?> map) {
    return Preferences(
      foldersEnabled: (map["folders"] as Map<String, Object?>?)?["enabled"] as bool? ?? false,
      memoriesEnabled: (map["memories"] as Map<String, Object?>?)?["enabled"] as bool? ?? true,
      peopleEnabled: (map["people"] as Map<String, Object?>?)?["enabled"] as bool? ?? true,
      ratingsEnabled: (map["ratings"] as Map<String, Object?>?)?["enabled"] as bool? ?? false,
      sharedLinksEnabled: (map["sharedLinks"] as Map<String, Object?>?)?["enabled"] as bool? ?? true,
      tagsEnabled: (map["tags"] as Map<String, Object?>?)?["enabled"] as bool? ?? false,
      userAvatarColor: AvatarColor.values.firstWhere(
        (e) => e.value == (map["avatar"] as Map<String, Object?>?)?["color"] as String?,
        orElse: () => AvatarColor.primary,
      ),
      showSupportBadge: (map["purchase"] as Map<String, Object?>?)?["showSupportBadge"] as bool? ?? true,
      minimumFaces: (map["people"] as Map<String, Object?>?)?["minimumFaces"] as int? ?? 3,
    );
  }
}

@freezed
abstract class License with _$License {
  const License._();

  const factory License({required DateTime activatedAt, required String activationKey, required String licenseKey}) =
      _License;

  factory License.fromMap(Map<String, Object?> map) {
    return License(
      activatedAt: DateTime.parse(map["activatedAt"]! as String),
      activationKey: map["activationKey"]! as String,
      licenseKey: map["licenseKey"]! as String,
    );
  }
}

// Model for a user metadata stored in the server
@freezed
abstract class UserMetadata with _$UserMetadata {
  @Assert(
    'onboarding != null || preferences != null || license != null',
    'One of onboarding, preferences and license must be provided',
  )
  const factory UserMetadata({
    required String userId,
    required UserMetadataKey key,
    Onboarding? onboarding,
    Preferences? preferences,
    License? license,
  }) = _UserMetadata;
}
