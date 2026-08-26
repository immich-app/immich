// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'log.model.freezed.dart';

/// Log levels according to dart logging [Level]
enum LogLevel { all, finest, finer, fine, config, info, warning, severe, shout, off }

@freezed
class const LogMessage({
  required final String message,
  required final LogLevel level,
  required final DateTime createdAt,
  final String? logger,
  final String? error,
  final String? stack,
}) with _$LogMessage;
