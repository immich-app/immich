import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/network.service.dart';

final networkProvider = StateNotifierProvider<NetworkNotifier, String>((ref) {
  return NetworkNotifier(
    ref.watch(networkServiceProvider),
  );
});

class NetworkNotifier extends StateNotifier<String> {
  final NetworkService _networkService;

  NetworkNotifier(this._networkService) : super('');

  Future<String?> getWifiName() {
    return _networkService.getWifiName();
  }

  Future<bool> getWifiReadPermission() {
    return _networkService.getLocationWhenInUserPermission();
  }

  Future<bool> getWifiReadBackgroundPermission() {
    return _networkService.getLocationAlwaysPermission();
  }

  Future<bool> requestWifiReadPermission() {
    return _networkService.requestLocationWhenInUsePermission();
  }

  Future<bool> requestWifiReadBackgroundPermission() {
    return _networkService.requestLocationAlwaysPermission();
  }

  Future<bool> openSettings() {
    return _networkService.openSettings();
  }
}
