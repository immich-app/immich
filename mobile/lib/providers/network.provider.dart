import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/network.service.dart';

final networkProvider = StateNotifierProvider<NetworkNotifier, String>((ref) {
  return NetworkNotifier(
    ref.watch(networkServiceProvider),
    ref.watch(authServiceProvider),
  );
});

class NetworkNotifier extends StateNotifier<String> {
  final NetworkService _networkService;
  final AuthService _authService;

  NetworkNotifier(this._networkService, this._authService) : super('');

  Future<String?> getWifiName() async {
    return _networkService.getWifiName();
  }

  Future<void> getWifiReadPermission() {
    return _networkService.getWifiReadPermission();
  }

  String? discoverServerEndpoint() {
    final currentEndpoint = Store.get(StoreKey.serverEndpoint);

    // Accept any path after the port while maintaining HTTP-only and valid IP validation.
    final isLocalIpFormat = RegExp(
      r'^http:\/\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?(?:\/.*)?$',
    ).hasMatch(currentEndpoint);

    if (!isLocalIpFormat) {
      return null;
    }

    return currentEndpoint;
  }
}
