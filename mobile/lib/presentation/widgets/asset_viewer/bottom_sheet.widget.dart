import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet/sheet_location_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet/sheet_people_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

const _kSeparator = '  •  ';

class AssetDetailBottomSheet extends ConsumerWidget {
  final DraggableScrollableController? controller;
  final double initialChildSize;

  const AssetDetailBottomSheet({this.controller, this.initialChildSize = 0.35, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final isTrashEnable = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
    final isOwner = asset is RemoteAsset && asset.ownerId == ref.watch(currentUserProvider)?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);
    final currentAlbum = ref.watch(currentRemoteAlbumProvider);
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final advancedTroubleshooting = ref.watch(settingsProvider.notifier).get(Setting.advancedTroubleshooting);

    final buttonContext = ActionButtonContext(
      asset: asset,
      isOwner: isOwner,
      isArchived: isArchived,
      isTrashEnabled: isTrashEnable,
      isInLockedView: isInLockedView,
      currentAlbum: currentAlbum,
      advancedTroubleshooting: advancedTroubleshooting,
      source: ActionSource.viewer,
    );

    final actions = ActionButtonBuilder.build(buttonContext);

    return BaseBottomSheet(
      actions: actions,
      slivers: const [_AssetDetailBottomSheet()],
      controller: controller,
      initialChildSize: initialChildSize,
      minChildSize: 0.1,
      maxChildSize: 0.88,
      expand: false,
      shouldCloseOnMinExtent: false,
      resizeOnScroll: false,
      backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
    );
  }
}

class _AssetDetailBottomSheet extends ConsumerWidget {
  const _AssetDetailBottomSheet();

  String _getDateTime(BuildContext ctx, BaseAsset asset) {
    final dateTime = asset.createdAt.toLocal();
    final date = DateFormat.yMMMEd(ctx.locale.toLanguageTag()).format(dateTime);
    final time = DateFormat.jm(ctx.locale.toLanguageTag()).format(dateTime);
    final timezone = dateTime.timeZoneOffset.isNegative
        ? 'UTC-${dateTime.timeZoneOffset.inHours.abs().toString().padLeft(2, '0')}:${(dateTime.timeZoneOffset.inMinutes.abs() % 60).toString().padLeft(2, '0')}'
        : 'UTC+${dateTime.timeZoneOffset.inHours.toString().padLeft(2, '0')}:${(dateTime.timeZoneOffset.inMinutes.abs() % 60).toString().padLeft(2, '0')}';
    return '$date$_kSeparator$time $timezone';
  }

  String _getFileInfo(BaseAsset asset, ExifInfo? exifInfo) {
    final height = asset.height ?? exifInfo?.height;
    final width = asset.width ?? exifInfo?.width;
    final resolution = (width != null && height != null) ? "${width.toInt()} x ${height.toInt()}" : null;
    final fileSize = exifInfo?.fileSize != null ? formatBytes(exifInfo!.fileSize!) : null;

    return switch ((fileSize, resolution)) {
      (null, null) => '',
      (String fileSize, null) => fileSize,
      (null, String resolution) => resolution,
      (String fileSize, String resolution) => '$fileSize$_kSeparator$resolution',
    };
  }

  String? _getCameraInfoTitle(ExifInfo? exifInfo) {
    if (exifInfo == null) {
      return null;
    }

    return switch ((exifInfo.make, exifInfo.model)) {
      (null, null) => null,
      (String make, null) => make,
      (null, String model) => model,
      (String make, String model) => '$make $model',
    };
  }

  String? _getCameraInfoSubtitle(ExifInfo? exifInfo) {
    if (exifInfo == null) {
      return null;
    }

    final fNumber = exifInfo.fNumber.isNotEmpty ? 'ƒ/${exifInfo.fNumber}' : null;
    final exposureTime = exifInfo.exposureTime.isNotEmpty ? exifInfo.exposureTime : null;
    final focalLength = exifInfo.focalLength.isNotEmpty ? '${exifInfo.focalLength} mm' : null;
    final iso = exifInfo.iso != null ? 'ISO ${exifInfo.iso}' : null;

    return [fNumber, exposureTime, focalLength, iso].where((spec) => spec != null && spec.isNotEmpty).join(_kSeparator);
  }

