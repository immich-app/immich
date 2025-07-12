// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/user_metadata.model.dart' as i2;
import 'dart:typed_data' as i3;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i5;
import 'package:drift/internal/modular.dart' as i6;

typedef $$UserMetadataEntityTableCreateCompanionBuilder
    = i1.UserMetadataEntityCompanion Function({
  required String userId,
  required i2.UserMetadataKey key,
  required Map<String, Object?> value,
});
typedef $$UserMetadataEntityTableUpdateCompanionBuilder
    = i1.UserMetadataEntityCompanion Function({
  i0.Value<String> userId,
  i0.Value<i2.UserMetadataKey> key,
  i0.Value<Map<String, Object?>> value,
});

final class $$UserMetadataEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$UserMetadataEntityTable,
    i1.UserMetadataEntityData> {
  $$UserMetadataEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i5.$UserEntityTable _userIdTable(i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i5.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$UserMetadataEntityTable>(
                      'user_metadata_entity')
                  .userId,
              i6.ReadDatabaseContainer(db)
                  .resultSet<i5.$UserEntityTable>('user_entity')
                  .id));

  i5.$$UserEntityTableProcessedTableManager get userId {
    final $_column = $_itemColumn<String>('user_id')!;

    final manager = i5
        .$$UserEntityTableTableManager(
            $_db,
            i6.ReadDatabaseContainer($_db)
                .resultSet<i5.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_userIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$UserMetadataEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UserMetadataEntityTable> {
  $$UserMetadataEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnWithTypeConverterFilters<i2.UserMetadataKey, i2.UserMetadataKey, int>
      get key => $composableBuilder(
          column: $table.key,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i0.ColumnWithTypeConverterFilters<Map<String, Object?>, Map<String, Object>,
          i3.Uint8List>
      get value => $composableBuilder(
          column: $table.value,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i5.$$UserEntityTableFilterComposer get userId {
    final i5.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.userId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$UserEntityTableFilterComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$UserMetadataEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UserMetadataEntityTable> {
  $$UserMetadataEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get key => $composableBuilder(
      column: $table.key, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<i3.Uint8List> get value => $composableBuilder(
      column: $table.value, builder: (column) => i0.ColumnOrderings(column));

  i5.$$UserEntityTableOrderingComposer get userId {
    final i5.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.userId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$UserEntityTableOrderingComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$UserMetadataEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UserMetadataEntityTable> {
  $$UserMetadataEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumnWithTypeConverter<i2.UserMetadataKey, int> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<Map<String, Object?>, i3.Uint8List>
      get value =>
          $composableBuilder(column: $table.value, builder: (column) => column);

  i5.$$UserEntityTableAnnotationComposer get userId {
    final i5.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.userId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$UserEntityTableAnnotationComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$UserMetadataEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$UserMetadataEntityTable,
    i1.UserMetadataEntityData,
    i1.$$UserMetadataEntityTableFilterComposer,
    i1.$$UserMetadataEntityTableOrderingComposer,
    i1.$$UserMetadataEntityTableAnnotationComposer,
    $$UserMetadataEntityTableCreateCompanionBuilder,
    $$UserMetadataEntityTableUpdateCompanionBuilder,
    (i1.UserMetadataEntityData, i1.$$UserMetadataEntityTableReferences),
    i1.UserMetadataEntityData,
    i0.PrefetchHooks Function({bool userId})> {
  $$UserMetadataEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$UserMetadataEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () => i1
              .$$UserMetadataEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$UserMetadataEntityTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$UserMetadataEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> userId = const i0.Value.absent(),
            i0.Value<i2.UserMetadataKey> key = const i0.Value.absent(),
            i0.Value<Map<String, Object?>> value = const i0.Value.absent(),
          }) =>
              i1.UserMetadataEntityCompanion(
            userId: userId,
            key: key,
            value: value,
          ),
          createCompanionCallback: ({
            required String userId,
            required i2.UserMetadataKey key,
            required Map<String, Object?> value,
          }) =>
              i1.UserMetadataEntityCompanion.insert(
            userId: userId,
            key: key,
            value: value,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$UserMetadataEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({userId = false}) {
            return i0.PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends i0.TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (userId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.userId,
                    referencedTable:
                        i1.$$UserMetadataEntityTableReferences._userIdTable(db),
                    referencedColumn: i1.$$UserMetadataEntityTableReferences
                        ._userIdTable(db)
                        .id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$UserMetadataEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$UserMetadataEntityTable,
        i1.UserMetadataEntityData,
        i1.$$UserMetadataEntityTableFilterComposer,
        i1.$$UserMetadataEntityTableOrderingComposer,
        i1.$$UserMetadataEntityTableAnnotationComposer,
        $$UserMetadataEntityTableCreateCompanionBuilder,
        $$UserMetadataEntityTableUpdateCompanionBuilder,
        (i1.UserMetadataEntityData, i1.$$UserMetadataEntityTableReferences),
        i1.UserMetadataEntityData,
        i0.PrefetchHooks Function({bool userId})>;

class $UserMetadataEntityTable extends i4.UserMetadataEntity
    with i0.TableInfo<$UserMetadataEntityTable, i1.UserMetadataEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UserMetadataEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _userIdMeta =
      const i0.VerificationMeta('userId');
  @override
  late final i0.GeneratedColumn<String> userId = i0.GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES user_entity (id) ON DELETE CASCADE'));
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.UserMetadataKey, int> key =
      i0.GeneratedColumn<int>('key', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.UserMetadataKey>(
              i1.$UserMetadataEntityTable.$converterkey);
  @override
  late final i0
      .GeneratedColumnWithTypeConverter<Map<String, Object?>, i3.Uint8List>
      value = i0.GeneratedColumn<i3.Uint8List>('value', aliasedName, false,
              type: i0.DriftSqlType.blob, requiredDuringInsert: true)
          .withConverter<Map<String, Object?>>(
              i1.$UserMetadataEntityTable.$convertervalue);
  @override
  List<i0.GeneratedColumn> get $columns => [userId, key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_metadata_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.UserMetadataEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {userId, key};
  @override
  i1.UserMetadataEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UserMetadataEntityData(
      userId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      key: i1.$UserMetadataEntityTable.$converterkey.fromSql(attachedDatabase
          .typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}key'])!),
      value: i1.$UserMetadataEntityTable.$convertervalue.fromSql(
          attachedDatabase.typeMapping
              .read(i0.DriftSqlType.blob, data['${effectivePrefix}value'])!),
    );
  }

  @override
  $UserMetadataEntityTable createAlias(String alias) {
    return $UserMetadataEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.UserMetadataKey, int, int> $converterkey =
      const i0.EnumIndexConverter<i2.UserMetadataKey>(
          i2.UserMetadataKey.values);
  static i0.JsonTypeConverter2<Map<String, Object?>, i3.Uint8List, Object?>
      $convertervalue = i4.userMetadataConverter;
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class UserMetadataEntityData extends i0.DataClass
    implements i0.Insertable<i1.UserMetadataEntityData> {
  final String userId;
  final i2.UserMetadataKey key;
  final Map<String, Object?> value;
  const UserMetadataEntityData(
      {required this.userId, required this.key, required this.value});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['user_id'] = i0.Variable<String>(userId);
    {
      map['key'] = i0.Variable<int>(
          i1.$UserMetadataEntityTable.$converterkey.toSql(key));
    }
    {
      map['value'] = i0.Variable<i3.Uint8List>(
          i1.$UserMetadataEntityTable.$convertervalue.toSql(value));
    }
    return map;
  }

  factory UserMetadataEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UserMetadataEntityData(
      userId: serializer.fromJson<String>(json['userId']),
      key: i1.$UserMetadataEntityTable.$converterkey
          .fromJson(serializer.fromJson<int>(json['key'])),
      value: i1.$UserMetadataEntityTable.$convertervalue
          .fromJson(serializer.fromJson<Object?>(json['value'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'userId': serializer.toJson<String>(userId),
      'key': serializer
          .toJson<int>(i1.$UserMetadataEntityTable.$converterkey.toJson(key)),
      'value': serializer.toJson<Object?>(
          i1.$UserMetadataEntityTable.$convertervalue.toJson(value)),
    };
  }

  i1.UserMetadataEntityData copyWith(
          {String? userId,
          i2.UserMetadataKey? key,
          Map<String, Object?>? value}) =>
      i1.UserMetadataEntityData(
        userId: userId ?? this.userId,
        key: key ?? this.key,
        value: value ?? this.value,
      );
  UserMetadataEntityData copyWithCompanion(
      i1.UserMetadataEntityCompanion data) {
    return UserMetadataEntityData(
      userId: data.userId.present ? data.userId.value : this.userId,
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserMetadataEntityData(')
          ..write('userId: $userId, ')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(userId, key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UserMetadataEntityData &&
          other.userId == this.userId &&
          other.key == this.key &&
          other.value == this.value);
}

class UserMetadataEntityCompanion
    extends i0.UpdateCompanion<i1.UserMetadataEntityData> {
  final i0.Value<String> userId;
  final i0.Value<i2.UserMetadataKey> key;
  final i0.Value<Map<String, Object?>> value;
  const UserMetadataEntityCompanion({
    this.userId = const i0.Value.absent(),
    this.key = const i0.Value.absent(),
    this.value = const i0.Value.absent(),
  });
  UserMetadataEntityCompanion.insert({
    required String userId,
    required i2.UserMetadataKey key,
    required Map<String, Object?> value,
  })  : userId = i0.Value(userId),
        key = i0.Value(key),
        value = i0.Value(value);
  static i0.Insertable<i1.UserMetadataEntityData> custom({
    i0.Expression<String>? userId,
    i0.Expression<int>? key,
    i0.Expression<i3.Uint8List>? value,
  }) {
    return i0.RawValuesInsertable({
      if (userId != null) 'user_id': userId,
      if (key != null) 'key': key,
      if (value != null) 'value': value,
    });
  }

  i1.UserMetadataEntityCompanion copyWith(
      {i0.Value<String>? userId,
      i0.Value<i2.UserMetadataKey>? key,
      i0.Value<Map<String, Object?>>? value}) {
    return i1.UserMetadataEntityCompanion(
      userId: userId ?? this.userId,
      key: key ?? this.key,
      value: value ?? this.value,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (userId.present) {
      map['user_id'] = i0.Variable<String>(userId.value);
    }
    if (key.present) {
      map['key'] = i0.Variable<int>(
          i1.$UserMetadataEntityTable.$converterkey.toSql(key.value));
    }
    if (value.present) {
      map['value'] = i0.Variable<i3.Uint8List>(
          i1.$UserMetadataEntityTable.$convertervalue.toSql(value.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserMetadataEntityCompanion(')
          ..write('userId: $userId, ')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }
}
