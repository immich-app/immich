import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_profile_info.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_server_info.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:url_launcher/url_launcher.dart';

class ImmichAppBarDialog extends HookConsumerWidget {
  const ImmichAppBarDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = context.themeData;
    bool isHorizontal = !context.isMobile;
    final horizontalPadding = isHorizontal ? 100.0 : 20.0;

    useEffect(
      () {
        ref.read(currentUserProvider.notifier).refresh();
        return null;
      },
      [],
    );

    buildTopRow() {
      return Stack(
        children: [
          Align(
            alignment: Alignment.topLeft,
            child: InkWell(
              onTap: () => context.pop(),
              child: const Icon(
                Icons.close,
                size: 20,
              ),
            ),
          ),
          Center(
            child: Image.asset(
              context.isDarkTheme
                  ? 'assets/immich-text-dark.png'
                  : 'assets/immich-text-light.png',
              height: 16,
            ),
          ),
        ],
      );
    }

    buildActionButton(IconData icon, String text, Function() onTap) {
      return ListTile(
        dense: true,
        visualDensity: VisualDensity.standard,
        contentPadding: const EdgeInsets.only(left: 30),
        minLeadingWidth: 40,
        leading: SizedBox(
          child: Icon(
            icon,
            color: theme.textTheme.labelLarge?.color?.withAlpha(250),
            size: 20,
          ),
        ),
        title: Text(
          text,
          style: theme.textTheme.labelLarge?.copyWith(
            color: theme.textTheme.labelLarge?.color?.withAlpha(250),
          ),
        ).tr(),
        onTap: onTap,
      );
    }

    buildSettingButton() {
      return buildActionButton(
        Icons.settings_rounded,
        "profile_drawer_settings",
        () => context.pushRoute(const SettingsRoute()),
      );
    }

    buildAppLogButton() {
      return buildActionButton(
        Icons.assignment_outlined,
        "profile_drawer_app_logs",
        () => context.pushRoute(const AppLogRoute()),
      );
    }

    buildSignOutButton() {
      return buildActionButton(
        Icons.logout_rounded,
        "profile_drawer_sign_out",
        () async {
          showDialog(
            context: context,
            builder: (BuildContext ctx) {
              return ConfirmDialog(
                title: "app_bar_signout_dialog_title",
                content: "app_bar_signout_dialog_content",
                ok: "app_bar_signout_dialog_ok",
                onOk: () async {
                  await ref.read(authenticationProvider.notifier).logout();

                  ref.read(assetProvider.notifier).clearAllAsset();
                  ref.read(websocketProvider.notifier).disconnect();
                  context.replaceRoute(const LoginRoute());
                },
              );
            },
          );
        },
      );
    }

    buildFooter() {
      return Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            InkWell(
              onTap: () {
                context.pop();
                launchUrl(
                  Uri.parse('https://immich.app'),
                  mode: LaunchMode.externalApplication,
                );
              },
              child: Text(
                "profile_drawer_documentation",
                style: context.textTheme.bodySmall,
              ).tr(),
            ),
            const SizedBox(
              width: 20,
              child: Text(
                "•",
                textAlign: TextAlign.center,
              ),
            ),
            InkWell(
              onTap: () {
                context.pop();
                launchUrl(
                  Uri.parse('https://github.com/immich-app/immich'),
                  mode: LaunchMode.externalApplication,
                );
              },
              child: Text(
                "profile_drawer_github",
                style: context.textTheme.bodySmall,
              ).tr(),
            ),
          ],
        ),
      );
    }

    return Dialog(
      clipBehavior: Clip.hardEdge,
      alignment: Alignment.topCenter,
      insetPadding: EdgeInsets.only(
        top: isHorizontal ? 20 : 40,
        left: horizontalPadding,
        right: horizontalPadding,
        bottom: isHorizontal ? 20 : 100,
      ),
      backgroundColor: theme.cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: SizedBox(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                child: buildTopRow(),
              ),
              const AppBarProfileInfoBox(),
              const AppBarServerInfo(),
              buildAppLogButton(),
              buildSettingButton(),
              buildSignOutButton(),
              buildFooter(),
            ],
          ),
        ),
      ),
    );
  }
}
