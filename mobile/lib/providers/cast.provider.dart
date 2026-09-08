import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/services/cast.service.dart';

final castProvider = StateNotifierProvider<CastNotifier, CastManagerState>(
  (ref) => CastNotifier(ref.watch(castServiceProvider)),
);

class CastNotifier extends StateNotifier<CastManagerState> {
  final CastService _castService;
  StreamSubscription<CastDiscoveryUpdate>? _discovery;

  CastNotifier(this._castService)
    : super(
        const CastManagerState(
          connection: CastConnection.idle,
          currentTime: Duration.zero,
          duration: Duration.zero,
          receiverName: null,
          castState: CastState.idle,
          discoveryStatus: CastDiscoveryStatus.starting,
          devices: [],
        ),
      ) {
    _castService.onConnectionState = _onConnectionState;
    _castService.onCurrentTime = _onCurrentTime;
    _castService.onDuration = _onDuration;
    _castService.onReceiverName = _onReceiverName;
    _castService.onCastState = _onCastState;
    _discovery = _castService.discovery.listen(_onDiscovery);
  }

  void _onDiscovery(CastDiscoveryUpdate update) {
    state = state.copyWith(discoveryStatus: update.status, devices: update.devices);
  }

  @override
  void dispose() {
    unawaited(_discovery?.cancel());
    super.dispose();
  }

  void _onConnectionState(CastConnection connection) {
    state = state.copyWith(connection: connection);
  }

  void _onCurrentTime(Duration currentTime) {
    state = state.copyWith(currentTime: currentTime);
  }

  void _onDuration(Duration duration) {
    state = state.copyWith(duration: duration);
  }

  void _onReceiverName(String? receiverName) {
    state = state.copyWith(receiverName: receiverName);
  }

  void _onCastState(CastState castState) {
    state = state.copyWith(castState: castState);
  }

  void loadMedia(RemoteAsset asset, bool reload) {
    unawaited(_castService.loadMedia(asset, reload));
  }

  Future<void> connect(dynamic device) async {
    await _castService.connect(device);
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
