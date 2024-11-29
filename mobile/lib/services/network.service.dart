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

  Future<bool> getWifiReadPermission() async {
    final isGranted = await _permissionRepository.hasWifiReadPermission();
    if (!isGranted) {
      return await _permissionRepository.requestWifiReadPermission();
    }

    return isGranted;
  }

  Future<String?> getWifiName() async {
    final canRead = await getWifiReadPermission();
    if (!canRead) {
      return null;
    }

    final isWifiConnected = await _repository.isWifiConnected();

    if (!isWifiConnected) {
      return null;
    }

    return await _repository.getWifiName();
  }
}
