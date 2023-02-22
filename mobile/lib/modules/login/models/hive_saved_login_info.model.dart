import 'package:hive/hive.dart';

part 'hive_saved_login_info.model.g.dart';

@HiveType(typeId: 0)
class HiveSavedLoginInfo {
  @HiveField(0)
  String email; // DEPRECATED

  @HiveField(1)
  String password; // DEPRECATED

  @HiveField(2)
  String serverUrl;

  @HiveField(4, defaultValue: "")
  String accessToken;

  HiveSavedLoginInfo({
    required this.email,
    required this.password,
    required this.serverUrl,
    required this.accessToken,
  });
}
