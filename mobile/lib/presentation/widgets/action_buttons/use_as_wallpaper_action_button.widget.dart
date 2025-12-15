import 'dart:io';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/services/wallpaper.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class UseAsWallpaperActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;
  const UseAsWallpaperActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    // TODO: Implement iOS support
    if (!Platform.isAndroid) {
      ImmichToast.show(
        context: context,
        msg: 'use_as_wallpaper_not_supported'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
      return;
    }

    final asset = _getAsset(ref);
    if (asset == null) {
      return;
    }

    if (!asset.isImage) {
      ImmichToast.show(
        context: context,
        msg: 'use_as_wallpaper_image_only'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
      return;
    }

    try {
      final wallpaperService = ref.read(wallpaperServiceProvider);
      final result = await wallpaperService.setAsWallpaper(asset);

      if (!context.mounted) {
        return;
      }

      if (!result) {
        ImmichToast.show(
          context: context,
          msg: 'use_as_wallpaper_failed'.t(context: context),
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
        );
      }
    } catch (e) {
      if (!context.mounted) {
        return;
      }

      ImmichToast.show(
        context: context,
        msg: 'use_as_wallpaper_failed'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
    } finally {
      if (source == ActionSource.timeline) {
        ref.read(multiSelectProvider.notifier).reset();
      }
    }
  }

  BaseAsset? _getAsset(WidgetRef ref) {
    return switch (source) {
      ActionSource.timeline => () {
        final selectedAssets = ref.read(multiSelectProvider).selectedAssets;
        if (selectedAssets.length == 1) {
          return selectedAssets.first;
        }
        return null;
      }(),
      ActionSource.viewer => ref.read(currentAssetNotifier),
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Implement iOS support - hide button on iOS for now
    if (!Platform.isAndroid) {
      return const SizedBox.shrink();
    }

    return BaseActionButton(
      iconData: Icons.wallpaper,
      maxWidth: 95,
      label: 'use_as_wallpaper'.t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
    );
  }
}
