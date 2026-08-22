import 'package:freezed_annotation/freezed_annotation.dart';

part 'advanced_config.freezed.dart';

@freezed
abstract class AdvancedConfig with _$AdvancedConfig {
  const factory AdvancedConfig({
    @Default(false) bool troubleshooting,
    @Default(true) bool enableHapticFeedback,
    @Default(false) bool readonlyModeEnabled,
  }) = _AdvancedConfig;
}
