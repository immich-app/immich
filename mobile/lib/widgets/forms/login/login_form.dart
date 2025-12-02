import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/oauth.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/provider_utils.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';
import 'package:immich_mobile/widgets/common/immich_title_text.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/forms/login/login_credentials_form.dart';
import 'package:immich_mobile/widgets/forms/login/server_selection_form.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class LoginForm extends ConsumerStatefulWidget {
  const LoginForm({super.key});

  @override
  ConsumerState<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<LoginForm> with SingleTickerProviderStateMixin {
  final _log = Logger('LoginForm');
  final _loginFormKey = GlobalKey<FormState>();

  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _serverEndpointController;
  late final FocusNode _emailFocusNode;
  late final FocusNode _passwordFocusNode;
  late final FocusNode _serverEndpointFocusNode;
  late final AnimationController _logoAnimationController;

  bool _isLoading = false;
  bool _isLoadingServer = false;
  bool _isOAuthEnabled = false;
  bool _isPasswordLoginEnabled = false;
  String _oAuthButtonLabel = 'OAuth';
  String? _serverEndpoint;
  String? _warningMessage;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _serverEndpointController = TextEditingController();
    _emailFocusNode = FocusNode();
    _passwordFocusNode = FocusNode();
    _serverEndpointFocusNode = FocusNode();
    _logoAnimationController = AnimationController(vsync: this, duration: const Duration(seconds: 60))..repeat();

    // Load saved server URL if available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final serverUrl = getServerUrl();
      if (serverUrl != null) {
        _serverEndpointController.text = serverUrl;
      }
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _serverEndpointController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _serverEndpointFocusNode.dispose();
    _logoAnimationController.dispose();
    super.dispose();
  }

  Future<void> _checkVersionMismatch() async {
    try {
      final serverInfo = ref.read(serverInfoProvider);
      final packageInfo = await PackageInfo.fromPlatform();
      final appVersion = packageInfo.version;
      final appMajorVersion = int.parse(appVersion.split('.')[0]);
      final appMinorVersion = int.parse(appVersion.split('.')[1]);
      final serverMajorVersion = serverInfo.serverVersion.major;
      final serverMinorVersion = serverInfo.serverVersion.minor;

      setState(() {
        _warningMessage = getVersionCompatibilityMessage(
          appMajorVersion,
          appMinorVersion,
          serverMajorVersion,
          serverMinorVersion,
        );
      });
    } catch (error) {
      setState(() {
        _warningMessage = 'Error checking version compatibility';
      });
    }
  }

  Future<void> _getServerAuthSettings() async {
    final serverUrl = _serverEndpointController.text;

    if (serverUrl.isEmpty) {
      ImmichToast.show(context: context, msg: "login_form_server_empty".tr(), toastType: ToastType.error);
      return;
    }

    try {
      setState(() {
        _isLoadingServer = true;
      });

      final settings = await ref.read(authProvider.notifier).getServerAuthSettings(serverUrl);
      if (settings == null) {
        ImmichToast.show(
          context: context,
          msg: 'login_form_server_error'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        _resetServerState();
        return;
      }

      setState(() {
        _isOAuthEnabled = settings.isOAuthEnabled;
        _isPasswordLoginEnabled = settings.isPasswordLoginEnabled;
        _oAuthButtonLabel = settings.oAuthButtonText;
        _serverEndpoint = settings.endpoint;
        _isLoadingServer = false;
      });

      await _checkVersionMismatch();
    } on ApiException catch (e) {
      ImmichToast.show(
        context: context,
        msg: e.message ?? 'login_form_api_exception'.tr(),
        toastType: ToastType.error,
        gravity: ToastGravity.TOP,
      );
      _resetServerState();
    } on HandshakeException {
      ImmichToast.show(
        context: context,
        msg: 'login_form_handshake_exception'.tr(),
        toastType: ToastType.error,
        gravity: ToastGravity.TOP,
      );
      _resetServerState();
    } catch (e) {
      ImmichToast.show(
        context: context,
        msg: 'login_form_server_error'.tr(),
        toastType: ToastType.error,
        gravity: ToastGravity.TOP,
      );
      _resetServerState();
    }
  }

  void _resetServerState() {
    setState(() {
      _isOAuthEnabled = false;
      _isPasswordLoginEnabled = true;
      _isLoadingServer = false;
    });
  }

  void _populateTestLoginInfo() {
    _emailController.text = 'demo@immich.app';
    _passwordController.text = 'demo';
    _serverEndpointController.text = 'https://demo.immich.app';
  }

  void _populateTestLoginInfo1() {
    _emailController.text = 'testuser@email.com';
    _passwordController.text = 'password';
    _serverEndpointController.text = 'http://10.1.15.216:2283/api';
  }

  Future<void> _handleSyncFlow() async {
    final backgroundManager = ref.read(backgroundSyncProvider);

    await backgroundManager.syncLocal(full: true);
    await backgroundManager.syncRemote();
    await backgroundManager.hashAssets();

    if (Store.get(StoreKey.syncAlbums, false)) {
      await backgroundManager.syncLinkedAlbum();
    }
  }

  Future<void> _getManageMediaPermission() async {
    final hasPermission = await ref.read(localFilesManagerRepositoryProvider).hasManageMediaPermission();
    if (!hasPermission) {
      await showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
            elevation: 5,
            title: Text(
              'manage_media_access_title',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: context.primaryColor),
            ).tr(),
            content: SingleChildScrollView(
              child: ListBody(
                children: [
                  const Text('manage_media_access_subtitle', style: TextStyle(fontSize: 14)).tr(),
                  const SizedBox(height: 4),
                  const Text('manage_media_access_rationale', style: TextStyle(fontSize: 12)).tr(),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  'cancel'.tr(),
                  style: TextStyle(fontWeight: FontWeight.w600, color: context.primaryColor),
                ),
              ),
              TextButton(
                onPressed: () {
                  ref.read(localFilesManagerRepositoryProvider).requestManageMediaPermission();
                  Navigator.of(context).pop();
                },
                child: Text(
                  'manage_media_access_settings'.tr(),
                  style: TextStyle(fontWeight: FontWeight.w600, color: context.primaryColor),
                ),
              ),
            ],
          );
        },
      );
    }
  }

  bool _isSyncRemoteDeletionsMode() => Platform.isAndroid && Store.get(StoreKey.manageLocalMediaAndroid, false);

  Future<void> _login() async {
    TextInput.finishAutofillContext();

    setState(() {
      _isLoading = true;
    });

    // Invalidate all api repository provider instance to take into account new access token
    invalidateAllApiRepositoryProviders(ref);

    try {
      final result = await ref.read(authProvider.notifier).login(_emailController.text, _passwordController.text);

      if (result.shouldChangePassword && !result.isAdmin) {
        unawaited(context.pushRoute(const ChangePasswordRoute()));
      } else {
        final isBeta = Store.isBetaTimelineEnabled;
        if (isBeta) {
          await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();
          if (_isSyncRemoteDeletionsMode()) {
            await _getManageMediaPermission();
          }
          unawaited(_handleSyncFlow());
          ref.read(websocketProvider.notifier).connect();
          unawaited(context.replaceRoute(const TabShellRoute()));
          return;
        }
        unawaited(context.replaceRoute(const TabControllerRoute()));
      }
    } catch (error) {
      ImmichToast.show(
        context: context,
        msg: "login_form_failed_login".tr(),
        toastType: ToastType.error,
        gravity: ToastGravity.TOP,
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _oAuthLogin() async {
    setState(() {
      _isLoading = true;
    });

    // Invalidate all api repository provider instance to take into account new access token
    invalidateAllApiRepositoryProviders(ref);

    try {
      final oAuthData = await ref
          .read(oAuthProvider.notifier)
          .getOAuthLoginData(sanitizeUrl(_serverEndpointController.text));

      if (oAuthData == null) {
        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_disable".tr(),
          toastType: ToastType.info,
          gravity: ToastGravity.TOP,
        );
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final loginResponseDto = await ref.read(oAuthProvider.notifier).completeOAuthLogin(oAuthData);

      if (loginResponseDto == null) {
        setState(() {
          _isLoading = false;
        });
        return;
      }

      _log.info("Finished OAuth login with response: ${loginResponseDto.userEmail}");

      final isSuccess = await ref.read(authProvider.notifier).saveAuthInfo(accessToken: loginResponseDto.accessToken);

      if (isSuccess) {
        setState(() {
          _isLoading = false;
        });
        final permission = ref.read(galleryPermissionNotifier);
        final isBeta = Store.isBetaTimelineEnabled;
        if (!isBeta && (permission.isGranted || permission.isLimited)) {
          unawaited(ref.read(backupProvider.notifier).resumeBackup());
        }
        if (isBeta) {
          await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();
          if (_isSyncRemoteDeletionsMode()) {
            await _getManageMediaPermission();
          }
          unawaited(_handleSyncFlow());
          unawaited(context.replaceRoute(const TabShellRoute()));
          return;
        }
        unawaited(context.replaceRoute(const TabControllerRoute()));
      }
    } catch (error, stack) {
      _log.severe('Error logging in with OAuth: $error', stack);

      ImmichToast.show(context: context, msg: error.toString(), toastType: ToastType.error, gravity: ToastGravity.TOP);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _goBack() {
    setState(() {
      _serverEndpoint = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final serverSelectionOrLogin = _serverEndpoint == null
        ? ServerSelectionForm(
            serverEndpointController: _serverEndpointController,
            serverEndpointFocusNode: _serverEndpointFocusNode,
            isLoading: _isLoadingServer,
            onSubmit: _getServerAuthSettings,
          )
        : LoginCredentialsForm(
            emailController: _emailController,
            passwordController: _passwordController,
            serverEndpointController: _serverEndpointController,
            emailFocusNode: _emailFocusNode,
            passwordFocusNode: _passwordFocusNode,
            isLoading: _isLoading,
            isOAuthEnabled: _isOAuthEnabled,
            isPasswordLoginEnabled: _isPasswordLoginEnabled,
            oAuthButtonLabel: _oAuthButtonLabel,
            warningMessage: _warningMessage,
            onLogin: _login,
            onOAuthLogin: _oAuthLogin,
            onBack: _goBack,
          );

    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 300),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: constraints.maxHeight / 5),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      GestureDetector(
                        onDoubleTap: _populateTestLoginInfo,
                        onLongPress: _populateTestLoginInfo1,
                        child: RotationTransition(
                          turns: _logoAnimationController,
                          child: const ImmichLogo(heroTag: 'logo'),
                        ),
                      ),
                      const Padding(padding: EdgeInsets.only(top: 8.0, bottom: 16), child: ImmichTitleText()),
                    ],
                  ),
                  // Note: This used to have an AnimatedSwitcher, but was removed
                  // because of https://github.com/flutter/flutter/issues/120874
                  Form(key: _loginFormKey, child: serverSelectionOrLogin),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
