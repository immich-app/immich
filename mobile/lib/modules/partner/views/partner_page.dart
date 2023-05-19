import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/partner/providers/partner.provider.dart';
import 'package:immich_mobile/modules/partner/services/partner.service.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/ui/user_avatar.dart';

class PartnerPage extends HookConsumerWidget {
  const PartnerPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<User> partners = ref.watch(partnerSharedByProvider);
    final availableUsers = ref.watch(partnerAvailableProvider);

    addNewUsersHandler() async {
      final users = availableUsers.value;
      if (users == null || users.isEmpty) {
        ImmichToast.show(context: context, msg: "No more users to add");
        return;
      }
      ;
      final selectedUser = await showDialog<User>(
        context: context,
        builder: (context) {
          return SimpleDialog(
            title: const Text("Select partner"),
            children: [
              for (User u in users)
                SimpleDialogOption(
                  onPressed: () => Navigator.pop(context, u),
                  child: Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: userAvatar(context, u),
                      ),
                      Text("${u.firstName} ${u.lastName}"),
                    ],
                  ),
                )
            ],
          );
        },
      );
      if (selectedUser != null) {
        final ok =
            await ref.read(partnerServiceProvider).addPartner(selectedUser);
        if (ok) {
          ref.invalidate(partnerSharedByProvider);
        } else {
          ImmichToast.show(
            context: context,
            msg: "Failed to add partner",
            toastType: ToastType.error,
          );
        }
      }
    }

    buildUserList(List<User> users) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              "Shared to",
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          if (users.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              itemCount: users.length,
              itemBuilder: ((context, index) {
                return ListTile(
                  leading: userAvatar(context, users[index]),
                  title: Text(
                    users[index].email,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.cancel_outlined),
                    onPressed: () => showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return ConfirmDialog(
                            title: "Stop sharing your photos?",
                            content:
                                "${users[index].firstName} will no longer be able to access your photos.",
                            onOk: () async {
                              await ref
                                  .read(partnerServiceProvider)
                                  .removePartner(users[index]);
                              ref.invalidate(partnerSharedByProvider);
                            });
                      },
                    ),
                  ),
                );
              }),
            ),
          if (users.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Text(
                "Your photos are not yet shared with any partner. Tap 'Add' to grant a partner access to your photos.",
                style: const TextStyle(
                  fontSize: 14,
                ),
              ),
            ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Partners'),
        elevation: 0,
        centerTitle: false,
        actions: [
          TextButton(
            onPressed:
                availableUsers.whenOrNull(data: (data) => addNewUsersHandler),
            child: const Text(
              "share_add",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ).tr(),
          )
        ],
      ),
      body: buildUserList(partners),
    );
  }
}
