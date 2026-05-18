import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info.dart';

class SharedLinkItem extends ConsumerWidget {
  final SharedLink sharedLink;

  const SharedLinkItem(this.sharedLink, {super.key});

  bool isExpired() => sharedLink.expiresAt?.isBefore(DateTime.now()) ?? false;

  Widget buildExpiryDuration(BuildContext context) {
    var expiresText = context.t.shared_link_expires_never;
    IconData expiryIcon = Icons.schedule;

    if (sharedLink.expiresAt != null) {
      if (isExpired()) {
        expiresText = context.t.expired;
        expiryIcon = Icons.timer_off_outlined;
      }

      final difference = sharedLink.expiresAt!.difference(DateTime.now());
      dPrint(() => "Difference: $difference");

      if (difference.inDays > 0) {
        var dayDifference = difference.inDays;
        if (difference.inHours % 24 > 12) {
          dayDifference += 1;
        }
        expiresText = context.t.shared_link_expires_days(count: dayDifference);
      } else if (difference.inHours > 0) {
        expiresText = context.t.shared_link_expires_hours(count: difference.inHours);
      } else if (difference.inMinutes > 0) {
        expiresText = context.t.shared_link_expires_minutes(count: difference.inMinutes);
      } else if (difference.inSeconds > 0) {
        expiresText = context.t.shared_link_expires_seconds(count: difference.inSeconds);
      }
    }

    return Row(
      children: [
        Icon(expiryIcon, size: 12, color: isExpired() ? context.colorScheme.error : context.colorScheme.onSurface),
        const SizedBox(width: 4),
        Text(
          expiresText,
          style: TextStyle(color: isExpired() ? context.colorScheme.error : context.colorScheme.onSurface),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final thumbnailUrl = sharedLink.thumbAssetId != null ? getThumbnailUrlForRemoteId(sharedLink.thumbAssetId!) : null;
    final imageSize = math.min(context.width / 4, 100.0);

    Future<void> copyShareLinkToClipboard() async {
      final externalDomain = ref.read(serverInfoProvider.select((s) => s.serverConfig.externalDomain));
      final serverUrl = externalDomain.isNotEmpty ? externalDomain : getServerUrl();
      final shareUrl = buildSharedLinkUrl(baseUrl: serverUrl, slug: sharedLink.slug, key: sharedLink.key);

      if (shareUrl == null) {
        ImmichToast.show(
          context: context,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
          msg: context.t.shared_link_error_server_url_fetch,
        );
        return;
      }

      await Clipboard.setData(ClipboardData(text: shareUrl));
      if (!context.mounted) {
        return;
      }
      context.scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text(
            context.t.shared_link_clipboard_copied_massage,
            style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    }

    Widget buildThumbnail() {
      return SizedBox(
        height: imageSize * 1.2,
        width: imageSize,
        child: thumbnailUrl == null
            ? const Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                child: Icon(Icons.image_not_supported_outlined),
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
          if (sharedLink.allowUpload) buildInfoChip(context.t.upload),
          if (sharedLink.allowDownload) buildInfoChip(context.t.download),
          if (sharedLink.showMetadata) buildInfoChip(context.t.shared_link_info_chip_metadata),
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
          buildExpiryDuration(context),
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
      confirmDismiss: (_) async {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (BuildContext context) => ConfirmDialog(
            title: "delete_shared_link_dialog_title",
            content: "confirm_delete_shared_link",
            onOk: () {},
          ),
        );

        if (confirmed == true) {
          await ref.read(sharedLinksStateProvider.notifier).deleteLink(sharedLink.id);
          return true;
        }

        return false;
      },
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