  Future<void> _editDateTime(BuildContext context, WidgetRef ref) async {
    await ref.read(actionProvider.notifier).editDateTime(ActionSource.viewer, context);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;
    final cameraTitle = _getCameraInfoTitle(exifInfo);

    return SliverList.list(
      children: [
        // Asset Date and Time
        _SheetTile(
          title: _getDateTime(context, asset),
          titleStyle: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          trailing: asset.hasRemote ? const Icon(Icons.edit, size: 18) : null,
          onTap: asset.hasRemote ? () async => await _editDateTime(context, ref) : null,
        ),
        if (exifInfo != null) _SheetAssetDescription(exif: exifInfo),
        const SheetPeopleDetails(),
        const SheetLocationDetails(),
        // Details header
        _SheetTile(
          title: 'exif_bottom_sheet_details'.t(context: context),
          titleStyle: context.textTheme.labelMedium?.copyWith(
            color: context.textTheme.labelMedium?.color?.withAlpha(200),
            fontWeight: FontWeight.w600,
          ),
        ),
        // File info
        _SheetTile(
          title: asset.name,
          titleStyle: context.textTheme.labelLarge,
          leading: Icon(
            asset.isImage ? Icons.image_outlined : Icons.videocam_outlined,
            size: 24,
            color: context.textTheme.labelLarge?.color,
          ),
          subtitle: _getFileInfo(asset, exifInfo),
          subtitleStyle: context.textTheme.bodyMedium?.copyWith(
            color: context.textTheme.bodyMedium?.color?.withAlpha(155),
          ),
        ),
        // Camera info
        if (cameraTitle != null)
          _SheetTile(
            title: cameraTitle,
            titleStyle: context.textTheme.labelLarge,
            leading: Icon(Icons.camera_outlined, size: 24, color: context.textTheme.labelLarge?.color),
            subtitle: _getCameraInfoSubtitle(exifInfo),
            subtitleStyle: context.textTheme.bodyMedium?.copyWith(
              color: context.textTheme.bodyMedium?.color?.withAlpha(155),
            ),
          ),
      ],
    );
  }
}

class _SheetTile extends ConsumerWidget {
  final String title;
  final Widget? leading;
  final Widget? trailing;
  final String? subtitle;
  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;
  final VoidCallback? onTap;

  const _SheetTile({
    required this.title,
    this.titleStyle,
    this.leading,
    this.subtitle,
    this.subtitleStyle,
    this.trailing,
    this.onTap,
  });

  void copyTitle(BuildContext context, WidgetRef ref) {
    Clipboard.setData(ClipboardData(text: title));
    ImmichToast.show(
      context: context,
      msg: 'copied_to_clipboard'.t(context: context),
      toastType: ToastType.info,
    );
    ref.read(hapticFeedbackProvider.notifier).selectionClick();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Widget titleWidget;
    if (leading == null) {
      titleWidget = LimitedBox(
        maxWidth: double.infinity,
        child: Text(title, style: titleStyle),
      );
    } else {
      titleWidget = Container(
        width: double.infinity,
        padding: const EdgeInsets.only(left: 15),
        child: Text(title, style: titleStyle),
      );
    }

    final Widget? subtitleWidget;
    if (leading == null && subtitle != null) {
      subtitleWidget = Text(subtitle!, style: subtitleStyle);
    } else if (leading != null && subtitle != null) {
      subtitleWidget = Padding(
        padding: const EdgeInsets.only(left: 15),
        child: Text(subtitle!, style: subtitleStyle),
      );
    } else {
      subtitleWidget = null;
    }

    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      title: GestureDetector(onLongPress: () => copyTitle(context, ref), child: titleWidget),
      titleAlignment: ListTileTitleAlignment.center,
      leading: leading,
      trailing: trailing,
      contentPadding: leading == null ? null : const EdgeInsets.only(left: 25),
      subtitle: subtitleWidget,
      onTap: onTap,
    );
  }
}

class _SheetAssetDescription extends ConsumerStatefulWidget {
  final ExifInfo exif;

  const _SheetAssetDescription({required this.exif});

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
    // Watch the current asset EXIF provider to get updates
    final currentExifInfo = ref.watch(currentAssetExifProvider).valueOrNull;

    // Update controller text when EXIF data changes
    final currentDescription = currentExifInfo?.description ?? '';
    if (_controller.text != currentDescription && !_descriptionFocus.hasFocus) {
      _controller.text = currentDescription;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
      child: TextField(
        controller: _controller,
        keyboardType: TextInputType.multiline,
        focusNode: _descriptionFocus,
        maxLines: null, // makes it grow as text is added
        decoration: InputDecoration(
          hintText: 'exif_bottom_sheet_description'.t(context: context),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          disabledBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
        ),
        onTapOutside: (_) => saveDescription(currentExifInfo?.description),
      ),
    );
  }
}
