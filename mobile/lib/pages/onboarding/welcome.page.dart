import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';
import 'package:immich_mobile/widgets/common/immich_title_text.dart';
import 'package:immich_ui/immich_ui.dart';

@RoutePage()
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: Container(
          constraints: const .new(maxWidth: 380),
          padding: const .fromLTRB(ImmichSpacing.xl, 0, ImmichSpacing.xl, ImmichSpacing.xl),
          child: Column(
            crossAxisAlignment: .stretch,
            spacing: ImmichSpacing.xl,
            children: [
              const Spacer(flex: 2),
              const Column(
                spacing: ImmichSpacing.lg,
                children: [
                  ImmichLogo(size: 100, heroTag: 'logo'),
                  ImmichTitleText(),
                ],
              ),
              Text(
                context.t.onboarding_welcome_description,
                textAlign: .center,
                style: context.textTheme.bodyLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ),
              const Spacer(flex: 3),
              ImmichTextButton(
                labelText: context.t.onboarding_get_started,
                onPressed: () => context.pushRoute(const LoginRoute()),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
