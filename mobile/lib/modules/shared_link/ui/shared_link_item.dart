import 'dart:math' as math;
import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/modules/shared_link/providers/shared_link.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/url_helper.dart';

class SharedLinkItem extends ConsumerWidget {
  final SharedLink sharedLink;

  const SharedLinkItem(this.sharedLink, {super.key});

  bool isExpired() {
    if (sharedLink.expiresAt != null) {
      return DateTime.now().isAfter(sharedLink.expiresAt!);
    }
    return false;
  }

  Widget getExpiryDuration(bool isDarkMode) {
    var expiresText = "shared_link_expires_never".tr();
    if (sharedLink.expiresAt != null) {
      if (isExpired()) {
        return Text(
          "shared_link_expired",
          style: TextStyle(color: Colors.red[300]),
        ).tr();
      }
      final difference = sharedLink.expiresAt!.difference(DateTime.now());
      debugPrint("Difference: $difference");
      if (difference.inDays > 0) {
        var dayDifference = difference.inDays;
        if (difference.inHours % 24 > 12) {
          dayDifference += 1;
        }
        expiresText =
            "shared_link_expires_days".tr(args: [dayDifference.toString()]);
      } else if (difference.inHours > 0) {
        expiresText = "shared_link_expires_hours"
            .tr(args: [difference.inHours.toString()]);
      } else if (difference.inMinutes > 0) {
        expiresText = "shared_link_expires_minutes"
            .tr(args: [difference.inMinutes.toString()]);
      } else if (difference.inSeconds > 0) {
        expiresText = "shared_link_expires_seconds"
            .tr(args: [difference.inSeconds.toString()]);
      }
    }
    return Text(
      expiresText,
      style: TextStyle(color: isDarkMode ? Colors.grey[400] : Colors.grey[600]),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeData = context.themeData;
    final isDarkMode = themeData.brightness == Brightness.dark;
    final thumbnailUrl = sharedLink.thumbAssetId != null
        ? getThumbnailUrlForRemoteId(sharedLink.thumbAssetId!)
        : null;
    final imageSize = math.min(context.width / 4, 100.0);

    void copyShareLinkToClipboard() {
      final externalDomain = ref.read(
        serverInfoProvider.select((s) => s.serverConfig.externalDomain),
      );
      var serverUrl =
          externalDomain.isNotEmpty ? externalDomain : getServerUrl();
      if (serverUrl != null && !serverUrl.endsWith('/')) {
        serverUrl += '/';
      }
      if (serverUrl == null) {
        ImmichToast.show(
          context: context,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
          msg: "shared_link_error_server_url_fetch".tr(),
        );
        return;
      }

      Clipboard.setData(
        ClipboardData(text: "${serverUrl}share/${sharedLink.key}"),
      ).then((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "shared_link_clipboard_copied_massage",
              style: context.textTheme.bodyLarge?.copyWith(
                color: context.primaryColor,
              ),
            ).tr(),
            duration: const Duration(seconds: 2),
          ),
        );
      });
    }

    Future<void> deleteShareLink() async {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          return ConfirmDialog(
            title: "delete_shared_link_dialog_title",
            content: "delete_shared_link_dialog_content",
            onOk: () => ref
                .read(sharedLinksStateProvider.notifier)
                .deleteLink(sharedLink.id),
          );
        },
      );
    }

    Widget buildThumbnail() {
      if (thumbnailUrl == null) {
        return Container(
          height: imageSize * 1.2,
          width: imageSize,
          decoration: BoxDecoration(
            color: isDarkMode ? Colors.grey[800] : Colors.grey[200],
          ),
          child: Center(
            child: Icon(
              Icons.image_not_supported_outlined,
              color: isDarkMode ? Colors.grey[100] : Colors.grey[700],
            ),
          ),
        );
      }
      return SizedBox(
        height: imageSize * 1.2,
        width: imageSize,
        child: Padding(
          padding: const EdgeInsets.only(right: 4.0),
          child: ThumbnailWithInfo(
            imageUrl: thumbnailUrl,
            key: key,
            textInfo: '',
            noImageIcon: Icons.image_not_supported_outlined,
            onTap: () {},
          ),
        ),
      );
    }

    Widget buildInfoChip(String labelText) {
      return Padding(
        padding: const EdgeInsets.only(right: 10),
        child: Chip(
          backgroundColor: themeData.primaryColor,
          label: Text(
            labelText,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: isDarkMode ? Colors.black : Colors.white,
            ),
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(25)),
          ),
        ),
      );
    }

    Widget buildBottomInfo() {
      return Row(
        children: [
          if (sharedLink.allowUpload)
            buildInfoChip("shared_link_info_chip_upload".tr()),
          if (sharedLink.allowDownload)
            buildInfoChip("shared_link_info_chip_download".tr()),
          if (sharedLink.showMetadata)
            buildInfoChip("shared_link_info_chip_metadata".tr()),
        ],
      );
    }

    Widget buildSharedLinkActions() {
      const actionIconSize = 20.0;
      return Row(
        children: [
          IconButton(
            splashRadius: 25,
            constraints: const BoxConstraints(),
            iconSize: actionIconSize,
            icon: const Icon(Icons.delete_outline),
            style: const ButtonStyle(
              tapTargetSize:
                  MaterialTapTargetSize.shrinkWrap, // the '2023' part
            ),
            onPressed: deleteShareLink,
          ),
          IconButton(
            splashRadius: 25,
            constraints: const BoxConstraints(),
            iconSize: actionIconSize,
            icon: const Icon(Icons.edit_outlined),
            style: const ButtonStyle(
              tapTargetSize:
                  MaterialTapTargetSize.shrinkWrap, // the '2023' part
            ),
            onPressed: () => context
                .pushRoute(SharedLinkEditRoute(existingLink: sharedLink)),
          ),
          IconButton(
            splashRadius: 25,
            constraints: const BoxConstraints(),
            iconSize: actionIconSize,
            icon: const Icon(Icons.copy_outlined),
            style: const ButtonStyle(
              tapTargetSize:
                  MaterialTapTargetSize.shrinkWrap, // the '2023' part
            ),
            onPressed: copyShareLinkToClipboard,
          ),
        ],
      );
    }

    Widget buildSharedLinkDetails() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          getExpiryDuration(isDarkMode),
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Tooltip(
              verticalOffset: 0,
              decoration: BoxDecoration(
                color: themeData.primaryColor.withOpacity(0.9),
                borderRadius: BorderRadius.circular(10),
              ),
              textStyle: TextStyle(
                color: isDarkMode ? Colors.black : Colors.white,
                fontWeight: FontWeight.bold,
              ),
              message: sharedLink.title,
              preferBelow: false,
              triggerMode: TooltipTriggerMode.tap,
              child: Text(
                sharedLink.title,
                style: TextStyle(
                  color: themeData.primaryColor,
                  fontWeight: FontWeight.bold,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Tooltip(
                  verticalOffset: 0,
                  decoration: BoxDecoration(
                    color: themeData.primaryColor.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: TextStyle(
                    color: isDarkMode ? Colors.black : Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  message: sharedLink.description ?? "",
                  preferBelow: false,
                  triggerMode: TooltipTriggerMode.tap,
                  child: Text(
                    sharedLink.description ?? "",
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 15),
                child: buildSharedLinkActions(),
              ),
            ],
          ),
          buildBottomInfo(),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 15),
              child: buildThumbnail(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(left: 15),
                child: buildSharedLinkDetails(),
              ),
            ),
          ],
        ),
        const Padding(
          padding: EdgeInsets.all(20),
          child: Divider(
            height: 0,
          ),
        ),
      ],
    );
  }
}
