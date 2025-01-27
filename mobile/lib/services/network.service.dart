import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/network.interface.dart';
import 'package:immich_mobile/repositories/network.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';

final networkServiceProvider = Provider((ref) {
  return NetworkService(
    ref.watch(networkRepositoryProvider),
    ref.watch(permissionRepositoryProvider),
  );
});

class NetworkService {
  final INetworkRepository _repository;
  final IPermissionRepository _permissionRepository;

  NetworkService(this._repository, this._permissionRepository);

  Future<bool> getLocationWhenInUserPermission() {
    return _permissionRepository.hasLocationWhenInUsePermission();
  }

  Future<bool> requestLocationWhenInUsePermission() {
    return _permissionRepository.requestLocationWhenInUsePermission();
  }

  Future<bool> getLocationAlwaysPermission() {
    return _permissionRepository.hasLocationAlwaysPermission();
  }

  Future<bool> requestLocationAlwaysPermission() {
    return _permissionRepository.requestLocationAlwaysPermission();
  }

  Future<String?> getWifiName() async {
    final canRead = await getLocationWhenInUserPermission();
    if (!canRead) {
      return null;
    }

    return await _repository.getWifiName();
  }

  Future<bool> openSettings() {
    return _permissionRepository.openSettings();
  }
}
