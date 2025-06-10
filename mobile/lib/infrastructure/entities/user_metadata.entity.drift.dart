// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/user_metadata.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$UserMetadataEntityTableCreateCompanionBuilder
    = i1.UserMetadataEntityCompanion Function({
  required String userId,
  required i2.UserPreferences preferences,
});
typedef $$UserMetadataEntityTableUpdateCompanionBuilder
    = i1.UserMetadataEntityCompanion Function({
  i0.Value<String> userId,
  i0.Value<i2.UserPreferences> preferences,
});

final class $$UserMetadataEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$UserMetadataEntityTable,
    i1.UserMetadataEntityData> {
  $$UserMetadataEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i4.$UserEntityTable _userIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$UserMetadataEntityTable>(
                      'user_metadata_entity')
                  .userId,
              i5.ReadDatabaseContainer(db)
                  .resultSet<i4.$UserEntityTable>('user_entity')
                  .id));

  i4.$$UserEntityTableProcessedTableManager get userId {
    final $_column = $_itemColumn<String>('user_id')!;

    final manager = i4
        .$$UserEntityTableTableManager(
            $_db,
            i5.ReadDatabaseContainer($_db)
                .resultSet<i4.$UserEntityTable>('user_entity'))
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
  i0.ColumnWithTypeConverterFilters<i2.UserPreferences, i2.UserPreferences,
          String>
      get preferences => $composableBuilder(
          column: $table.preferences,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i4.$$UserEntityTableFilterComposer get userId {
    final i4.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.userId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i4.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i4.$$UserEntityTableFilterComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i4.$UserEntityTable>('user_entity'),
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
  i0.ColumnOrderings<String> get preferences => $composableBuilder(
      column: $table.preferences,
      builder: (column) => i0.ColumnOrderings(column));

  i4.$$UserEntityTableOrderingComposer get userId {
    final i4.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.userId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i4.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i4.$$UserEntityTableOrderingComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i4.$UserEntityTable>('user_entity'),
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
  i0.GeneratedColumnWithTypeConverter<i2.UserPreferences, String>
      get preferences => $composableBuilder(
          column: $table.preferences, builder: (column) => column);

  i4.$$UserEntityTableAnnotationComposer get userId {
    final i4.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.userId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i4.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i4.$$UserEntityTableAnnotationComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i4.$UserEntityTable>('user_entity'),
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
            i0.Value<i2.UserPreferences> preferences = const i0.Value.absent(),
          }) =>
              i1.UserMetadataEntityCompanion(
            userId: userId,
            preferences: preferences,
          ),
          createCompanionCallback: ({
            required String userId,
            required i2.UserPreferences preferences,
          }) =>
              i1.UserMetadataEntityCompanion.insert(
            userId: userId,
            preferences: preferences,
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

class $UserMetadataEntityTable extends i3.UserMetadataEntity
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
  late final i0.GeneratedColumnWithTypeConverter<i2.UserPreferences, String>
      preferences = i0.GeneratedColumn<String>(
              'preferences', aliasedName, false,
              type: i0.DriftSqlType.string, requiredDuringInsert: true)
          .withConverter<i2.UserPreferences>(
              i1.$UserMetadataEntityTable.$converterpreferences);
  @override
  List<i0.GeneratedColumn> get $columns => [userId, preferences];
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
  Set<i0.GeneratedColumn> get $primaryKey => {userId};
  @override
  i1.UserMetadataEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UserMetadataEntityData(
      userId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      preferences: i1.$UserMetadataEntityTable.$converterpreferences.fromSql(
          attachedDatabase.typeMapping.read(
              i0.DriftSqlType.string, data['${effectivePrefix}preferences'])!),
    );
  }

  @override
  $UserMetadataEntityTable createAlias(String alias) {
    return $UserMetadataEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.UserPreferences, String, Object?>
      $converterpreferences = i3.userPreferenceConverter;
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class UserMetadataEntityData extends i0.DataClass
    implements i0.Insertable<i1.UserMetadataEntityData> {
  final String userId;
  final i2.UserPreferences preferences;
  const UserMetadataEntityData(
      {required this.userId, required this.preferences});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['user_id'] = i0.Variable<String>(userId);
    {
      map['preferences'] = i0.Variable<String>(
          i1.$UserMetadataEntityTable.$converterpreferences.toSql(preferences));
    }
    return map;
  }

  factory UserMetadataEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UserMetadataEntityData(
      userId: serializer.fromJson<String>(json['userId']),
      preferences: i1.$UserMetadataEntityTable.$converterpreferences
          .fromJson(serializer.fromJson<Object?>(json['preferences'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'userId': serializer.toJson<String>(userId),
      'preferences': serializer.toJson<Object?>(i1
          .$UserMetadataEntityTable.$converterpreferences
          .toJson(preferences)),
    };
  }

  i1.UserMetadataEntityData copyWith(
          {String? userId, i2.UserPreferences? preferences}) =>
      i1.UserMetadataEntityData(
        userId: userId ?? this.userId,
        preferences: preferences ?? this.preferences,
      );
  UserMetadataEntityData copyWithCompanion(
      i1.UserMetadataEntityCompanion data) {
    return UserMetadataEntityData(
      userId: data.userId.present ? data.userId.value : this.userId,
      preferences:
          data.preferences.present ? data.preferences.value : this.preferences,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserMetadataEntityData(')
          ..write('userId: $userId, ')
          ..write('preferences: $preferences')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(userId, preferences);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UserMetadataEntityData &&
          other.userId == this.userId &&
          other.preferences == this.preferences);
}

class UserMetadataEntityCompanion
    extends i0.UpdateCompanion<i1.UserMetadataEntityData> {
  final i0.Value<String> userId;
  final i0.Value<i2.UserPreferences> preferences;
  const UserMetadataEntityCompanion({
    this.userId = const i0.Value.absent(),
    this.preferences = const i0.Value.absent(),
  });
  UserMetadataEntityCompanion.insert({
    required String userId,
    required i2.UserPreferences preferences,
  })  : userId = i0.Value(userId),
        preferences = i0.Value(preferences);
  static i0.Insertable<i1.UserMetadataEntityData> custom({
    i0.Expression<String>? userId,
    i0.Expression<String>? preferences,
  }) {
    return i0.RawValuesInsertable({
      if (userId != null) 'user_id': userId,
      if (preferences != null) 'preferences': preferences,
    });
  }

  i1.UserMetadataEntityCompanion copyWith(
      {i0.Value<String>? userId, i0.Value<i2.UserPreferences>? preferences}) {
    return i1.UserMetadataEntityCompanion(
      userId: userId ?? this.userId,
      preferences: preferences ?? this.preferences,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (userId.present) {
      map['user_id'] = i0.Variable<String>(userId.value);
    }
    if (preferences.present) {
      map['preferences'] = i0.Variable<String>(i1
          .$UserMetadataEntityTable.$converterpreferences
          .toSql(preferences.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserMetadataEntityCompanion(')
          ..write('userId: $userId, ')
          ..write('preferences: $preferences')
          ..write(')'))
        .toString();
  }
}
