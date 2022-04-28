import 'package:hive/hive.dart';

part 'hive_saved_login_info.model.g.dart';

@HiveType(typeId: 0)
class HiveSavedLoginInfo {
  @HiveField(0)
  String email;

  @HiveField(1)
  String password;

  @HiveField(2)
  String serverUrl;

  @HiveField(3)
  bool isSaveLogin;

  HiveSavedLoginInfo({required this.email, required this.password, required this.serverUrl, required this.isSaveLogin});
}
