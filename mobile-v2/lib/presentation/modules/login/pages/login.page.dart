import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/presentation/components/common/gap.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_logo.widget.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_scaffold_body.widget.dart';
import 'package:immich_mobile/presentation/modules/login/models/login_page.model.dart';
import 'package:immich_mobile/presentation/modules/login/states/login_page.state.dart';
import 'package:immich_mobile/presentation/modules/login/widgets/login_form.widget.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

@RoutePage()
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animationController;
  final TextEditingController _serverUrlController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 60),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _serverUrlController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _populateDemoCredentials() {
    _serverUrlController.text = 'https://demo.immich.app';
    _emailController.text = 'demo@immich.app';
    _passwordController.text = 'demo';
  }

  void _onLoginPageStateChange(BuildContext context, LoginPageState state) {
    if (state.isLoginSuccessful) {
      context.replaceRoute(const TabControllerRoute());
    }
  }

  @override
  Widget build(BuildContext context) {
    final PreferredSizeWidget? appBar;
    late final Widget primaryBody;
    late final Widget secondaryBody;

    Widget rotatingLogo = GestureDetector(
      onDoubleTap: _populateDemoCredentials,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RotationTransition(
              turns: _animationController,
              child: const ImLogo(width: 100),
            ),
            const SizedGap.lh(),
            const ImLogoText(),
          ],
        ),
      ),
    );

    final Widget form = FractionallySizedBox(
      widthFactor: 0.8,
      child: LoginForm(
        serverUrlController: _serverUrlController,
        emailController: _emailController,
        passwordController: _passwordController,
      ),
    );

    final Widget bottom = Padding(
      padding: const EdgeInsets.only(bottom: SizeConstants.s),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FutureBuilder(
            future: PackageInfo.fromPlatform(),
            builder: (_, snap) => DefaultTextStyle.merge(
              style: TextStyle(color: context.theme.colorScheme.outline),
              child: Text(snap.data?.version ?? ''),
            ),
          ),
          TextButton(
            onPressed: () => context.navigateRoot(const LogsRoute()),
            child: const Text('Logs'),
          ),
        ],
      ),
    );

    final serverUrl = BlocSelector<LoginPageCubit, LoginPageState, bool>(
      selector: (state) => state.isServerValidated,
      builder: (_, isValidated) => isValidated
          ? Padding(
              padding: const EdgeInsets.only(bottom: SizeConstants.m),
              child: DefaultTextStyle.merge(
                style: TextStyle(
                  color: context.theme.primaryColor,
                  fontWeight: FontWeight.w500,
                ),
                child: InkWell(
                  onTap: () => launchUrl(Uri.parse(_serverUrlController.text)),
                  child: Text(
                    _serverUrlController.text,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            )
          : const SizedBox.shrink(),
    );

    const PreferredSizeWidget topBar = _MobileAppBar();

    if (context.isTablet) {
      appBar = null;
      primaryBody = Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [rotatingLogo, const SizedGap.mh(), serverUrl],
        ),
      );
      secondaryBody = Column(
        children: [topBar, Expanded(child: Center(child: form)), bottom],
      );
    } else {
      appBar = topBar;
      primaryBody = Center(
        child: Column(children: [
          Expanded(child: rotatingLogo),
          serverUrl,
          const SizedGap.sh(),
          Expanded(flex: 2, child: form),
          bottom,
        ]),
      );
    }

    return BlocListener<LoginPageCubit, LoginPageState>(
      listener: _onLoginPageStateChange,
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        appBar: appBar,
        body: SafeArea(
          child: ImAdaptiveScaffoldBody(
            primaryBody: (_) => primaryBody,
            secondaryBody: (_) => secondaryBody,
          ),
        ),
      ),
    );
  }
}

class _MobileAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _MobileAppBar();

  @override
  Widget build(BuildContext context) {
    return AppBar(
      automaticallyImplyLeading: false,
      scrolledUnderElevation: 0.0,
      actions: [
        IconButton(
          onPressed: () => context.navigateRoot(const SettingsRoute()),
          icon: const Icon(Symbols.settings),
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
