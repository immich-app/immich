import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/semver.dart';

part 'feature_message_config.freezed.dart';

@freezed
abstract class FeatureMessageConfig with _$FeatureMessageConfig {
  const factory FeatureMessageConfig({@Default(SemVer(major: 0, minor: 0, patch: 0)) SemVer seenRelease}) =
      _FeatureMessageConfig;
}
