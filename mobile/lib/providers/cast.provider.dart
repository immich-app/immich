import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/services/cast.service.dart';

final castProvider = StateNotifierProvider<CastNotifier, CastManagerState>(
  (ref) => CastNotifier(ref.watch(castServiceProvider)),
);

class CastNotifier extends StateNotifier<CastManagerState> {
  // more cast providers can be added here (ie Fcast)
  final CastService _castService;

  CastNotifier(this._castService)
    : super(
        const CastManagerState(
          isCasting: false,
          currentTime: Duration.zero,
          duration: Duration.zero,
          receiverName: '',
          castState: CastState.idle,
        ),
      ) {
    _castService.onConnectionState = _onConnectionState;
    _castService.onCurrentTime = _onCurrentTime;
    _castService.onDuration = _onDuration;
    _castService.onReceiverName = _onReceiverName;
    _castService.onCastState = _onCastState;
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

  void loadMedia(RemoteAsset asset, bool reload) {
    _castService.loadMedia(asset, reload);
  }

  Future<void> connect(dynamic device) async {
    await _castService.connect(device);
  }

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() {
    return _castService.getDevices();
  }

  void toggle() {
    switch (state.castState) {
      case CastState.playing:
        pause();
      case CastState.paused:
        play();
      default:
    }
  }

  void play() {
    _castService.play();
  }

  void pause() {
    _castService.pause();
  }

  void seekTo(Duration position) {
    _castService.seekTo(position);
  }

  void stop() {
    _castService.stop();
  }

  Future<void> disconnect() async {
    await _castService.disconnect();
  }
}
