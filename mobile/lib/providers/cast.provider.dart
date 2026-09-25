import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:logging/logging.dart';

final castProvider = StateNotifierProvider<CastNotifier, CastManagerState>(
  (ref) => CastNotifier(ref.watch(gCastServiceProvider)),
);

class CastNotifier extends StateNotifier<CastManagerState> {
  static final _log = Logger('CastNotifier');
  // more cast providers can be added here (ie Fcast)
  final GCastService _gCastService;

  List<(String, CastDestinationType, dynamic)> discovered = List.empty();

  CastNotifier(this._gCastService)
    : super(
        const CastManagerState(
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

  void loadMedia(RemoteAsset asset, bool reload) {
    unawaited(_gCastService.loadMedia(asset, reload).catchError((Object error, StackTrace stack) {
      _log.warning('Unable to cast media', error, stack);
      if (mounted) {
        state = state.copyWith(castState: CastState.idle);
      }
    }));
  }

  void prepareMedia(RemoteAsset asset) {
    unawaited(_gCastService.prepareMedia(asset).catchError((Object error, StackTrace stack) {
      _log.fine('Unable to prepare adjacent Cast media', error, stack);
    }));
  }

  void setPhotoNeighbors(RemoteAsset current, RemoteAsset? previous, RemoteAsset? next) {
    _gCastService.setPhotoNeighbors(current, previous, next);
  }

  Future<void> connect(CastDestinationType type, dynamic device) async {
    switch (type) {
      case CastDestinationType.googleCast:
        await _gCastService.connect(device);
    }
  }

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    if (discovered.isEmpty) {
      discovered = await _gCastService.getDevices();
    }

    return discovered;
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
    _gCastService.play();
  }

  void pause() {
    _gCastService.pause();
  }

  void seekTo(Duration position) {
    _gCastService.seekTo(position);
  }

  void stop() {
    _gCastService.stop();
  }

  Future<void> disconnect() async {
    await _gCastService.disconnect();
  }
}
