import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';

class AlbumOptionsPage extends HookConsumerWidget {
  final Album album;

  const AlbumOptionsPage({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedUsers = album.sharedUsers.toList();
    final owner = album.owner.value;

    buildOwnerInfo() {
      return ListTile(
        leading: owner != null
            ? UserCircleAvatar(
                user: owner,
                useRandomBackgroundColor: true,
              )
            : const SizedBox(),
        title: Text(
          album.owner.value?.firstName ?? "",
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: const Text(
          "Owner",
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    buildSharedUsersList() {
      return ListView.builder(
        shrinkWrap: true,
        itemCount: sharedUsers.length,
        itemBuilder: (context, index) {
          final user = sharedUsers[index];
          return ListTile(
            leading: UserCircleAvatar(
              user: user,
              useRandomBackgroundColor: true,
            ),
            title: Text(
              user.firstName,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Text(
              user.email,
              style: TextStyle(color: Colors.grey[500]),
            ),
            onTap: () {},
          );
        },
      );
    }

    buildSectionTitle(String text) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(text, style: Theme.of(context).textTheme.bodySmall),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () {
            AutoRouter.of(context).popForced(null);
          },
        ),
        centerTitle: true,
        title: Text("translated_text_options".tr()),
      ),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          buildSectionTitle("PEOPLE"),
          buildOwnerInfo(),
          buildSharedUsersList(),
        ],
      ),
    );
  }
}
