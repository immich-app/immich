import 'package:immich_mobile/utils/semver.dart';

class FeatureMessageConfig {
  final SemVer seenRelease;

  const FeatureMessageConfig({this.seenRelease = const SemVer(major: 0, minor: 0, patch: 0)});

  FeatureMessageConfig copyWith({SemVer? seenRelease}) =>
      FeatureMessageConfig(seenRelease: seenRelease ?? this.seenRelease);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is FeatureMessageConfig && other.seenRelease == seenRelease);

  @override
  int get hashCode => seenRelease.hashCode;

  @override
  String toString() => 'FeatureMessageConfig(seenRelease: $seenRelease)';
}
