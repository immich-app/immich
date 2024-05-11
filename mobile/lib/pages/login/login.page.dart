import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/forms/login_form.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:package_info_plus/package_info_plus.dart';

@RoutePage()
class LoginPage extends HookConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appVersion = useState('0.0.0');

    getAppInfo() async {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();
      appVersion.value = packageInfo.version;
    }

    useEffect(
      () {
        getAppInfo();
        return null;
      },
    );

    return Scaffold(
      body: const LoginForm(),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: SizedBox(
            height: 50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'v${appVersion.value}',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontFamily: "Inconsolata",
                  ),
                ),
                const Text(' '),
                GestureDetector(
                  child: Text(
                    'Logs',
                    style: TextStyle(
                      color: context.primaryColor,
                      fontWeight: FontWeight.bold,
                      fontFamily: "Inconsolata",
                    ),
                  ),
                  onTap: () {
                    context.pushRoute(const AppLogRoute());
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
