// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'cast_manager_state.freezed.dart';

enum CastDestinationType { googleCast }

enum CastState { idle, playing, paused, buffering }

@freezed
class const CastManagerState({
  required final bool isCasting,
  required final String receiverName,
  required final CastState castState,
  required final Duration currentTime,
  required final Duration duration,
}) with _$CastManagerState;
