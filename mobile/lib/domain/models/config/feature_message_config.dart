// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/semver.dart';

part 'feature_message_config.freezed.dart';

@freezed
class const FeatureMessageConfig({final SemVer seenRelease = const .new(major: 0, minor: 0, patch: 0)})
    with _$FeatureMessageConfig;
