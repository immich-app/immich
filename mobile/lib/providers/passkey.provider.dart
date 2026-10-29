import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/domain/services/passkey.service.dart';
import 'package:immich_mobile/platform/passkey_api.g.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

final passkeyServiceProvider = Provider(
  (ref) => PasskeyService(ref.watch(passkeyApiRepositoryProvider), PasskeyHostApi()),
);

final passkeyEnabledProvider = FutureProvider.autoDispose<bool>((ref) {
  final featureLevel = ref.watch(serverInfoProvider.select((state) => state.serverVersion.featureLevel));
  return ref.watch(passkeyServiceProvider).isEnabled(featureLevel);
});
