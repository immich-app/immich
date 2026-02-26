import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/sheet_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

const _kSeparator = '  •  ';

class DateTimeDetails extends ConsumerWidget {
  const DateTimeDetails({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) return const SizedBox.shrink();

    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;
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
        if (exifInfo != null) _SheetAssetDescription(exif: exifInfo, isEditable: isOwner),
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

class _SheetAssetDescription extends ConsumerStatefulWidget {
  final ExifInfo exif;
  final bool isEditable;

  const _SheetAssetDescription({required this.exif, this.isEditable = true});

  @override
  ConsumerState<_SheetAssetDescription> createState() => _SheetAssetDescriptionState();
}

class _SheetAssetDescriptionState extends ConsumerState<_SheetAssetDescription> {
  late TextEditingController _controller;
  final _descriptionFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.exif.description ?? '');
  }

  Future<void> saveDescription(String? previousDescription) async {
    final newDescription = _controller.text.trim();

    if (newDescription == previousDescription) {
      _descriptionFocus.unfocus();
      return;
    }

    final editAction = await ref.read(actionProvider.notifier).updateDescription(ActionSource.viewer, newDescription);

    if (!editAction.success) {
      _controller.text = previousDescription ?? '';

      ImmichToast.show(
        context: context,
        msg: 'exif_bottom_sheet_description_error'.t(context: context),
        toastType: ToastType.error,
      );
    }

    _descriptionFocus.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final currentExifInfo = ref.watch(currentAssetExifProvider).valueOrNull;

    final currentDescription = currentExifInfo?.description ?? '';
    final hintText = (widget.isEditable ? 'exif_bottom_sheet_description' : 'exif_bottom_sheet_no_description').t(
      context: context,
    );
    if (_controller.text != currentDescription && !_descriptionFocus.hasFocus) {
      _controller.text = currentDescription;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
      child: IgnorePointer(
        ignoring: !widget.isEditable,
        child: TextField(
          controller: _controller,
          keyboardType: TextInputType.multiline,
          maxLines: null,
          focusNode: _descriptionFocus,
          decoration: InputDecoration(
            hintText: hintText,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            disabledBorder: InputBorder.none,
            errorBorder: InputBorder.none,
            focusedErrorBorder: InputBorder.none,
          ),
          onTapOutside: (_) => saveDescription(currentExifInfo?.description),
        ),
      ),
    );
  }
}
