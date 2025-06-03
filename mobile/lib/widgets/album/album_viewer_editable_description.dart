import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album_viewer.provider.dart';

class AlbumViewerEditableDescription extends HookConsumerWidget {
  final String albumDescription;
  final FocusNode descriptionFocusNode;
  const AlbumViewerEditableDescription({
    super.key,
    required this.albumDescription,
    required this.descriptionFocusNode,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumViewerState = ref.watch(albumViewerProvider);

    final descriptionTextEditController = useTextEditingController(
      text: albumViewerState.isEditAlbum &&
              albumViewerState.editDescriptionText.isNotEmpty
          ? albumViewerState.editDescriptionText
          : albumDescription,
    );

    void onFocusModeChange() {
      if (!descriptionFocusNode.hasFocus &&
          descriptionTextEditController.text.isEmpty) {
        ref.watch(albumViewerProvider.notifier).setEditDescriptionText("");
        descriptionTextEditController.text = "";
      }
    }

    useEffect(
      () {
        descriptionFocusNode.addListener(onFocusModeChange);
        return () {
          descriptionFocusNode.removeListener(onFocusModeChange);
        };
      },
      [],
    );

    return Material(
      color: Colors.transparent,
      child: TextField(
        onChanged: (value) {
          if (value.isEmpty) {
          } else {
            ref
                .watch(albumViewerProvider.notifier)
                .setEditDescriptionText(value);
          }
        },
        focusNode: descriptionFocusNode,
        style: context.textTheme.bodyLarge,
        controller: descriptionTextEditController,
        onTap: () {
          context.focusScope.requestFocus(descriptionFocusNode);

          ref
              .watch(albumViewerProvider.notifier)
              .setEditDescriptionText(albumDescription);
          ref.watch(albumViewerProvider.notifier).enableEditAlbum();

          if (descriptionTextEditController.text == '') {
            descriptionTextEditController.clear();
          }
        },
        decoration: InputDecoration(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          suffixIcon: descriptionFocusNode.hasFocus
              ? IconButton(
                  onPressed: () {
                    descriptionTextEditController.clear();
                  },
                  icon: Icon(
                    Icons.cancel_rounded,
                    color: context.primaryColor,
                  ),
                  splashRadius: 10,
                )
              : null,
          enabledBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusedBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusColor: Colors.grey[300],
          fillColor: context.scaffoldBackgroundColor,
          filled: descriptionFocusNode.hasFocus,
          hintText: 'add_a_description'.tr(),
        ),
      ),
    );
  }
}
