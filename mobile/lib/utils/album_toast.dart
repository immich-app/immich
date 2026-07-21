import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart' show BulkIdErrorReason;

/// Maps an [ActionResult] from an add-to-album operation to the appropriate
/// toast message and type, mirroring the web's priority order:
///   1. Some added (with or without duplicates) → success/conflicts message
///   2. All duplicates → "already in album"
///   3. No permission → specific error
///   4. Not found → specific error
///   5. Anything else → generic error
(String msg, ToastType type) resolveAlbumAddToast(ActionResult result, String albumName, BuildContext context) {
  final duplicate = result.failureReasons[BulkIdErrorReason.duplicate] ?? 0;

  if (result.count > 0 && duplicate == 0) {
    return ('add_to_album_bottom_sheet_added'.t(context: context, args: {'album': albumName}), ToastType.info);
  }

  if (result.count > 0 && duplicate > 0) {
    return (
      'home_page_add_to_album_conflicts'.t(
        context: context,
        args: {'added': result.count, 'album': albumName, 'failed': duplicate},
      ),
      ToastType.info,
    );
  }

  if (duplicate > 0) {
    return ('add_to_album_bottom_sheet_already_exists'.t(context: context, args: {'album': albumName}), ToastType.info);
  }

  if ((result.failureReasons[BulkIdErrorReason.noPermission] ?? 0) > 0) {
    return ('errors.add_to_album_no_permission'.t(context: context), ToastType.error);
  }

  if ((result.failureReasons[BulkIdErrorReason.notFound] ?? 0) > 0) {
    return ('errors.add_to_album_not_found'.t(context: context), ToastType.error);
  }

  return ('scaffold_body_error_occurred'.t(context: context), ToastType.error);
}
