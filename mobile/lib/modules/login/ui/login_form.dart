import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class LoginForm extends HookConsumerWidget {
  const LoginForm({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usernameController = useTextEditingController(text: 'testuser@email.com');
    final passwordController = useTextEditingController(text: 'password');
    final serverEndpointController = useTextEditingController(text: 'http://192.168.1.103:2283');

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 300),
        child: SingleChildScrollView(
          child: Wrap(
            spacing: 32,
            runSpacing: 32,
            alignment: WrapAlignment.center,
            children: [
              const Image(
                image: AssetImage('assets/immich-logo-no-outline.png'),
                width: 128,
                filterQuality: FilterQuality.high,
              ),
              Text(
                'IMMICH',
                style: GoogleFonts.snowburstOne(
                    textStyle:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 48, color: Theme.of(context).primaryColor)),
              ),
              EmailInput(controller: usernameController),
              PasswordInput(controller: passwordController),
              ServerEndpointInput(controller: serverEndpointController),
              LoginButton(
                emailController: usernameController,
                passwordController: passwordController,
                serverEndpointController: serverEndpointController,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ServerEndpointInput extends StatelessWidget {
  final TextEditingController controller;

  const ServerEndpointInput({Key? key, required this.controller}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: const InputDecoration(
          labelText: 'Server Endpoint URL', border: OutlineInputBorder(), hintText: 'http://your-server-ip:port'),
    );
  }
}

class EmailInput extends StatelessWidget {
  final TextEditingController controller;

  const EmailInput({Key? key, required this.controller}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration:
          const InputDecoration(labelText: 'email', border: OutlineInputBorder(), hintText: 'youremail@email.com'),
    );
  }
}

class PasswordInput extends StatelessWidget {
  final TextEditingController controller;

  const PasswordInput({Key? key, required this.controller}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: true,
      controller: controller,
      decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder(), hintText: 'password'),
    );
  }
}

class LoginButton extends ConsumerWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController serverEndpointController;

  const LoginButton(
      {Key? key,
      required this.emailController,
      required this.passwordController,
      required this.serverEndpointController})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton(
        onPressed: () async {
          // This will remove current cache asset state of previous user login.
          ref.watch(assetProvider.notifier).clearAllAsset();

          var isAuthenicated = await ref
              .read(authenticationProvider.notifier)
              .login(emailController.text, passwordController.text, serverEndpointController.text);

          if (isAuthenicated) {
            // Resume backup (if enable) then navigate
            ref.watch(backupProvider.notifier).resumeBackup();
            // AutoRouter.of(context).pushNamed("/home-page");
            AutoRouter.of(context).pushNamed("/tab-controller-page");
          } else {
            ImmichToast.show(
                context: context,
                msg: "Error logging you in, check server url, email and password!",
                toastType: ToastType.error);
          }
        },
        child: const Text("Login"));
  }
}
