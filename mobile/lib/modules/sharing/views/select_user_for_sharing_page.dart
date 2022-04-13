import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/user_info.model.dart';
import 'package:immich_mobile/shared/services/user.service.dart';

class SelectUserForSharingPage extends HookConsumerWidget {
  const SelectUserForSharingPage({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ValueNotifier<List<UserInfo>> userList = useState([]);

    _getAllUsers() async {
      UserService userService = UserService();
      userList.value = await userService.getAllUsersInfo();
    }

    useEffect(() {
      _getAllUsers();
      return null;
    }, []);

    return Scaffold(
        appBar: AppBar(
          title: const Text('Invite to album'),
        ),
        body: ListView.builder(
          itemBuilder: (context, index) {
            return ListTile(
              title: Text(userList.value[index].email),
            );
          },
          itemCount: userList.value.length,
        ));
  }
}
