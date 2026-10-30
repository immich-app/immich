import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:logging/logging.dart';

final _log = Logger("PasskeyStore");

/// Passkeys the current user can log in with
///
/// All operations directly access the HTTP API, and creating or using one also shows the system's passkey prompt
extension type const PasskeyStore._(Provider<PasskeyMutations> _provider) implements Provider<PasskeyMutations> {
  static final PasskeyStore instance = PasskeyStore._(Provider((ref) => PasskeyMutations._(ref)));

  /// Whether the server and this device support passkeys, and the server has them turned on
  AutoDisposeFutureProvider<bool> enabled() => _enabledProvider;

  /// Every passkey of the current user
  ///
  /// **NOTE:** This is not reactive to changes, and only hits the HTTP API
  AutoDisposeFutureProvider<List<Passkey>> all() => _allProvider;
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

final _allProvider = FutureProvider.autoDispose<List<Passkey>>((ref) async {
  try {
    return await ref.watch(passkeyApiRepositoryProvider).getAll();
  } catch (error, stack) {
    _log.severe("Failed to get all passkeys", error, stack);
    return const [];
  }
});

class PasskeyMutations extends StoreMutations {
  const PasskeyMutations._(super.ref);

  /// Create a passkey for the current user through the system's passkey prompt, returning null if the user cancels
  Future<Passkey?> create() async {
    final apiRepository = read(passkeyApiRepositoryProvider);

    try {
      final options = await apiRepository.startRegistration();
      final credential = await read(passkeyHostApiProvider).register(jsonEncode(options));
      if (credential == null) {
        return null;
      }

      return await apiRepository.finishRegistration(jsonDecode(credential));
    } catch (error, stack) {
      _log.severe("Failed to create a passkey", error, stack);
      rethrow;
    }
  }

  /// Log in with a passkey through the system's passkey prompt, returning null if the user cancels
  Future<LoginResponse?> login() async {
    final apiRepository = read(passkeyApiRepositoryProvider);

    try {
      final options = await apiRepository.startAuthentication();
      final credential = await read(passkeyHostApiProvider).authenticate(jsonEncode(options));
      if (credential == null) {
        return null;
      }

      return await apiRepository.finishAuthentication(jsonDecode(credential));
    } catch (error, stack) {
      _log.severe("Failed to log in with a passkey", error, stack);
      rethrow;
    }
  }

  /// Rename the passkey [id], or clear its name with `null`
  Future<void> rename(String id, String? name) async {
    try {
      await read(passkeyApiRepositoryProvider).update(id, name);
    } catch (error, stack) {
      _log.severe("Failed to rename passkey $id", error, stack);
      rethrow;
    }
  }

  /// Delete the passkey [id]
  Future<void> delete(String id) async {
    try {
      await read(passkeyApiRepositoryProvider).delete(id);
    } catch (error, stack) {
      _log.severe("Failed to delete passkey $id", error, stack);
      rethrow;
    }
  }
}
