import 'package:collection/collection.dart';
import 'package:openapi/api.dart';

class AssetPresenceApi {
  const AssetPresenceApi(this._api);

  final AssetsApi _api;

  Future<List<String>> check(Iterable<String> checksums, {Future<void>? abortSignal}) async {
    final matches = <String>[];
    for (final chunk in checksums.toSet().slices(1000)) {
      final response = await _api.checkBulkUpload(
        AssetBulkUploadCheckDto(
          presenceOnly: const Optional.present(true),
          assets: [
            for (final (index, checksum) in chunk.indexed)
              AssetBulkUploadCheckItem(id: index.toString(), checksum: checksum),
          ],
        ),
        abortTrigger: abortSignal,
      );
      if (response == null) {
        throw const FormatException('Missing asset presence response');
      }
      for (final result in response.results) {
        final index = int.tryParse(result.id);
        if (result.reason.orElse(null) == AssetRejectReason.duplicate &&
            index != null &&
            index >= 0 &&
            index < chunk.length) {
          matches.add(chunk[index]);
        }
      }
    }
    return matches;
  }
}
