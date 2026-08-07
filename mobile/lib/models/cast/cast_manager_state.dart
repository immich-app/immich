import 'package:fcast_sender_sdk/fcast_sender_sdk.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'cast_manager_state.freezed.dart';

enum CastDestinationType { googleCast, fCast }

enum CastState {
  idle,
  playing,
  paused,
  buffering;

  static CastState fromPlaybackState(PlaybackState state) => switch (state) {
    PlaybackState.playing => CastState.playing,
    PlaybackState.paused => CastState.paused,
    PlaybackState.buffering => CastState.buffering,
    PlaybackState.idle || PlaybackState.ended => CastState.idle,
  };
}

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
