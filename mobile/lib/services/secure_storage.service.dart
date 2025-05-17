import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/interfaces/secure_storage.interface.dart';
import 'package:immich_mobile/repositories/secure_storage.repository.dart';

final secureStorageServiceProvider = Provider(
  (ref) => SecureStorageService(
    ref.watch(secureStorageRepositoryProvider),
  ),
);

class SecureStorageService {
  // final _log = Logger("LocalAuthService");

  final ISecureStorageRepository _secureStorageRepository;

  SecureStorageService(this._secureStorageRepository);

  get hasPinCode async {
    final pinCode = await _secureStorageRepository.read(kSecuredPinCode);
    return pinCode != null && pinCode.isNotEmpty;
  }

  Future<void> setPinCode(String pinCode) async {
    await _secureStorageRepository.write(kSecuredPinCode, pinCode);
  }

  Future<void> deletePinCode() async {
    await _secureStorageRepository.delete(kSecuredPinCode);
  }

  Future<String?> getPinCode() async {
    return _secureStorageRepository.read(kSecuredPinCode);
  }
}
