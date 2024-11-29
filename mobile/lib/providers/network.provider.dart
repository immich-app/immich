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

  Future<String?> getWifiName() async {
    return _networkService.getWifiName();
  }

  Future<void> getWifiReadPermission() {
    return _networkService.getWifiReadPermission();
  }
}
