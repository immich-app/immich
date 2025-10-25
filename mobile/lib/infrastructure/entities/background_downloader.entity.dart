import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class TaskRecordEntity extends Table with DriftDefaultsMixin {
  const TaskRecordEntity();

  TextColumn get taskId => text()();

  TextColumn get url => text()();

  TextColumn get filename => text()();

  TextColumn get group => text()();

  TextColumn get metaData => text()();

  IntColumn get creationTime => integer()();

  IntColumn get status => integer()();

  RealColumn get progress => real()();

  TextColumn get objectJsonMap => text()();

  @override
  Set<Column> get primaryKey => {taskId};
}

class PausedTasksEntity extends Table with DriftDefaultsMixin {
  const PausedTasksEntity();

  TextColumn get taskId => text()();

  IntColumn get modified => integer()();

  TextColumn get objectJsonMap => text()();

  @override
  Set<Column> get primaryKey => {taskId};
}

class ModifiedTasksEntity extends Table with DriftDefaultsMixin {
  const ModifiedTasksEntity();

  TextColumn get taskId => text()();

  IntColumn get modified => integer()();

  TextColumn get objectJsonMap => text()();

  @override
  Set<Column> get primaryKey => {taskId};
}

class ResumeTasksEntity extends Table with DriftDefaultsMixin {
  const ResumeTasksEntity();

  TextColumn get taskId => text()();

  IntColumn get modified => integer()();

  TextColumn get objectJsonMap => text()();

  @override
  Set<Column> get primaryKey => {taskId};
}
