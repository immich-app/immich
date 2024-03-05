import 'dart:io';

import 'package:file_edit_launcher/file_edit_launcher.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/response_extensions.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'api.service.dart';

final editWithServiceProvider =
    Provider((ref) => EditWithService(ref.watch(apiServiceProvider)));

class EditWithService {
  final ApiService _apiService;
  final Logger _log = Logger("EditWithService");

  EditWithService(this._apiService);

  Future<bool> editAsset(Asset asset) async {
    try {
      File? localFile;

      if (asset.isLocal) {
        // Use local assets
        localFile = await asset.local!.file;
      } else if (asset.isRemote) {
        // Download remote asset otherwise

        final tempDir = await getTemporaryDirectory();
        final fileName = asset.fileName;
        final tempFile = await File('${tempDir.path}/$fileName').create();
        final res = await _apiService.downloadApi
            .downloadFileWithHttpInfo(asset.remoteId!);

        if (res.statusCode != 200) {
          _log.severe(
            "Asset download for ${asset.fileName} failed",
            res.toLoggerString(),
          );
          return false;
        }

        tempFile.writeAsBytesSync(res.bodyBytes);
        localFile = tempFile;
      }

      if (localFile == null) {
        _log.warning("No asset can be retrieved for editing");
        return false;
      }

      if (Platform.isAndroid) {
        _log.info("Initiating file editing");
        final result = await FileEditLauncher.launchFileEditor(localFile);

        if (result.successful) {
          _log.info("File editing was successful.");
          return true;
        } else {
          _log.warning("File editing encountered an error: ${result.error}");
          return false;
        }
      } else if (Platform.isIOS) {
        _log.warning("Editing not supported on iOS yet. Opening file instead.");
        OpenFilex.open(localFile.path);
      }
      return true;
    } catch (error) {
      _log.severe("Failed to initiate file editing", error);
      return false;
    }
  }
}
