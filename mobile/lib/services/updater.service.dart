import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:logging/logging.dart';
import 'package:install_plugin/install_plugin.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:path_provider/path_provider.dart';

class Upgrade with ErrorLoggerMixin {
  @override
  final logger = Logger("UpgradeService");

  Future<bool> installApk(
    bool serverNeedsUpgrade,
    bool isVersionMismatch,
    ServerVersion latestVersion,
  ) async {
    // Check for new app
    if (!serverNeedsUpgrade) {
      return false;
    }
    if (isVersionMismatch) {
      int maj = latestVersion.major;
      int min = latestVersion.minor;
      int patch = latestVersion.patch;
      // Setup URL
      final client = http.Client();
      final url = Uri.https(
        'github.com',
        '/immich-app/immich/releases/download/v$maj.$min.$patch/app-release.apk',
      );
      // Try download
      try {
        final response = await client.get(url);
        if (response.statusCode == 200) {
          // Get storage directory
          final dir = await getExternalStorageDirectory();
          if (dir == null) {
            logger.severe("Cannot get external storage directory");
            return false;
          }
          // Save to file
          final filePath = '${dir.path}/immich_v$maj.$min.$patch.apk';
          final file = File(filePath);
          await file.writeAsBytes(response.bodyBytes);
          logger.info("APK downloaded to $filePath");
          // Install the APK
          await InstallPlugin.installApk(
            filePath,
            appId: 'app.alextran.immich',
          );
        } else {
          logger.severe("Failed to download APK: HTTP ${response.statusCode}");
        }
      } catch (e) {
        logger.severe('Install error: $e');
      } finally {
        client.close();
      }
    }
    return true;
  }
}
