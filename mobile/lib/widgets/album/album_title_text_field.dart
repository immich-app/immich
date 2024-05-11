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
    final isDarkTheme = context.isDarkTheme;

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
        color: isDarkTheme ? Colors.grey[300] : Colors.grey[700],
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
        hintText: 'share_add_title'.tr(),
        hintStyle: TextStyle(
          fontSize: 28,
          color: isDarkTheme ? Colors.grey[300] : Colors.grey[700],
          fontWeight: FontWeight.bold,
        ),
        focusColor: Colors.grey[300],
        fillColor: isDarkTheme
            ? const Color.fromARGB(255, 32, 33, 35)
            : Colors.grey[200],
        filled: isAlbumTitleTextFieldFocus.value,
      ),
    );
  }
}
