import 'package:drift/drift.dart' hide Index;

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_upload_tasks_local_id ON upload_task_entity(local_id);')
@TableIndex.sql('CREATE INDEX idx_upload_tasks_asset_data ON upload_task_entity(status, priority DESC, created_at);')
class UploadTaskEntity extends Table {
  const UploadTaskEntity();

  IntColumn get id => integer().autoIncrement()();
  IntColumn get attempts => integer()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get filePath => text()();
  BoolColumn get isLivePhoto => boolean().nullable()();
  IntColumn get lastError => integer().nullable()();
  TextColumn get livePhotoVideoId => text().nullable()();
  TextColumn get localId => text()();
  IntColumn get method => integer()();
  RealColumn get priority => real()();
  DateTimeColumn get retryAfter => dateTime().nullable()();
  IntColumn get status => integer()();

  @override
  bool get isStrict => true;
}
