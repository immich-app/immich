import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/providers/locale_provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class AppBarServerInfo extends HookConsumerWidget {
  const AppBarServerInfo({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(localeProvider);
    ServerInfo serverInfoState = ref.watch(serverInfoProvider);

    final user = ref.watch(currentUserProvider);

    final appInfo = useState({});
    const titleFontSize = 12.0;
    const contentFontSize = 11.0;

    final showWarning =
        serverInfoState.isClientOutOfDate ||
        serverInfoState.errorGettingVersions ||
        ((user?.isAdmin ?? false) && serverInfoState.isServerOutOfDate);

    getPackageInfo() async {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();

      appInfo.value = {"version": packageInfo.version, "buildNumber": packageInfo.buildNumber};
    }

    void openUpdateLink() {
      if (serverInfoState.isServerOutOfDate) {
        launchUrl(
          Uri.parse("https://github.com/immich-app/immich/releases/latest"),
          mode: LaunchMode.externalApplication,
        );
        return;
      }

      if (Platform.isIOS) {
        launchUrl(Uri.parse("https://apps.apple.com/app/id1613945652"), mode: LaunchMode.externalApplication);
      } else if (Platform.isAndroid) {
        launchUrl(
          Uri.parse("https://play.google.com/store/apps/details?id=app.alextran.immich"),
          mode: LaunchMode.externalApplication,
        );
      } else {
        launchUrl(Uri.parse("https://immich.app/download"), mode: LaunchMode.externalApplication);
      }
    }

    useEffect(() {
      getPackageInfo();
      return null;
    }, []);

    return Padding(
      padding: const EdgeInsets.only(left: 10.0, right: 10.0, bottom: 10.0),
      child: Container(
        decoration: BoxDecoration(
          color: context.colorScheme.surface,
          borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(10), bottomRight: Radius.circular(10)),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (showWarning) ...[
                SizedBox(
                  width: double.infinity,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Color.fromARGB(80, 243, 188, 106),
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            serverInfoState.versionMismatchErrorMessage,
                            textAlign: (serverInfoState.isClientOutOfDate || serverInfoState.isServerOutOfDate)
                                ? TextAlign.start
                                : TextAlign.center,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (serverInfoState.isClientOutOfDate || serverInfoState.isServerOutOfDate)
                          TextButton(
                            onPressed: openUpdateLink,
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.all(4),
                              minimumSize: const Size(0, 0),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text("action_common_update".tr(context: context)),
                          ),
                      ],
                    ),
                  ),
                ),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Divider(thickness: 1)),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 10.0),
                      child: Text(
                        "server_info_box_app_version".tr(),
                        style: TextStyle(
                          fontSize: titleFontSize,
                          color: context.textTheme.labelSmall?.color,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 0,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10.0),
                      child: Text(
                        "${appInfo.value["version"]} build.${appInfo.value["buildNumber"]}",
                        style: TextStyle(
                          fontSize: contentFontSize,
                          color: context.colorScheme.onSurfaceSecondary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Divider(thickness: 1)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 10.0),
                      child: Text(
                        "server_version".tr(),
                        style: TextStyle(
                          fontSize: titleFontSize,
                          color: context.textTheme.labelSmall?.color,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 0,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10.0),
                      child: Text(
                        serverInfoState.serverVersion.major > 0
                            ? "${serverInfoState.serverVersion.major}.${serverInfoState.serverVersion.minor}.${serverInfoState.serverVersion.patch}"
                            : "--",
                        style: TextStyle(
                          fontSize: contentFontSize,
                          color: context.colorScheme.onSurfaceSecondary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Divider(thickness: 1)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 10.0),
                      child: Text(
                        "server_info_box_server_url".tr(),
                        style: TextStyle(
                          fontSize: titleFontSize,
                          color: context.textTheme.labelSmall?.color,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 0,
                    child: Container(
                      width: 200,
                      padding: const EdgeInsets.only(right: 10.0),
                      child: Tooltip(
                        verticalOffset: 0,
                        decoration: BoxDecoration(
                          color: context.primaryColor.withValues(alpha: 0.9),
                          borderRadius: const BorderRadius.all(Radius.circular(10)),
                        ),
                        textStyle: TextStyle(
                          color: context.isDarkTheme ? Colors.black : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                        message: getServerUrl() ?? '--',
                        preferBelow: false,
                        triggerMode: TooltipTriggerMode.tap,
                        child: Text(
                          getServerUrl() ?? '--',
                          style: TextStyle(
                            fontSize: contentFontSize,
                            color: context.colorScheme.onSurfaceSecondary,
                            fontWeight: FontWeight.bold,
                            overflow: TextOverflow.ellipsis,
                          ),
                          textAlign: TextAlign.end,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Divider(thickness: 1)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 10.0),
                      child: Row(
                        children: [
                          if (serverInfoState.isNewReleaseAvailable)
                            const Padding(
                              padding: EdgeInsets.only(right: 5.0),
                              child: Icon(Icons.info, color: Color.fromARGB(255, 243, 188, 106), size: 12),
                            ),
                          Text(
                            "latest_version".tr(),
                            style: TextStyle(
                              fontSize: titleFontSize,
                              color: context.textTheme.labelSmall?.color,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 0,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10.0),
                      child: Text(
                        serverInfoState.latestVersion.major > 0
                            ? "${serverInfoState.latestVersion.major}.${serverInfoState.latestVersion.minor}.${serverInfoState.latestVersion.patch}"
                            : "--",
                        style: TextStyle(
                          fontSize: contentFontSize,
                          color: context.colorScheme.onSurfaceSecondary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
