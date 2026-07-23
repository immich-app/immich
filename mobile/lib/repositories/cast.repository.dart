import 'dart:async';
import 'package:fcast_sender_sdk/fcast_sender_sdk.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final castRepositoryProvider = Provider((_) => CastRepository());

class CastRepository {
  CastContext? _castContext;
  CastingDevice? _device;

  void Function(DeviceConnectionState)? onConnectionState;
  void Function(DeviceEvent)? onDeviceEvent;

  final Map<(String, ProtocolType), (DeviceInfo, int?)> _discoveredDevices = {};
  int _currentDeviceGeneration = 0;
  Future<void>? _initialized;

  Future<void> connect(DeviceInfo deviceInfo) async {
    await _ensureInitialized();

    _device?.disconnect();
    final device = _castContext!.createDeviceFromInfo(info: deviceInfo);
    _device = device;

    final thisDeviceGeneration = ++_currentDeviceGeneration;
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
    final device = _device;
    if (device == null) {
      return;
    }

    _device = null;
    _currentDeviceGeneration++;

    if (device.isReady()) {
      device.stopPlayback();

      await Future.delayed(const Duration(milliseconds: 500));
    }

    device.disconnect();
    onConnectionState?.call(const DeviceConnectionState.disconnected());
  }

  void loadMedia(LoadRequest request) => _device?.load(request: request);
  void play() => _device?.resumePlayback();
  void pause() => _device?.pausePlayback();
  void stop() => _device?.stopPlayback();
  void seekTo(Duration position) => _device?.seek(timeSeconds: position.inMilliseconds / 1000);

  Future<List<(DeviceInfo, int?)>> listDestinations() async {
    final isFirstScan = _initialized == null;
    await _ensureInitialized();

    if (isFirstScan) {
      await Future.delayed(const Duration(seconds: 3));
    }

    return _discoveredDevices.values.toList(growable: false);
  }

  Future<void> _ensureInitialized() => _initialized ??= _initialize();

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
  }
}
