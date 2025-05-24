import 'package:hooks_riverpod/hooks_riverpod.dart';

final secureStorageProvider =
    StateNotifierProvider<SecureStorageProvider, void>((ref) {
  return SecureStorageProvider();
});

class SecureStorageProvider extends StateNotifier<void> {
  SecureStorageProvider() : super(null);
}
