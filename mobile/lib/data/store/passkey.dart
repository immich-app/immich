import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:logging/logging.dart';

final _log = Logger("PasskeyStore");

/// Passkeys the current user can log in with
///
/// All operations directly access the HTTP API only
extension type const PasskeyStore._(Provider<PasskeyMutations> _provider) implements Provider<PasskeyMutations> {
  static final PasskeyStore instance = PasskeyStore._(Provider((ref) => PasskeyMutations._(ref)));

  /// Every passkey of the current user
  ///
  /// **NOTE:** This is not reactive to changes, and only hits the HTTP API
  AutoDisposeFutureProvider<List<Passkey>> all() => _allProvider;
}

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
