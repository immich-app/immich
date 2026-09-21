import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class SheetAssetDescription extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final ExifInfo? exifInfo;

  const SheetAssetDescription({super.key, required this.asset, this.exifInfo});

  @override
  ConsumerState<SheetAssetDescription> createState() => _SheetAssetDescriptionState();
}

class _SheetAssetDescriptionState extends ConsumerState<SheetAssetDescription> {
  late TextEditingController _controller;
  final _descriptionFocus = FocusNode();

  @override
  void initState() {
    super.initState();

    _controller = TextEditingController(text: widget.exifInfo?.description ?? '');
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
      if (!mounted) {
        return;
      }

      ImmichToast.show(
        context: context,
        msg: context.t.exif_bottom_sheet_description_error,
        toastType: ToastType.error,
      );
    }

    _descriptionFocus.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    final isOwner = ref.watch(currentUserProvider)?.id == (asset is RemoteAsset ? asset.ownerId : null);

    final currentDescription = widget.exifInfo?.description ?? '';
    final hintText = isOwner ? context.t.exif_bottom_sheet_description : context.t.exif_bottom_sheet_no_description;
    if (_controller.text != currentDescription && !_descriptionFocus.hasFocus) {
      _controller.text = currentDescription;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
      child: IgnorePointer(
        ignoring: !isOwner,
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
          onTapOutside: (_) => saveDescription(widget.exifInfo?.description),
        ),
      ),
    );
  }
}
