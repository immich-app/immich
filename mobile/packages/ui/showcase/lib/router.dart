import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:showcase/pages/components/close_button_page.dart';
import 'package:showcase/pages/components/form_page.dart';
import 'package:showcase/pages/components/formatted_text_page.dart';
import 'package:showcase/pages/components/icon_button_page.dart';
import 'package:showcase/pages/components/password_input_page.dart';
import 'package:showcase/pages/components/text_button_page.dart';
import 'package:showcase/pages/components/text_input_page.dart';
import 'package:showcase/pages/design_system/constants_page.dart';
import 'package:showcase/pages/home_page.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/shell_layout.dart';

class AppRouter {
  static GoRouter createRouter(VoidCallback onThemeToggle) {
    return GoRouter(
      initialLocation: AppRoute.home.path,
      routes: [
        ShellRoute(
          builder: (context, state, child) =>
              ShellLayout(onThemeToggle: onThemeToggle, child: child),
          routes: AppRoute.values
              .map(
                (route) => GoRoute(
                  path: route.path,
                  pageBuilder: (context, state) => NoTransitionPage(
                    key: state.pageKey,
                    child: switch (route) {
                      AppRoute.home => HomePage(onThemeToggle: onThemeToggle),
                      AppRoute.textButton => const TextButtonPage(),
                      AppRoute.iconButton => const IconButtonPage(),
                      AppRoute.closeButton => const CloseButtonPage(),
                      AppRoute.textInput => const TextInputPage(),
                      AppRoute.passwordInput => const PasswordInputPage(),
                      AppRoute.form => const FormPage(),
                      AppRoute.formattedText => const FormattedTextPage(),
                      AppRoute.constants => const ConstantsPage(),
                    },
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}
