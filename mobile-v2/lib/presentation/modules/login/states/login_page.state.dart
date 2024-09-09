import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/domain/services/sync.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/modules/common/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/presentation/modules/login/models/login_page.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:immich_mobile/utils/snackbar_manager.dart';

class LoginPageCubit extends Cubit<LoginPageState> with LogContext {
  LoginPageCubit() : super(LoginPageState.reset());

  String _appendSchema(String url) {
    // Add schema if none is set
    url =
        url.trimLeft().startsWith(RegExp(r"https?://")) ? url : "https://$url";
    // Remove trailing slash(es)
    url = url.trimRight().replaceFirst(RegExp(r"/+$"), "");
    return url;
  }

  String? validateServerUrl(String? url) {
    if (url == null || url.isEmpty) {
      return t.login.error.empty_server_url;
    }

    url = _appendSchema(url);

    final uri = Uri.tryParse(url);
    if (uri == null ||
        !uri.isAbsolute ||
        uri.host.isEmpty ||
        !uri.scheme.startsWith("http")) {
      return t.login.error.invalid_server_url;
    }

    return null;
  }

  Future<void> validateServer(String url) async {
    url = _appendSchema(url);

    final LoginService loginService = di();

    try {
      // parse instead of tryParse since the method expects a valid well formed URI
      final uri = Uri.parse(url);
      emit(state.copyWith(isValidationInProgress: true));

      // Check if the endpoint is available
      if (!await loginService.isEndpointAvailable(uri)) {
        SnackbarManager.showError(t.login.error.server_not_reachable);
        return;
      }

      // Check for /.well-known/immich
      url = await loginService.resolveEndpoint(uri);

      di<IStoreRepository>().set(StoreKey.serverEndpoint, url);
      ServiceLocator.registerPostValidationServices(url);
      ServiceLocator.registerPostGlobalStates();

      // Fetch server features
      await di<ServerFeatureConfigCubit>().getFeatures();

      emit(state.copyWith(isServerValidated: true));
    } finally {
      emit(state.copyWith(isValidationInProgress: false));
    }
  }

  Future<void> passwordLogin({
    required String email,
    required String password,
  }) async {
    try {
      emit(state.copyWith(isValidationInProgress: true));
      final accessToken =
          await di<LoginService>().passwordLogin(email, password);

      if (accessToken == null) {
        SnackbarManager.showError(t.login.error.error_login);
        return;
      }

      await _postLogin(accessToken);
    } catch (e, s) {
      SnackbarManager.showError(t.login.error.error_login);
      log.severe("Cannot perform password login", e, s);
    } finally {
      emit(state.copyWith(isValidationInProgress: false));
    }
  }

  Future<void> oAuthLogin() async {
    try {
      emit(state.copyWith(isValidationInProgress: true));

      final accessToken = await di<LoginService>().oAuthLogin();

      if (accessToken == null) {
        SnackbarManager.showError(t.login.error.error_login_oauth);
        return;
      }

      await _postLogin(accessToken);
    } catch (e, s) {
      SnackbarManager.showError(t.login.error.error_login_oauth);
      log.severe("Cannot perform oauth login", e, s);
    } finally {
      emit(state.copyWith(isValidationInProgress: false));
    }
  }

  Future<void> _postLogin(String accessToken) async {
    await di<IStoreRepository>().set(StoreKey.accessToken, accessToken);

    /// Set token to interceptor
    await di<ImmichApiClient>().init(accessToken: accessToken);

    final user = await di<UserService>().getMyUser();
    if (user == null) {
      SnackbarManager.showError(t.login.error.error_login);
      return;
    }

    // Register user
    ServiceLocator.registerCurrentUser(user);
    await di<IUserRepository>().add(user);
    // Remove and Sync assets in background
    await di<IAssetRepository>().clearAll();
    unawaited(di<SyncService>().doFullSyncForUserDrift(user));

    emit(state.copyWith(
      isValidationInProgress: false,
      isLoginSuccessful: true,
    ));
  }

  void resetServerValidation() {
    emit(LoginPageState.reset());
  }
}
