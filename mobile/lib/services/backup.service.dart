import 'package:hooks_riverpod/hooks_riverpod.dart';

final backupServiceProvider = Provider(
  (ref) => BackupService(),
);

/// Service to handle backup and restore of data
/// - [ ] Find the assets that needed to be backed up
/// - [ ] Contruct asset's album information
/// - [ ] Check hash before upload
/// - [ ] Upload to server
class BackupService {
  BackupService();
}
