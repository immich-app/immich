import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AppBarServerInfo extends HookConsumerWidget {
  const AppBarServerInfo({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ServerInfo serverInfoState = ref.watch(serverInfoProvider);

    final appInfo = useState({});
    const titleFontSize = 12.0;
    const contentFontSize = 11.0;

    getPackageInfo() async {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();

      appInfo.value = {
        "version": packageInfo.version,
        "buildNumber": packageInfo.buildNumber,
      };
    }

    useEffect(
      () {
        getPackageInfo();
        return null;
      },
      [],
    );

    return Padding(
      padding: const EdgeInsets.only(left: 10.0, right: 10.0, bottom: 10.0),
      child: Container(
        decoration: BoxDecoration(
          color: context.colorScheme.surface,
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(10),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  serverInfoState.isVersionMismatch
                      ? serverInfoState.versionMismatchErrorMessage
                      : "profile_drawer_client_server_up_to_date".tr(),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    color: context.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Divider(thickness: 1),
              ),
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
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Divider(thickness: 1),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 10.0),
                      child: Text(
                        "server_info_box_server_version".tr(),
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
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Divider(thickness: 1),
              ),
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
                          borderRadius: BorderRadius.circular(10),
                        ),
                        textStyle: TextStyle(
                          color:
                              context.isDarkTheme ? Colors.black : Colors.white,
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
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Divider(thickness: 1),
              ),
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
                              child: Icon(
                                Icons.info,
                                color: Color.fromARGB(255, 243, 188, 106),
                                size: 12,
                              ),
                            ),
                          Text(
                            "server_info_box_latest_release".tr(),
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
