import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';

class LoginForm extends HookConsumerWidget {
  const LoginForm({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usernameController = useTextEditingController(text: 'testuser@email.com');
    final passwordController = useTextEditingController(text: 'password');
    final serverEndpointController = useTextEditingController(text: 'http://192.168.1.216:3000');

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 300),
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
          var isAuthenicated = await ref
              .read(authenticationProvider.notifier)
              .login(emailController.text, passwordController.text, serverEndpointController.text);

          if (isAuthenicated) {
            AutoRouter.of(context).pushNamed("/home-page");
          } else {
            debugPrint("BAD LOGIN TRY AGAIN - Show UI Here");
          }
        },
        child: const Text("Login"));
  }
}
