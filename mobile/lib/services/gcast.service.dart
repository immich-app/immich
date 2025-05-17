import 'package:cast/device.dart';
import 'package:cast/session.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/cast_destination_service.interface.dart';
import 'package:immich_mobile/models/cast_manager_state.dart';
import 'package:immich_mobile/repositories/gcast.repository.dart';
import 'package:immich_mobile/utils/url_helper.dart';

final gCastServiceProvider =
    Provider((ref) => GCastService(ref.watch(gCastRepositoryProvider)));

class GCastService implements ICastDestinationService {
  final GCastRepository _gCastRepository;

  @override
  void Function(bool)? onConnectionState;
  @override
  void Function(Duration)? onCurrentTime;
  @override
  void Function(Duration)? onDuration;
  @override
  void Function(String)? onReceiverName;
  @override
  void Function(CastState)? onCastState;

  GCastService(this._gCastRepository) {
    _gCastRepository.onCastStatus = _onCastStatusCallback;
    _gCastRepository.onCastMessage = _onCastMessageCallback;
  }

  void _onCastStatusCallback(CastSessionState state) {
    if (state == CastSessionState.connected) {
      onConnectionState?.call(true);
    } else if (state == CastSessionState.closed) {
      onConnectionState?.call(false);
    }
  }

  void _onCastMessageCallback(Map<String, dynamic> message) {
    final msgType = message['type'];

    print(message);

    if (msgType == 'RECEIVER_STATUS') {
      print("Got receiver status");
    }
  }

  Future<void> connect(CastDevice device) async {
    await _gCastRepository.connect(device);
  }

  @override
  CastDestinationType getType() {
    return CastDestinationType.googleCast;
  }

  @override
  Future<bool> initialize() async {
    // check if server URL is https
    final serverUrl = punycodeDecodeUrl(Store.tryGet(StoreKey.serverEndpoint));

    return serverUrl?.startsWith("https://") ?? false;
  }

  @override
  void disconnect() {
    _gCastRepository.disconnect();
  }

  @override
  bool isAvailable() {
    // check if server URL is https
    final serverUrl = punycodeDecodeUrl(Store.tryGet(StoreKey.serverEndpoint));

    return serverUrl?.startsWith("https://") ?? false;
  }

  @override
  void loadMedia(String url, String sessionKey, bool reload) {
    // TODO: implement loadMedia
  }

  @override
  void play() {
    // TODO: implement play
  }

  @override
  void pause() {
    // TODO: implement pause
  }

  @override
  void seekTo(Duration position) {
    // TODO: implement seekTo
  }

  @override
  Future<List<(String, CastDestinationType, dynamic)>> getDevices() async {
    final dests = await _gCastRepository.listDestinations();

    return dests
        .map((device) => (device.name, CastDestinationType.googleCast, device))
        .toList(growable: false);
  }
}
