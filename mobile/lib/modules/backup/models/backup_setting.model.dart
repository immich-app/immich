class BackupSetting {
  final bool autoBackup;
  final bool backgroundBackup;
  final bool backupRequireWifi;
  final bool backupRequireCharging;
  final int backupTriggerDelay;

  const BackupSetting({
    required this.autoBackup,
    required this.backgroundBackup,
    required this.backupRequireWifi,
    required this.backupRequireCharging,
    required this.backupTriggerDelay,
  });

  BackupSetting copyWith({
    bool? autoBackup,
    bool? backgroundBackup,
    bool? backupRequireWifi,
    bool? backupRequireCharging,
    int? backupTriggerDelay,
  }) {
    return BackupSetting(
      autoBackup: autoBackup ?? this.autoBackup,
      backgroundBackup: backgroundBackup ?? this.backgroundBackup,
      backupRequireWifi: backupRequireWifi ?? this.backupRequireWifi,
      backupRequireCharging:
          backupRequireCharging ?? this.backupRequireCharging,
      backupTriggerDelay: backupTriggerDelay ?? this.backupTriggerDelay,
    );
  }

  @override
  String toString() {
    return 'BackupSettings(autoBackup: $autoBackup, backgroundBackup: $backgroundBackup, backupRequireWifi: $backupRequireWifi, backupRequireCharging: $backupRequireCharging, backupTriggerDelay: $backupTriggerDelay)';
  }

  @override
  bool operator ==(covariant BackupSetting other) {
    if (identical(this, other)) return true;

    return other.autoBackup == autoBackup &&
        other.backgroundBackup == backgroundBackup &&
        other.backupRequireWifi == backupRequireWifi &&
        other.backupRequireCharging == backupRequireCharging &&
        other.backupTriggerDelay == backupTriggerDelay;
  }

  @override
  int get hashCode {
    return autoBackup.hashCode ^
        backgroundBackup.hashCode ^
        backupRequireWifi.hashCode ^
        backupRequireCharging.hashCode ^
        backupTriggerDelay.hashCode;
  }
}
