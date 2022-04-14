import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/providers/suggested_shared_users.provider.dart';
import 'package:immich_mobile/shared/models/user_info.model.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class SelectUserForSharingPage extends HookConsumerWidget {
  const SelectUserForSharingPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedUsersList = useState<List<UserInfo>>([]);
    AsyncValue<List<UserInfo>> suggestedShareUsers = ref.watch(suggestedSharedUsersProvider);

    _buildUserList(List<UserInfo> users) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              shrinkWrap: true,
              itemBuilder: ((context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: Chip(label: Text(sharedUsersList.value[index].email)),
                );
              }),
              itemCount: sharedUsersList.value.length,
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Suggestions',
              style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            itemBuilder: ((context, index) {
              return ListTile(
                leading: CircleAvatar(
                  backgroundImage: const AssetImage('assets/immich-logo-no-outline.png'),
                  backgroundColor: Theme.of(context).primaryColor.withAlpha(50),
                ),
                title: Text(
                  users[index].email,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                onTap: () {
                  sharedUsersList.value = [...sharedUsersList.value, users[index]];
                },
              );
            }),
            itemCount: users.length,
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invite to album'),
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () async {
            AutoRouter.of(context).pop();
          },
        ),
      ),
      body: suggestedShareUsers.when(
        data: (users) {
          return _buildUserList(users);
        },
        error: (e, _) => Text("Error loading suggested users $e"),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
