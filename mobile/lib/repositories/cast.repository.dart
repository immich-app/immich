import 'dart:async';
import 'package:fcast_sender_sdk/fcast_sender_sdk.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final castRepositoryProvider = Provider((_) => CastRepository());

class CastRepository {
  CastContext? _castContext;
  CastingDevice? _activeDevice;

  void Function(DeviceConnectionState)? onConnectionState;
  void Function(DeviceEvent)? onDeviceEvent;

  final Map<(String, ProtocolType), (DeviceInfo, int?)> _discoveredDevices = {};
  int _currentDeviceGeneration = 0;
  late final Future<void> _initialized;

  void init() {
    _initialized = _initialize();
  }

  Future<void> connect(DeviceInfo deviceInfo) async {
    _activeDevice?.disconnect();
    final device = _castContext!.createDeviceFromInfo(info: deviceInfo);
    _activeDevice = device;

    _currentDeviceGeneration += 1;
    final thisDeviceGeneration = _currentDeviceGeneration;
    device.connect(
      eventHandler: DeviceEventHandler(
        onEvent: (event) {
          if (thisDeviceGeneration != _currentDeviceGeneration) {
            return;
          }

          if (event is DeviceEvent_ConnectionStateChanged) {
            onConnectionState?.call(event.newState);
          }

          onDeviceEvent?.call(event);
        },
      ),
      reconnectIntervalMillis: 1000,
    );
  }

  Future<void> disconnect() async {
    final previousDevice = _activeDevice;
    if (previousDevice == null) {
      return;
    }

    _activeDevice = null;
    _currentDeviceGeneration += 1;

    if (previousDevice.isReady()) {
      previousDevice.stopPlayback();

      await Future.delayed(const Duration(milliseconds: 500));
    }

    previousDevice.disconnect();
    onConnectionState?.call(const DeviceConnectionState.disconnected());
  }

  void loadMedia(LoadRequest request) => _activeDevice?.load(request: request);
  void play() => _activeDevice?.resumePlayback();
  void pause() => _activeDevice?.pausePlayback();
  void stop() => _activeDevice?.stopPlayback();
  void seekTo(Duration position) => _activeDevice?.seek(timeSeconds: position.inSeconds.toDouble());

  Future<List<(DeviceInfo, int?)>> listDestinations() async {
    await _initialized;

    return _discoveredDevices.values.toList(growable: false);
  }

  Future<void> _initialize() async {
    await FCastSenderSdkLib.init();
    _castContext = CastContext();

    final discoverer = DeviceDiscoverer();
    discoverer.eventStreamController.stream.listen((event) {
      switch (event) {
        case DiscoveryEventDeviceAdded(:final deviceInfo, :final gcastCaps) ||
            DiscoveryEventDeviceUpdated(:final deviceInfo, :final gcastCaps):
          _discoveredDevices[(deviceInfo.name, deviceInfo.protocol)] = (deviceInfo, gcastCaps);
        case DiscoveryEventDeviceRemoved():
          _discoveredDevices.removeWhere((key, _) => key.$1 == event.name);
      }
    });

    await discoverer.init();
    await Future.delayed(const Duration(seconds: 3));
  }
}
