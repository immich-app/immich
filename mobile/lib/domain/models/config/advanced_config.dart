class AdvancedConfig {
  final bool troubleshooting;
  final bool enableHapticFeedback;
  final bool readonlyModeEnabled;

  const AdvancedConfig({
    this.troubleshooting = false,
    this.enableHapticFeedback = true,
    this.readonlyModeEnabled = false,
  });

  AdvancedConfig copyWith({bool? troubleshooting, bool? enableHapticFeedback, bool? readonlyModeEnabled}) =>
      AdvancedConfig(
        troubleshooting: troubleshooting ?? this.troubleshooting,
        enableHapticFeedback: enableHapticFeedback ?? this.enableHapticFeedback,
        readonlyModeEnabled: readonlyModeEnabled ?? this.readonlyModeEnabled,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AdvancedConfig &&
          other.troubleshooting == troubleshooting &&
          other.enableHapticFeedback == enableHapticFeedback &&
          other.readonlyModeEnabled == readonlyModeEnabled);

  @override
  int get hashCode => Object.hash(troubleshooting, enableHapticFeedback, readonlyModeEnabled);

  @override
  String toString() =>
      'AdvancedConfig(troubleshooting: $troubleshooting, enableHapticFeedback: $enableHapticFeedback, readonlyModeEnabled: $readonlyModeEnabled)';
}
