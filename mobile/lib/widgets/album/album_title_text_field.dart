import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album_title.provider.dart';

class AlbumTitleTextField extends ConsumerWidget {
  const AlbumTitleTextField({
    super.key,
    required this.isAlbumTitleEmpty,
    required this.albumTitleTextFieldFocusNode,
    required this.albumTitleController,
    required this.isAlbumTitleTextFieldFocus,
  });

  final ValueNotifier<bool> isAlbumTitleEmpty;
  final FocusNode albumTitleTextFieldFocusNode;
  final TextEditingController albumTitleController;
  final ValueNotifier<bool> isAlbumTitleTextFieldFocus;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return TextField(
      onChanged: (v) {
        if (v.isEmpty) {
          isAlbumTitleEmpty.value = true;
        } else {
          isAlbumTitleEmpty.value = false;
        }

        ref.watch(albumTitleProvider.notifier).setAlbumTitle(v);
      },
      focusNode: albumTitleTextFieldFocusNode,
      style: TextStyle(
        fontSize: 28,
        color: context.colorScheme.onSurface,
        fontWeight: FontWeight.bold,
      ),
      controller: albumTitleController,
      onTap: () {
        isAlbumTitleTextFieldFocus.value = true;

        if (albumTitleController.text == 'Untitled') {
          albumTitleController.clear();
        }
      },
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        suffixIcon: !isAlbumTitleEmpty.value && isAlbumTitleTextFieldFocus.value
            ? IconButton(
                onPressed: () {
                  albumTitleController.clear();
                  isAlbumTitleEmpty.value = true;
                },
                icon: Icon(
                  Icons.cancel_rounded,
                  color: context.primaryColor,
                ),
                splashRadius: 10,
              )
            : null,
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.circular(10),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.circular(10),
        ),
        hintText: 'add_a_title'.tr(),
        hintStyle: context.themeData.inputDecorationTheme.hintStyle?.copyWith(
          fontSize: 28,
          fontWeight: FontWeight.bold,
        ),
        focusColor: Colors.grey[300],
        fillColor: context.colorScheme.surfaceContainerHigh,
        filled: isAlbumTitleTextFieldFocus.value,
      ),
    );
  }
}
