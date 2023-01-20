import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/server_info_state.model.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:package_info_plus/package_info_plus.dart';

class ServerInfoBox extends HookConsumerWidget {
  const ServerInfoBox({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ServerInfoState serverInfoState = ref.watch(serverInfoProvider);

    final appInfo = useState({});

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
      padding: const EdgeInsets.all(8.0),
      child: Card(
        elevation: 0,
        color: Theme.of(context).scaffoldBackgroundColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(5), // if you need this
          side: const BorderSide(
            color: Color.fromARGB(101, 201, 201, 201),
            width: 1,
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
                    color: Theme.of(context).primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Divider(
                color: Color.fromARGB(101, 201, 201, 201),
                thickness: 1,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "App Version",
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    "${appInfo.value["version"]} build.${appInfo.value["buildNumber"]}",
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const Divider(
                color: Color.fromARGB(101, 201, 201, 201),
                thickness: 1,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Server Version",
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    "${serverInfoState.serverVersion.major}.${serverInfoState.serverVersion.minor}.${serverInfoState.serverVersion.patch_}",
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.bold,
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
