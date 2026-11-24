import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:logging/logging.dart';

final _log = Logger("PasskeyStore");
final _random = Random.secure();

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
    if (!await ref.watch(passkeyHostApiProvider).isSupported()) {
      return false;
    }

    final config = await ref.watch(passkeyApiRepositoryProvider).getConfig();
    return config.enabled && config.origin.startsWith('https:');
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

  /// Create a passkey for the current user through the system's passkey prompt, returning false if the user cancels
  Future<bool> create() async {
    final apiRepository = read(passkeyApiRepositoryProvider);

    try {
      final origin = (await apiRepository.getConfig()).origin;
      final options = await apiRepository.startRegistration(origin);
      final credential = await _prompt(origin, {'registration': jsonEncode(options)}, 'credential');
      if (credential == null) {
        return false;
      }

      await apiRepository.finishRegistration(origin, jsonDecode(credential));
      invalidate(_allProvider);
      return true;
    } catch (error, stack) {
      _log.severe("Failed to create a passkey", error, stack);
      rethrow;
    }
  }

  /// Log in with a passkey through the system's passkey prompt, returning null if the user cancels
  Future<LoginResponse?> login() async {
    final apiRepository = read(passkeyApiRepositoryProvider);
    final codeVerifier = base64Url.encode(List.generate(42, (_) => _random.nextInt(256)));
    final codeChallenge = base64Url.encode(sha256.convert(utf8.encode(codeVerifier)).bytes).replaceAll('=', '');

    try {
      final origin = (await apiRepository.getConfig()).origin;
      final code = await _prompt(origin, {'codeChallenge': codeChallenge}, 'code');
      if (code == null) {
        return null;
      }

      return await apiRepository.exchangeCode(code, codeVerifier);
    } catch (error, stack) {
      _log.severe("Failed to log in with a passkey", error, stack);
      rethrow;
    }
  }

  Future<String?> _prompt(String origin, Map<String, String> input, String output) async {
    final String callback;
    try {
      callback = await FlutterWebAuth2.authenticate(
        url: '$origin/auth/passkey#${Uri(queryParameters: input).query}',
        callbackUrlScheme: 'app.immich',
        options: const FlutterWebAuth2Options(preferEphemeral: true),
      );
    } on PlatformException catch (error) {
      if (error.code == 'CANCELED') {
        return null;
      }
      rethrow;
    }

    final result = Uri.parse(callback).queryParameters;
    final error = result['error'];
    if (error != null) {
      throw Exception(error);
    }

    return result[output];
  }

  /// Rename the passkey [id], or clear its name with `null`
  Future<void> rename(String id, String? name) async {
    try {
      await read(passkeyApiRepositoryProvider).update(id, name);
      invalidate(_allProvider);
    } catch (error, stack) {
      _log.severe("Failed to rename passkey $id", error, stack);
      rethrow;
    }
  }

  /// Delete the passkey [id]
  Future<void> delete(String id) async {
    try {
      await read(passkeyApiRepositoryProvider).delete(id);
      invalidate(_allProvider);
    } catch (error, stack) {
      _log.severe("Failed to delete passkey $id", error, stack);
      rethrow;
    }
  }
}
