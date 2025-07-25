// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/user_metadata.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as i3;

typedef $$UserEntityTableCreateCompanionBuilder = i1.UserEntityCompanion
    Function({
  required String id,
  required String name,
  required String email,
  i0.Value<DateTime?> deletedAt,
  i0.Value<i2.AvatarColor?> avatarColor,
});
typedef $$UserEntityTableUpdateCompanionBuilder = i1.UserEntityCompanion
    Function({
  i0.Value<String> id,
  i0.Value<String> name,
  i0.Value<String> email,
  i0.Value<DateTime?> deletedAt,
  i0.Value<i2.AvatarColor?> avatarColor,
});

class $$UserEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UserEntityTable> {
  $$UserEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.AvatarColor?, i2.AvatarColor, int>
      get avatarColor => $composableBuilder(
          column: $table.avatarColor,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));
}

class $$UserEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UserEntityTable> {
  $$UserEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get avatarColor => $composableBuilder(
      column: $table.avatarColor,
      builder: (column) => i0.ColumnOrderings(column));
}

class $$UserEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UserEntityTable> {
  $$UserEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get deletedAt =>
      $composableBuilder(column: $table.deletedAt, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AvatarColor?, int> get avatarColor =>
      $composableBuilder(
          column: $table.avatarColor, builder: (column) => column);
}

class $$UserEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$UserEntityTable,
    i1.UserEntityData,
    i1.$$UserEntityTableFilterComposer,
    i1.$$UserEntityTableOrderingComposer,
    i1.$$UserEntityTableAnnotationComposer,
    $$UserEntityTableCreateCompanionBuilder,
    $$UserEntityTableUpdateCompanionBuilder,
    (
      i1.UserEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$UserEntityTable,
          i1.UserEntityData>
    ),
    i1.UserEntityData,
    i0.PrefetchHooks Function()> {
  $$UserEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$UserEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$UserEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$UserEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$UserEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<String> email = const i0.Value.absent(),
            i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
            i0.Value<i2.AvatarColor?> avatarColor = const i0.Value.absent(),
          }) =>
              i1.UserEntityCompanion(
            id: id,
            name: name,
            email: email,
            deletedAt: deletedAt,
            avatarColor: avatarColor,
          ),
          createCompanionCallback: ({
            required String id,
            required String name,
            required String email,
            i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
            i0.Value<i2.AvatarColor?> avatarColor = const i0.Value.absent(),
          }) =>
              i1.UserEntityCompanion.insert(
            id: id,
            name: name,
            email: email,
            deletedAt: deletedAt,
            avatarColor: avatarColor,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$UserEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$UserEntityTable,
    i1.UserEntityData,
    i1.$$UserEntityTableFilterComposer,
    i1.$$UserEntityTableOrderingComposer,
    i1.$$UserEntityTableAnnotationComposer,
    $$UserEntityTableCreateCompanionBuilder,
    $$UserEntityTableUpdateCompanionBuilder,
    (
      i1.UserEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$UserEntityTable,
          i1.UserEntityData>
    ),
    i1.UserEntityData,
    i0.PrefetchHooks Function()>;

class $UserEntityTable extends i3.UserEntity
    with i0.TableInfo<$UserEntityTable, i1.UserEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UserEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _nameMeta =
      const i0.VerificationMeta('name');
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
      'name', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _emailMeta =
      const i0.VerificationMeta('email');
  @override
  late final i0.GeneratedColumn<String> email = i0.GeneratedColumn<String>(
      'email', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _deletedAtMeta =
      const i0.VerificationMeta('deletedAt');
  @override
  late final i0.GeneratedColumn<DateTime> deletedAt =
      i0.GeneratedColumn<DateTime>('deleted_at', aliasedName, true,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AvatarColor?, int>
      avatarColor = i0.GeneratedColumn<int>('avatar_color', aliasedName, true,
              type: i0.DriftSqlType.int, requiredDuringInsert: false)
          .withConverter<i2.AvatarColor?>(
              i1.$UserEntityTable.$converteravatarColorn);
  @override
  List<i0.GeneratedColumn> get $columns =>
      [id, name, email, deletedAt, avatarColor];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.UserEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.UserEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UserEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      email: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}email'])!,
      deletedAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
      avatarColor: i1.$UserEntityTable.$converteravatarColorn.fromSql(
          attachedDatabase.typeMapping.read(
              i0.DriftSqlType.int, data['${effectivePrefix}avatar_color'])),
    );
  }

  @override
  $UserEntityTable createAlias(String alias) {
    return $UserEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AvatarColor, int, int> $converteravatarColor =
      const i0.EnumIndexConverter<i2.AvatarColor>(i2.AvatarColor.values);
  static i0.JsonTypeConverter2<i2.AvatarColor?, int?, int?>
      $converteravatarColorn =
      i0.JsonTypeConverter2.asNullable($converteravatarColor);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class UserEntityData extends i0.DataClass
    implements i0.Insertable<i1.UserEntityData> {
  final String id;
  final String name;
  final String email;
  final DateTime? deletedAt;
  final i2.AvatarColor? avatarColor;
  const UserEntityData(
      {required this.id,
      required this.name,
      required this.email,
      this.deletedAt,
      this.avatarColor});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['name'] = i0.Variable<String>(name);
    map['email'] = i0.Variable<String>(email);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt);
    }
    if (!nullToAbsent || avatarColor != null) {
      map['avatar_color'] = i0.Variable<int>(
          i1.$UserEntityTable.$converteravatarColorn.toSql(avatarColor));
    }
    return map;
  }

  factory UserEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UserEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      email: serializer.fromJson<String>(json['email']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
      avatarColor: i1.$UserEntityTable.$converteravatarColorn
          .fromJson(serializer.fromJson<int?>(json['avatarColor'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'email': serializer.toJson<String>(email),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
      'avatarColor': serializer.toJson<int?>(
          i1.$UserEntityTable.$converteravatarColorn.toJson(avatarColor)),
    };
  }

  i1.UserEntityData copyWith(
          {String? id,
          String? name,
          String? email,
          i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
          i0.Value<i2.AvatarColor?> avatarColor = const i0.Value.absent()}) =>
      i1.UserEntityData(
        id: id ?? this.id,
        name: name ?? this.name,
        email: email ?? this.email,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
        avatarColor: avatarColor.present ? avatarColor.value : this.avatarColor,
      );
  UserEntityData copyWithCompanion(i1.UserEntityCompanion data) {
    return UserEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      email: data.email.present ? data.email.value : this.email,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
      avatarColor:
          data.avatarColor.present ? data.avatarColor.value : this.avatarColor,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, email, deletedAt, avatarColor);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UserEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.email == this.email &&
          other.deletedAt == this.deletedAt &&
          other.avatarColor == this.avatarColor);
}

