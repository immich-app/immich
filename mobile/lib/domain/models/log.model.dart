import 'package:freezed_annotation/freezed_annotation.dart';

part 'log.model.freezed.dart';

/// Log levels according to dart logging [Level]
enum LogLevel { all, finest, finer, fine, config, info, warning, severe, shout, off }

@freezed
abstract class LogMessage with _$LogMessage {
  const factory LogMessage({
    required String message,
    required LogLevel level,
    required DateTime createdAt,
    String? logger,
    String? error,
    String? stack,
  }) = _LogMessage;
}
