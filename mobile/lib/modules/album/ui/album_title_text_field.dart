import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album_title.provider.dart';

class AlbumTitleTextField extends ConsumerWidget {
  const AlbumTitleTextField({
    Key? key,
    required this.isAlbumTitleEmpty,
    required this.albumTitleTextFieldFocusNode,
    required this.albumTitleController,
    required this.isAlbumTitleTextFieldFocus,
  }) : super(key: key);

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
        color: Colors.grey[700],
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
                icon: const Icon(Icons.cancel_rounded),
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
        focusColor: Colors.grey[300],
        fillColor: Colors.grey[200],
        filled: isAlbumTitleTextFieldFocus.value,
      ),
    );
  }
}