class UserEntityCompanion extends i0.UpdateCompanion<i1.UserEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> name;
  final i0.Value<String> email;
  final i0.Value<DateTime?> deletedAt;
  final i0.Value<i2.AvatarColor?> avatarColor;
  const UserEntityCompanion({
    this.id = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.email = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
    this.avatarColor = const i0.Value.absent(),
  });
  UserEntityCompanion.insert({
    required String id,
    required String name,
    required String email,
    this.deletedAt = const i0.Value.absent(),
    this.avatarColor = const i0.Value.absent(),
  })  : id = i0.Value(id),
        name = i0.Value(name),
        email = i0.Value(email);
  static i0.Insertable<i1.UserEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? name,
    i0.Expression<String>? email,
    i0.Expression<DateTime>? deletedAt,
    i0.Expression<int>? avatarColor,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (avatarColor != null) 'avatar_color': avatarColor,
    });
  }

  i1.UserEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<String>? name,
      i0.Value<String>? email,
      i0.Value<DateTime?>? deletedAt,
      i0.Value<i2.AvatarColor?>? avatarColor}) {
    return i1.UserEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      deletedAt: deletedAt ?? this.deletedAt,
      avatarColor: avatarColor ?? this.avatarColor,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (email.present) {
      map['email'] = i0.Variable<String>(email.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt.value);
    }
    if (avatarColor.present) {
      map['avatar_color'] = i0.Variable<int>(
          i1.$UserEntityTable.$converteravatarColorn.toSql(avatarColor.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }
}
