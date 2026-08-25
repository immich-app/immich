import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/presentation/actions/edit_datetime.action.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
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
    final editDateTime = const EditDateTimeAction(source: .viewer).create(context, ref);

    return Column(
      children: [
        SheetTile(
          title: _getDateTime(context, asset, exifInfo),
          titleStyle: context.textTheme.labelLarge,
          trailing: editDateTime == null ? null : const Icon(Icons.edit, size: 18),
          onTap: editDateTime?.onAction,
        ),
      ],
    );
  }

  static String _getDateTime(BuildContext ctx, BaseAsset asset, ExifInfo? exifInfo) {
    final alwaysUse24HourFormat = MediaQuery.alwaysUse24HourFormatOf(ctx);

    final (dateTime, timeZoneOffset) = resolveAssetDateTime(asset, exifInfo);

    final date = DateFormat.yMMMEd(resolvedDateTimeLocale()).format(dateTime);
    final time = dateTime.formatTime(alwaysUse24HourFormat: alwaysUse24HourFormat);
    final timezone = 'GMT${timeZoneOffset.formatAsOffset()}';
    return '$date$_kSeparator$time $timezone';
  }
}
