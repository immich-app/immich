import 'package:freezed_annotation/freezed_annotation.dart';

part 'cast_manager_state.freezed.dart';

enum CastDestinationType { googleCast, fCast }

enum CastState { idle, playing, paused, buffering }

typedef CastDestination = (String name, CastDestinationType type, dynamic device);

@freezed
abstract class CastManagerState with _$CastManagerState {
  const factory CastManagerState({
    required bool isCasting,
    required String? receiverName,
    required CastState castState,
    required Duration currentTime,
    required Duration duration,
  }) = _CastManagerState;
}
