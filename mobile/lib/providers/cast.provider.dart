import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/cast_manager_state.dart';
import 'package:immich_mobile/services/gcast.service.dart';

final castProvider = StateNotifierProvider<CastNotifier, CastManagerState>(
  (ref) => CastNotifier(ref.watch(gCastServiceProvider)),
);

class CastNotifier extends StateNotifier<CastManagerState> {
  final GCastService _gCastService;

  CastNotifier(this._gCastService)
      : super(
          CastManagerState(
            isCasting: false,
            currentTime: Duration.zero,
            duration: Duration.zero,
            receiverName: '',
            castState: CastState.idle,
          ),
        ) {
    _gCastService.onConnectionState = _onConnectionState;
    _gCastService.onCurrentTime = _onCurrentTime;
    _gCastService.onDuration = _onDuration;
    _gCastService.onReceiverName = _onReceiverName;
    _gCastService.onCastState = _onCastState;
  }

  void _onConnectionState(bool isCasting) {
    state = state.copyWith(isCasting: isCasting);
  }

  void _onCurrentTime(Duration currentTime) {
    state = state.copyWith(currentTime: currentTime);
  }

  void _onDuration(Duration duration) {
    state = state.copyWith(duration: duration);
  }

  void _onReceiverName(String receiverName) {
    state = state.copyWith(receiverName: receiverName);
  }

  void _onCastState(CastState castState) {
    state = state.copyWith(castState: castState);
  }

  void loadMedia(String url, String sessionKey, bool reload) {
    _gCastService.loadMedia(url, sessionKey, reload);
  }

  Future<void> connect(CastDestinationType type, dynamic device) async {
    switch (type) {
      case CastDestinationType.googleCast:
        await _gCastService.connect(device);
        break;
    }
  }

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    // return _gCastService.getDevices();
    // delay for 2 seconds to simulate loading
    await Future.delayed(const Duration(seconds: 2));

    return Future<List<(String, CastDestinationType, dynamic)>>.value([
      ('Google Cast', CastDestinationType.googleCast, null),
      ('Apple TV', CastDestinationType.googleCast, null),
      ('Roku', CastDestinationType.googleCast, null),
      ('Fire TV', CastDestinationType.googleCast, null),
    ]);
  }

  void play() {
    _gCastService.play();
  }

  void pause() {
    _gCastService.pause();
  }

  void seekTo(Duration position) {
    _gCastService.seekTo(position);
  }

  void disconnect() {
    _gCastService.disconnect();
  }
}
