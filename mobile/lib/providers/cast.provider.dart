import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart' as old_asset_entity;
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/services/gcast.service.dart';

final castProvider = StateNotifierProvider<CastNotifier, CastManagerState>(
  (ref) => CastNotifier(ref.watch(gCastServiceProvider)),
);

class CastNotifier extends StateNotifier<CastManagerState> {
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
    _gCastService.loadMedia(asset, reload);
  }

  // TODO: remove this when we migrate to new timeline
  void loadMediaOld(old_asset_entity.Asset asset, bool reload) {
    final remoteAsset = RemoteAsset(
      id: asset.remoteId.toString(),
      name: asset.name,
      ownerId: asset.ownerId.toString(),
      checksum: asset.checksum,
      type: asset.type == old_asset_entity.AssetType.image
          ? AssetType.image
          : asset.type == old_asset_entity.AssetType.video
              ? AssetType.video
              : AssetType.other,
      createdAt: asset.fileCreatedAt,
      updatedAt: asset.updatedAt,
    );

    _gCastService.loadMedia(remoteAsset, reload);
  }

  Future<void> connect(CastDestinationType type, dynamic device) async {
    switch (type) {
      case CastDestinationType.googleCast:
        await _gCastService.connect(device);
        break;
    }
  }

  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    if (discovered.isEmpty) {
      discovered = await _gCastService.getDevices();
    }

    return discovered;
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
