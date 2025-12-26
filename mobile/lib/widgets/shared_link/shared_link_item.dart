import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info.dart';
import 'package:immich_mobile/utils/debug_print.dart';

class SharedLinkItem extends ConsumerWidget {
  final SharedLink sharedLink;

  const SharedLinkItem(this.sharedLink, {super.key});

  bool isExpired() => sharedLink.expiresAt?.isBefore(DateTime.now()) ?? false;

  Widget buildExpiryDuration() {
    var expiresText = "shared_link_expires_never".tr();
    IconData expiryIcon = Icons.schedule;

    if (sharedLink.expiresAt != null) {
      if (isExpired()) {
        expiresText = "expired".tr();
        expiryIcon = Icons.timer_off_outlined;
      }

      final difference = sharedLink.expiresAt!.difference(DateTime.now());
      dPrint(() => "Difference: $difference");

      if (difference.inDays > 0) {
        var dayDifference = difference.inDays;
        if (difference.inHours % 24 > 12) dayDifference += 1;
        expiresText = "shared_link_expires_days".tr(namedArgs: {'count': dayDifference.toString()});
      } else if (difference.inHours > 0) {
        expiresText = "shared_link_expires_hours".tr(namedArgs: {'count': difference.inHours.toString()});
      } else if (difference.inMinutes > 0) {
        expiresText = "shared_link_expires_minutes".tr(namedArgs: {'count': difference.inMinutes.toString()});
      } else if (difference.inSeconds > 0) {
        expiresText = "shared_link_expires_seconds".tr(namedArgs: {'count': difference.inSeconds.toString()});
      }
    }

    return Row(children: [Icon(expiryIcon, size: 12), const SizedBox(width: 4), Text(expiresText)]);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final thumbnailUrl = sharedLink.thumbAssetId != null ? getThumbnailUrlForRemoteId(sharedLink.thumbAssetId!) : null;
    final imageSize = math.min(context.width / 4, 100.0);

    void copyShareLinkToClipboard() {
      final externalDomain = ref.read(serverInfoProvider.select((s) => s.serverConfig.externalDomain));
      var serverUrl = externalDomain.isNotEmpty ? externalDomain : getServerUrl();
      if (serverUrl != null && !serverUrl.endsWith('/')) serverUrl += '/';

      if (serverUrl == null) {
        ImmichToast.show(
          context: context,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
          msg: "shared_link_error_server_url_fetch".tr(),
        );
        return;
      }

      final urlPath = sharedLink.slug?.isNotEmpty == true ? sharedLink.slug : sharedLink.key;

      Clipboard.setData(ClipboardData(text: "${serverUrl}s/$urlPath")).then(
        (_) => context.scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text(
              "shared_link_clipboard_copied_massage",
              style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
            ).tr(),
            duration: const Duration(seconds: 2),
          ),
        ),
      );
    }

    Future<void> deleteShareLink() async {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          return ConfirmDialog(
            title: "delete_shared_link_dialog_title",
            content: "confirm_delete_shared_link",
            onOk: () => ref.read(sharedLinksStateProvider.notifier).deleteLink(sharedLink.id),
          );
        },
      );
    }

    Widget buildThumbnail() {
      return SizedBox(
        height: imageSize * 1.2,
        width: imageSize,
        child: thumbnailUrl == null
            ? Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.image_not_supported_outlined),
              )
            : ThumbnailWithInfo(
                imageUrl: thumbnailUrl,
                key: key,
                textInfo: '',
                noImageIcon: Icons.image_not_supported_outlined,
                onTap: () => context.pushRoute(SharedLinkEditRoute(existingLink: sharedLink)),
              ),
      );
    }

    Widget buildInfoChip(String labelText) {
      return Card.outlined(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Text(labelText, style: const TextStyle(fontSize: 11)),
        ),
      );
    }

    Widget buildShareParameterInfos() {
      return Row(
        spacing: 4,
        children: [
          if (sharedLink.allowUpload) buildInfoChip("upload".tr()),
          if (sharedLink.allowDownload) buildInfoChip("download".tr()),
          if (sharedLink.showMetadata) buildInfoChip("shared_link_info_chip_metadata".tr()),
        ],
      );
    }

    Widget buildSharedLinkDetails() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 5),
          Text(
            sharedLink.title,
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (sharedLink.description?.isNotEmpty ?? false)
            Text(sharedLink.description!, overflow: TextOverflow.ellipsis),
          buildExpiryDuration(),
          buildShareParameterInfos(),
        ],
      );
    }

    return Dismissible(
      key: ValueKey(sharedLink.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: Theme.of(context).colorScheme.error,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: Icon(Icons.delete, color: Theme.of(context).colorScheme.onError),
      ),
      onDismissed: (_) => deleteShareLink(),
      child: InkWell(
        onTap: () => context.pushRoute(SharedLinkEditRoute(existingLink: sharedLink)),
        onLongPress: copyShareLinkToClipboard,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              buildThumbnail(),
              const SizedBox(width: 12),
              Expanded(child: buildSharedLinkDetails()),
            ],
          ),
        ),
      ),
    );
  }
}
