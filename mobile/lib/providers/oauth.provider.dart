import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/auth/oauth_login_data.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/oauth.service.dart';
import 'package:openapi/api.dart';

export 'package:immich_mobile/models/auth/oauth_login_data.model.dart';

final oAuthServiceProvider = Provider((ref) => OAuthService(ref.watch(apiServiceProvider)));

final oAuthProvider = StateNotifierProvider<OAuthNotifier, AsyncValue<void>>(
  (ref) => OAuthNotifier(ref.watch(oAuthServiceProvider)),
);

class OAuthNotifier extends StateNotifier<AsyncValue<void>> {
  final OAuthService _oAuthService;

  OAuthNotifier(this._oAuthService) : super(const AsyncValue.data(null));

  Future<OAuthLoginData?> getOAuthLoginData(String serverUrl) {
    return _oAuthService.getOAuthLoginData(serverUrl);
  }

  Future<LoginResponseDto?> completeOAuthLogin(OAuthLoginData oAuthData) {
    return _oAuthService.completeOAuthLogin(oAuthData);
  }
}
