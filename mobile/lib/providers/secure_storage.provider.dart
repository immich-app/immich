import 'package:hooks_riverpod/legacy.dart';

final secureStorageProvider = StateNotifierProvider<SecureStorageProvider, void>((ref) {
  return SecureStorageProvider();
});

class SecureStorageProvider extends StateNotifier<void> {
  SecureStorageProvider() : super(null);
}
