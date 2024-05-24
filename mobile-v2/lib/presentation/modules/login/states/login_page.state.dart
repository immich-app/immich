import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/domain/store_manager.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/modules/common/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/presentation/modules/login/models/login_page.model.dart';
import 'package:immich_mobile/service_locator.dart';
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

      di<StoreManager>().put(StoreKey.serverEndpoint, url);
      ServiceLocator.registerPostValidationServices(url);

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
    emit(state.copyWith(isValidationInProgress: true));

    final url = di<StoreManager>().get(StoreKey.serverEndpoint);
  }

  Future<void> oAuthLogin() async {
    emit(state.copyWith(isValidationInProgress: true));

    final url = di<StoreManager>().get(StoreKey.serverEndpoint);
  }

  void resetServerValidation() {
    emit(LoginPageState.reset());
  }
}
