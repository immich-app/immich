import 'package:hive/hive.dart';

part 'hive_saved_backup_info.model.g.dart';

@HiveType(typeId: 1)
class HiveSavedBackupInfo {
  @HiveField(0)
  String assetEntityId;

  HiveSavedBackupInfo({required this.assetEntityId});
}