import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/infrastructure/entities/background_downloader.entity.dart';
import 'package:logging/logging.dart';

import 'background_downloader.repository.drift.dart';

final driftPersistentStorage = DriftPersistentStorage(DriftBackgroundDownloader());

class _SqlPersistentStorageMigrator extends BasePersistentStorageMigrator {
  _SqlPersistentStorageMigrator();

  @override
  Future<bool> migrateFrom(String persistentStorageName, PersistentStorage toStorage) =>
      switch (persistentStorageName.toLowerCase().replaceAll('_', '')) {
        'localstore' => migrateFromLocalStore(toStorage),
        _ => Future.value(false),
      };
}

@DriftDatabase(tables: [TaskRecordEntity, PausedTasksEntity, ModifiedTasksEntity, ResumeTasksEntity])
class DriftBackgroundDownloader extends $DriftBackgroundDownloader implements IDatabaseRepository {
  DriftBackgroundDownloader([QueryExecutor? executor])
    : super(
        executor ??
            driftDatabase(
              name: 'immich_background_downloader',
              native: const DriftNativeOptions(shareAcrossIsolates: true),
            ),
      );

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (migrator) async {
      await migrator.createAll();
      await _SqlPersistentStorageMigrator().migrateFromLocalStore(driftPersistentStorage);
    },
    beforeOpen: (details) async {
      await customStatement('PRAGMA synchronous = NORMAL');
      await customStatement('PRAGMA journal_mode = WAL');
      await customStatement('PRAGMA busy_timeout = 500');
      await driftPersistentStorage.purgeOldRecords();
    },
  );
}

class DriftPersistentStorage implements PersistentStorage {
  final log = Logger('DriftPersistentStorage');

  late final DriftBackgroundDownloader db;

  DriftPersistentStorage(this.db);

  @override
  (String, int) get currentDatabaseVersion => ('Sqlite', 1);

  @override
  Future<void> initialize() async {}

  Future<void> purgeOldRecords({Duration age = const Duration(days: 30)}) async {
    final cutOff = (DateTime.now().subtract(age).millisecondsSinceEpoch / 1000).floor();
    for (final TableInfo table in [db.modifiedTasksEntity, db.pausedTasksEntity, db.resumeTasksEntity]) {
      await db.customStatement('DELETE FROM ${table.actualTableName} WHERE modified < ?', [cutOff]);
    }
  }

  Future<void> _remove(TableInfo table, String? taskId) async {
    if (taskId == null) {
      await db.delete(table).go();
    } else {
      await db.customStatement('DELETE FROM ${table.actualTableName} WHERE task_id = ?', [taskId]);
    }
  }

  @override
  Future<void> removePausedTask(String? taskId) => _remove(db.pausedTasksEntity, taskId);

  @override
  Future<void> removeResumeData(String? taskId) => _remove(db.resumeTasksEntity, taskId);

  @override
  Future<void> removeTaskRecord(String? taskId) => _remove(db.taskRecordEntity, taskId);

  @override
  Future<List<Task>> retrieveAllPausedTasks() async {
    final query = db.selectOnly(db.pausedTasksEntity)..addColumns([db.pausedTasksEntity.objectJsonMap]);
    final result = await query.map((row) => row.read(db.pausedTasksEntity.objectJsonMap)).get();
    return result.nonNulls.map((e) => Task.createFromJson(jsonDecode(e))).toList(growable: false);
  }

  @override
  Future<List<ResumeData>> retrieveAllResumeData() async {
    final query = db.selectOnly(db.resumeTasksEntity)..addColumns([db.resumeTasksEntity.objectJsonMap]);
    final result = await query.map((row) => row.read(db.resumeTasksEntity.objectJsonMap)).get();
    return result.nonNulls.map((e) => ResumeData.fromJson(jsonDecode(e))).toList(growable: false);
  }

  @override
  Future<List<TaskRecord>> retrieveAllTaskRecords() async {
    final query = db.selectOnly(db.taskRecordEntity)..addColumns([db.taskRecordEntity.objectJsonMap]);
    final result = await query.map((row) => row.read(db.taskRecordEntity.objectJsonMap)).get();
    return result.nonNulls.map((e) => TaskRecord.fromJson(jsonDecode(e))).toList(growable: false);
  }

  @override
  Future<Task?> retrievePausedTask(String taskId) async {
    final query = db.selectOnly(db.pausedTasksEntity)
      ..addColumns([db.pausedTasksEntity.objectJsonMap])
      ..where(db.pausedTasksEntity.taskId.equals(taskId));
    final result = await query.map((row) => row.read(db.pausedTasksEntity.objectJsonMap)).getSingleOrNull();
    if (result == null) {
      return null;
    }
    return Task.createFromJson(jsonDecode(result));
  }

  @override
  Future<ResumeData?> retrieveResumeData(String taskId) async {
    final query = db.selectOnly(db.resumeTasksEntity)
      ..addColumns([db.resumeTasksEntity.objectJsonMap])
      ..where(db.resumeTasksEntity.taskId.equals(taskId));
    final result = await query.map((row) => row.read(db.resumeTasksEntity.objectJsonMap)).getSingleOrNull();
    if (result == null) {
      return null;
    }
    return ResumeData.fromJson(jsonDecode(result));
  }

  @override
  Future<TaskRecord?> retrieveTaskRecord(String taskId) async {
    final query = db.selectOnly(db.taskRecordEntity)
      ..addColumns([db.taskRecordEntity.objectJsonMap])
      ..where(db.taskRecordEntity.taskId.equals(taskId));
    final result = await query.map((row) => row.read(db.taskRecordEntity.objectJsonMap)).getSingleOrNull();
    if (result == null) {
      return null;
    }
    return TaskRecord.fromJson(jsonDecode(result));
  }

  @override
  Future<void> storePausedTask(Task task) async {
    await db.managers.pausedTasksEntity.create(
      (o) => o(
        modified: (DateTime.now().millisecondsSinceEpoch / 1000).floor(),
        objectJsonMap: jsonEncode(task.toJson()),
        taskId: task.taskId,
      ),
      mode: InsertMode.insertOrReplace,
    );
  }

  @override
  Future<void> storeResumeData(ResumeData resumeData) async {
    await db.managers.resumeTasksEntity.create(
      (o) => o(
        modified: (DateTime.now().millisecondsSinceEpoch / 1000).floor(),
        objectJsonMap: jsonEncode(resumeData.toJson()),
        taskId: resumeData.taskId,
      ),
      mode: InsertMode.insertOrReplace,
    );
  }

  @override
  Future<void> storeTaskRecord(TaskRecord record) async {
    final task = record.task;
    await db.managers.taskRecordEntity.create(
      (o) => o(
        taskId: task.taskId,
        url: task.url,
        filename: task.filename,
        group: task.group,
        metaData: task.metaData,
        creationTime: (task.creationTime.millisecondsSinceEpoch / 1000).floor(),
        status: record.status.index,
        progress: record.progress,
        objectJsonMap: jsonEncode(record.toJson()),
      ),
      mode: InsertMode.insertOrReplace,
    );
  }

  @override
  Future<(String, int)> get storedDatabaseVersion async {
    return ('Sqlite', db.schemaVersion);
  }
}
