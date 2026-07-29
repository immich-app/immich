import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/timezone.dart';

const _kSeparator = '  •  ';

class DateTimeDetails extends ConsumerWidget {
  final BaseAsset asset;
  final ExifInfo? exifInfo;

  const DateTimeDetails({super.key, required this.asset, this.exifInfo});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    final exifInfo = this.exifInfo;
    final isOwner = ref.watch(currentUserProvider)?.id == (asset is RemoteAsset ? asset.ownerId : null);

    return Column(
      children: [
        SheetTile(
          title: _getDateTime(context, asset, exifInfo),
          titleStyle: context.textTheme.labelLarge,
          trailing: asset.hasRemote && isOwner ? const Icon(Icons.edit, size: 18) : null,
          onTap: asset.hasRemote && isOwner
              ? () async => await ref.read(actionProvider.notifier).editDateTime(ActionSource.viewer, context)
              : null,
        ),
      ],
    );
  }

  static String _getDateTime(BuildContext ctx, BaseAsset asset, ExifInfo? exifInfo) {
    DateTime dateTime = asset.createdAt.toLocal();
    Duration timeZoneOffset = dateTime.timeZoneOffset;

    if (exifInfo?.dateTimeOriginal != null) {
      (dateTime, timeZoneOffset) = applyTimezoneOffset(
        dateTime: exifInfo!.dateTimeOriginal!,
        timeZone: exifInfo.timeZone,
      );
    }

    final date = DateFormat.yMMMEd(ctx.locale.toLanguageTag()).format(dateTime);
    final time = DateFormat.jm(ctx.locale.toLanguageTag()).format(dateTime);
    final timezone = 'GMT${timeZoneOffset.formatAsOffset()}';
    return '$date$_kSeparator$time $timezone';
  }
}
