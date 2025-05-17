import 'package:immich_mobile/models/cast_manager_state.dart';

abstract interface class ICastDestinationService {
  Future<bool> initialize();
  CastDestinationType getType();

  bool isAvailable();

  void Function(bool)? onConnectionState;

  void Function(Duration)? onCurrentTime;
  void Function(Duration)? onDuration;

  void Function(String)? onReceiverName;
  void Function(CastState)? onCastState;

  void loadMedia(String url, String sessionKey, bool reload);

  void play();
  void pause();
  void seekTo(Duration position);
  void disconnect();

  Future<List<(String, CastDestinationType, dynamic)>> getDevices();
}
