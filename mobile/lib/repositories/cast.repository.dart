import 'dart:async';
import 'package:fcast_sender_sdk/fcast_sender_sdk.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';

typedef CastDiscovery = ({CastDiscoveryStatus status, List<(DeviceInfo, int?)> devices});

final castRepositoryProvider = Provider((_) => CastRepository());

class CastRepository {
  CastContext? _castContext;
  CastingDevice? _activeDevice;
  Future<void>? _initialized;

  void Function(DeviceConnectionState)? onConnectionState;
  void Function(DeviceEvent)? onDeviceEvent;

  final Map<(String, ProtocolType), (DeviceInfo, int?)> _discoveredDevices = {};
  final StreamController<CastDiscovery> _discoveryController = StreamController.broadcast();
  CastDiscovery _discovery = (status: CastDiscoveryStatus.starting, devices: const []);
  int _currentDeviceGeneration = 0;

  Stream<CastDiscovery> get discovery => Stream.multi((controller) {
    controller.add(_discovery);
    unawaited(controller.addStream(_discoveryController.stream));
  });

  void init() {
    unawaited(ensureInitialized());
  }

  Future<void> ensureInitialized() => _initialized ??= _initialize();

  Future<void> connect(DeviceInfo deviceInfo) async {
    await ensureInitialized();

    final castContext = _castContext;
    if (castContext == null) {
      throw StateError('Cast SDK failed to initialize, cannot connect');
    }

    _activeDevice?.disconnect();
    final device = castContext.createDeviceFromInfo(info: deviceInfo);
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

  Future<void> _initialize() async {
    try {
      await FCastSenderSdkLib.init();
      _castContext = CastContext();

      final discoverer = DeviceDiscoverer();
      discoverer.eventStreamController.stream.listen(_onDiscoveryEvent);

      await discoverer.init();

      _emitDiscovery(CastDiscoveryStatus.active);
    } catch (_) {
      _emitDiscovery(CastDiscoveryStatus.failed);
      rethrow;
    }
  }

  void _emitDiscovery(CastDiscoveryStatus status) {
    _discovery = (status: status, devices: _discoveredDevices.values.toList(growable: false));
    _discoveryController.add(_discovery);
  }

  void _onDiscoveryEvent(dynamic event) {
    switch (event) {
      case DiscoveryEventDeviceAdded(:final deviceInfo, :final gcastCaps) ||
          DiscoveryEventDeviceUpdated(:final deviceInfo, :final gcastCaps):
        _discoveredDevices[(deviceInfo.name, deviceInfo.protocol)] = (deviceInfo, gcastCaps);
      case DiscoveryEventDeviceRemoved(:final name):
        _discoveredDevices.removeWhere((_, value) => _castRemovalMatches(value.$1, name));
    }

    _emitDiscovery(_discovery.status);
  }
}

bool _castRemovalMatches(DeviceInfo device, String removedName) {
  final id = device.txtRecords['id'];

  if (id != null && id.isNotEmpty) {
    return removedName.endsWith(id);
  }

  return device.name == removedName;
}
