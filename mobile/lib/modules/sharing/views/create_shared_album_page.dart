import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class CreateSharedAlbumPage extends HookConsumerWidget {
  const CreateSharedAlbumPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumTitleController = useTextEditingController.fromValue(TextEditingValue.empty);
    final albumTitleTextFieldFocusNode = useFocusNode();
    final isAlbumTitleTextFieldFocus = useState(false);
    final isAlbumTitleEmpty = useState(true);

    return Scaffold(
        appBar: AppBar(
          elevation: 0,
          centerTitle: false,
          leading: IconButton(
              onPressed: () {
                AutoRouter.of(context).pop();
              },
              icon: const Icon(Icons.close_rounded)),
          title: const Text('Create album'),
          actions: [
            TextButton(
              onPressed: () {},
              child: const Text(
                'Share',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        body: GestureDetector(
          onTap: () {
            albumTitleTextFieldFocusNode.unfocus();
            isAlbumTitleTextFieldFocus.value = false;

            if (albumTitleController.text.isEmpty) {
              albumTitleController.text = 'Untitled';
            }
          },
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.only(
                  top: 50.0,
                  right: 10,
                  left: 10,
                ),
                child: TextField(
                  onChanged: (v) {
                    if (v.isEmpty) {
                      isAlbumTitleEmpty.value = true;
                    } else {
                      isAlbumTitleEmpty.value = false;
                    }
                  },
                  focusNode: albumTitleTextFieldFocusNode,
                  style: TextStyle(fontSize: 28, color: Colors.grey[700], fontWeight: FontWeight.bold),
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
                    hintText: 'Add a title',
                    focusColor: Colors.grey[300],
                    fillColor: Colors.grey[200],
                    filled: isAlbumTitleTextFieldFocus.value,
                  ),
                ),
              ),
            ],
          ),
        ));
  }
}
