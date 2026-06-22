class FeatureMessageConfig {
  final int seenVersion;

  const FeatureMessageConfig({this.seenVersion = 0});

  FeatureMessageConfig copyWith({int? seenVersion}) =>
      FeatureMessageConfig(seenVersion: seenVersion ?? this.seenVersion);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is FeatureMessageConfig && other.seenVersion == seenVersion);

  @override
  int get hashCode => seenVersion.hashCode;

  @override
  String toString() => 'FeatureMessageConfig(seenVersion: $seenVersion)';
}
