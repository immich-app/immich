import 'package:hooks_riverpod/hooks_riverpod.dart';

final backupServiceProvider = Provider(
  (ref) => BackupService(),
);

class BackupService {
  BackupService();
}
