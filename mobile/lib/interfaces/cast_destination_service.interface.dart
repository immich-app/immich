import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';

abstract interface class ICastDestinationService {
  Future<bool> initialize();
  CastDestinationType getType();

  bool isAvailable();

  void Function(bool)? onConnectionState;

  void Function(Duration)? onCurrentTime;
  void Function(Duration)? onDuration;

  void Function(String)? onReceiverName;
  void Function(CastState)? onCastState;

  void loadMedia(Asset asset, bool reload);

  void play();
  void pause();
  void seekTo(Duration position);
  void disconnect();

  Future<List<(String, CastDestinationType, dynamic)>> getDevices();
}
