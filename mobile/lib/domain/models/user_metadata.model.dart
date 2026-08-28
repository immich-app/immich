// ignore_for_file: annotate_overrides

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
class const Onboarding({required final bool isOnboarded}) with _$Onboarding {
  factory Onboarding.fromMap(Map<String, Object?> map) {
    return Onboarding(isOnboarded: map["isOnboarded"]! as bool);
  }
}

@freezed
class const Preferences({
  final bool foldersEnabled = false,
  final bool memoriesEnabled = true,
  final bool peopleEnabled = true,
  final bool ratingsEnabled = false,
  final bool sharedLinksEnabled = true,
  final bool tagsEnabled = false,
  final AvatarColor userAvatarColor = .primary,
  final bool showSupportBadge = true,
  final int minimumFaces = 3,
}) with _$Preferences {
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
class const License({
  required final DateTime activatedAt,
  required final String activationKey,
  required final String licenseKey,
}) with _$License {
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
