import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/pages/common/settings.page.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/locale_provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_profile_info.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_server_info.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class ImmichAppBarDialog extends HookConsumerWidget {
  const ImmichAppBarDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(localeProvider);
    final ServerDiskInfo backupState = ref.watch(backupProvider);
    final theme = context.themeData;
    final bool isHorizontal = !context.isMobile;
    final horizontalPadding = isHorizontal ? 100.0 : 20.0;
    final user = ref.watch(currentUserProvider);
    final isLoggingOut = useState(false);
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);

    useEffect(() {
      unawaited(ref.read(backupProvider.notifier).updateDiskInfo());
      unawaited(ref.read(currentUserProvider.notifier).refresh());
      return null;
    }, []);

    SizedBox buildTopRow() {
      return SizedBox(
        height: 56,
        child: Stack(
          alignment: Alignment.centerLeft,
          children: [
            IconButton(
              onPressed: () => ContextHelper(context).pop(),
              icon: Icon(Icons.close, size: 20, color: context.colorScheme.onSurfaceVariant),
            ),
            Align(
              alignment: Alignment.center,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Image.asset(
                  context.isDarkTheme ? 'assets/immich-text-dark.png' : 'assets/immich-text-light.png',
                  height: 16,
                ),
              ),
            ),
          ],
        ),
      );
    }

    ListTile buildActionButton(IconData icon, String text, Function() onTap, {Widget? trailing}) {
      return ListTile(
        dense: true,
        visualDensity: VisualDensity.standard,
        contentPadding: const EdgeInsets.only(left: 30, right: 30),
        minLeadingWidth: 40,
        leading: SizedBox(child: Icon(icon, color: theme.textTheme.labelLarge?.color?.withAlpha(250), size: 20)),
        title: Text(
          text,
          style: theme.textTheme.labelLarge?.copyWith(color: theme.textTheme.labelLarge?.color?.withAlpha(250)),
        ),
        onTap: onTap,
        trailing: trailing,
      );
    }

    ListTile buildSettingButton() {
      return buildActionButton(
        Icons.settings_outlined,
        context.t.settings,
        () => context.pushRoute(const SettingsRoute()),
      );
    }

    ListTile buildFreeUpSpaceButton() {
      return buildActionButton(
        Icons.cleaning_services_outlined,
        context.t.free_up_space,
        () => context.pushRoute(SettingsSubRoute(section: SettingSection.freeUpSpace)),
      );
    }

    ListTile buildAppLogButton() {
      return buildActionButton(
        Icons.assignment_outlined,
        context.t.profile_drawer_app_logs,
        () => context.pushRoute(const AppLogRoute()),
      );
    }

    ListTile buildSignOutButton() {
      return buildActionButton(
        Icons.logout_rounded,
        context.t.sign_out,
        () async {
          if (isLoggingOut.value) {
            return;
          }

          unawaited(
            showDialog(
              context: context,
              builder: (BuildContext ctx) {
                return ConfirmDialog(
                  title: context.t.app_bar_signout_dialog_title,
                  content: context.t.app_bar_signout_dialog_content,
                  ok: context.t.yes,
                  onOk: () async {
                    isLoggingOut.value = true;
                    await ref.read(authProvider.notifier).logout().whenComplete(() => isLoggingOut.value = false);
                    if (!context.mounted) {
                      return;
                    }

                    ref.read(websocketProvider.notifier).disconnect();
                    if (!context.mounted) {
                      return;
                    }

                    unawaited(context.replaceRoute(const LoginRoute()));
                  },
                );
              },
            ),
          );
        },
        trailing: isLoggingOut.value
            ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : null,
      );
    }

    Widget buildStorageInformation() {
      var percentage = backupState.diskUsagePercentage / 100;
      var usedDiskSpace = backupState.diskUse;
      var totalDiskSpace = backupState.diskSize;

      if (user != null && user.hasQuota) {
        usedDiskSpace = formatBytes(user.quotaUsageInBytes);
        totalDiskSpace = formatBytes(user.quotaSizeInBytes);
        percentage = user.quotaUsageInBytes / user.quotaSizeInBytes;
      }

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 12,
          children: [
            Text(context.t.backup_controller_page_server_storage, style: context.textTheme.labelLarge),
            LinearProgressIndicator(
              minHeight: 10.0,
              value: percentage,
              borderRadius: const BorderRadius.all(Radius.circular(10.0)),
            ),
            Text(
              context.t.backup_controller_page_storage_format(used: usedDiskSpace, total: totalDiskSpace),
              style: context.textTheme.bodySmall,
            ),
          ],
        ),
      );
    }

    Padding buildFooter() {
      return Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            InkWell(
              onTap: () {
                ContextHelper(context).pop();
                unawaited(launchUrl(Uri.parse('https://docs.immich.app'), mode: LaunchMode.externalApplication));
              },
              child: Text(context.t.documentation, style: context.textTheme.bodySmall),
            ),
            const SizedBox(width: 20, child: Text("•", textAlign: TextAlign.center)),
            InkWell(
              onTap: () {
                ContextHelper(context).pop();
                unawaited(
                  launchUrl(Uri.parse('https://github.com/immich-app/immich'), mode: LaunchMode.externalApplication),
                );
              },
              child: Text(context.t.profile_drawer_github, style: context.textTheme.bodySmall),
            ),
            const SizedBox(width: 20, child: Text("•", textAlign: TextAlign.center)),
            InkWell(
              onTap: () async {
                ContextHelper(context).pop();
                final packageInfo = await PackageInfo.fromPlatform();
                if (!context.mounted) {
                  return;
                }

                showLicensePage(
                  context: context,
                  applicationIcon: const Padding(
                    padding: EdgeInsetsGeometry.symmetric(vertical: 10),
                    child: ImmichLogo(size: 40),
                  ),
                  applicationVersion: packageInfo.version,
                );
              },
              child: Text(context.t.licenses, style: context.textTheme.bodySmall),
            ),
          ],
        ),
      );
    }

    Padding buildReadonlyMessage() {
      return Padding(
        padding: const EdgeInsets.only(left: 10.0, right: 10.0),
        child: ListTile(
          dense: true,
          visualDensity: VisualDensity.standard,
          contentPadding: const EdgeInsets.only(left: 20, right: 20),
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
          minLeadingWidth: 20,
          tileColor: theme.primaryColor.withAlpha(80),
          title: Text(
            context.t.profile_drawer_readonly_mode,
            style: theme.textTheme.labelLarge?.copyWith(color: theme.textTheme.labelLarge?.color?.withAlpha(250)),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return Dismissible(
      behavior: HitTestBehavior.translucent,
      direction: DismissDirection.down,
      onDismissed: (_) => ContextHelper(context).pop(),
      key: const Key('app_bar_dialog'),
      child: Dialog(
        clipBehavior: Clip.hardEdge,
        alignment: Alignment.topCenter,
        insetPadding: EdgeInsets.only(
          top: isHorizontal ? 20 : 40,
          left: horizontalPadding,
          right: horizontalPadding,
          bottom: isHorizontal ? 20 : 100,
        ),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(20))),
        child: SizedBox(
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(padding: const EdgeInsets.symmetric(horizontal: 8), child: buildTopRow()),
                Container(
                  decoration: BoxDecoration(
                    color: context.colorScheme.surface,
                    borderRadius: const BorderRadius.all(Radius.circular(10)),
                  ),
                  margin: const EdgeInsets.only(left: 12, right: 12, bottom: 8),
                  child: Column(
                    children: [
                      const AppBarProfileInfoBox(),
                      Divider(thickness: 4, color: context.colorScheme.surfaceContainer),
                      buildStorageInformation(),
                      Divider(thickness: 4, color: context.colorScheme.surfaceContainer),
                      const AppBarServerInfo(),
                    ],
                  ),
                ),
                if (isReadonlyModeEnabled) buildReadonlyMessage(),
                buildAppLogButton(),
                buildFreeUpSpaceButton(),
                buildSettingButton(),
                buildSignOutButton(),
                buildFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
