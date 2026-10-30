import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:logging/logging.dart';

final _log = Logger("PasskeyStore");

/// Passkeys the current user can log in with
///
/// All operations directly access the HTTP API, and creating one also shows the system's passkey prompt
extension type const PasskeyStore._(Provider<PasskeyMutations> _provider) implements Provider<PasskeyMutations> {
  static final PasskeyStore instance = PasskeyStore._(Provider((ref) => PasskeyMutations._(ref)));

  /// Whether the server and this device support passkeys, and the server has them turned on
  AutoDisposeFutureProvider<bool> enabled() => _enabledProvider;
}

final _enabledProvider = FutureProvider.autoDispose<bool>((ref) async {
  if (!ref.watch(serverInfoProvider.select((state) => state.serverVersion.supportsPasskeys))) {
    return false;
  }

  try {
    return await ref.watch(passkeyHostApiProvider).isSupported() &&
        await ref.watch(passkeyApiRepositoryProvider).isEnabled();
  } catch (error, stack) {
    _log.warning("Failed to get the passkey config", error, stack);
    return false;
  }
});

class PasskeyMutations extends StoreMutations {
  const PasskeyMutations._(super.ref);

  /// Create a passkey for the current user through the system's passkey prompt, returning false if the user cancels
  Future<bool> create() async {
    final apiRepository = read(passkeyApiRepositoryProvider);

    try {
      final options = await apiRepository.startRegistration();
      final credential = await read(passkeyHostApiProvider).register(jsonEncode(options));
      if (credential == null) {
        return false;
      }

      await apiRepository.finishRegistration(jsonDecode(credential));
      return true;
    } catch (error, stack) {
      _log.severe("Failed to create a passkey", error, stack);
      rethrow;
    }
  }
}
