import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/auth/biometric_status.model.dart';
import 'package:immich_mobile/services/local_auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:logging/logging.dart';

final localAuthProvider = StateNotifierProvider<LocalAuthNotifier, BiometricStatus>((ref) {
  return LocalAuthNotifier(ref.watch(localAuthServiceProvider), ref.watch(secureStorageServiceProvider));
});

class LocalAuthNotifier extends StateNotifier<BiometricStatus> {
  final LocalAuthService _localAuthService;
  final SecureStorageService _secureStorageService;

  final _log = Logger("LocalAuthNotifier");

  LocalAuthNotifier(this._localAuthService, this._secureStorageService)
    : super(const BiometricStatus(availableBiometrics: [], canAuthenticate: false)) {
    unawaited(
      _localAuthService.getStatus().then((value) {
        state = state.copyWith(canAuthenticate: value.canAuthenticate, availableBiometrics: value.availableBiometrics);
      }),
    );
  }

  Future<bool> registerBiometric(BuildContext context, String pinCode) async {
    final isAuthenticated = await authenticate(context, 'Authenticate to enable biometrics');

    if (!isAuthenticated) {
      return false;
    }

    await _secureStorageService.write(kSecuredPinCode, pinCode);

    return true;
  }

  Future<bool> authenticate(BuildContext context, String? message) async {
    final t = StaticTranslations.instance;
    String errorMessage = "";

    try {
      return await _localAuthService.authenticate(message);
    } on PlatformException catch (error) {
      switch (error.code) {
        case "NotEnrolled":
          _log.warning("User is not enrolled in biometrics");
          errorMessage = t.biometric_no_options;
        case "NotAvailable":
          _log.warning("Biometric authentication is not available");
          errorMessage = t.biometric_not_available;
        case "LockedOut":
          _log.warning("User is locked out of biometric authentication");
          errorMessage = t.biometric_locked_out;
        default:
          _log.warning("Failed to authenticate with unknown reason");
          errorMessage = t.failed_to_authenticate;
      }
    } catch (error) {
      _log.warning("Error during authentication: $error");
      errorMessage = t.failed_to_authenticate;
    } finally {
      if (errorMessage.isNotEmpty) {
        context.showSnackBar(
          SnackBar(
            content: Text(errorMessage, style: context.textTheme.labelLarge),
            duration: const Duration(seconds: 3),
            backgroundColor: context.colorScheme.errorContainer,
          ),
        );
      }
    }

    return false;
  }
}
