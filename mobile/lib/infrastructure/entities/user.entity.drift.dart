// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'dart:typed_data' as i2;
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;

typedef $$UserEntityTableCreateCompanionBuilder = i1.UserEntityCompanion
    Function({
  required i2.Uint8List id,
  required String name,
  i0.Value<bool> isAdmin,
  required String email,
  i0.Value<String?> profileImagePath,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> quotaSizeInBytes,
  i0.Value<int> quotaUsageInBytes,
});
typedef $$UserEntityTableUpdateCompanionBuilder = i1.UserEntityCompanion
    Function({
  i0.Value<i2.Uint8List> id,
  i0.Value<String> name,
  i0.Value<bool> isAdmin,
  i0.Value<String> email,
  i0.Value<String?> profileImagePath,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> quotaSizeInBytes,
  i0.Value<int> quotaUsageInBytes,
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
  i0.ColumnFilters<i2.Uint8List> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isAdmin => $composableBuilder(
      column: $table.isAdmin, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get profileImagePath => $composableBuilder(
      column: $table.profileImagePath,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get quotaSizeInBytes => $composableBuilder(
      column: $table.quotaSizeInBytes,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get quotaUsageInBytes => $composableBuilder(
      column: $table.quotaUsageInBytes,
      builder: (column) => i0.ColumnFilters(column));
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
  i0.ColumnOrderings<i2.Uint8List> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isAdmin => $composableBuilder(
      column: $table.isAdmin, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get profileImagePath => $composableBuilder(
      column: $table.profileImagePath,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get quotaSizeInBytes => $composableBuilder(
      column: $table.quotaSizeInBytes,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get quotaUsageInBytes => $composableBuilder(
      column: $table.quotaUsageInBytes,
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
  i0.GeneratedColumn<i2.Uint8List> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumn<bool> get isAdmin =>
      $composableBuilder(column: $table.isAdmin, builder: (column) => column);

  i0.GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  i0.GeneratedColumn<String> get profileImagePath => $composableBuilder(
      column: $table.profileImagePath, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<int> get quotaSizeInBytes => $composableBuilder(
      column: $table.quotaSizeInBytes, builder: (column) => column);

  i0.GeneratedColumn<int> get quotaUsageInBytes => $composableBuilder(
      column: $table.quotaUsageInBytes, builder: (column) => column);
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
            i0.Value<i2.Uint8List> id = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<bool> isAdmin = const i0.Value.absent(),
            i0.Value<String> email = const i0.Value.absent(),
            i0.Value<String?> profileImagePath = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> quotaSizeInBytes = const i0.Value.absent(),
            i0.Value<int> quotaUsageInBytes = const i0.Value.absent(),
          }) =>
              i1.UserEntityCompanion(
            id: id,
            name: name,
            isAdmin: isAdmin,
            email: email,
            profileImagePath: profileImagePath,
            updatedAt: updatedAt,
            quotaSizeInBytes: quotaSizeInBytes,
            quotaUsageInBytes: quotaUsageInBytes,
          ),
          createCompanionCallback: ({
            required i2.Uint8List id,
            required String name,
            i0.Value<bool> isAdmin = const i0.Value.absent(),
            required String email,
            i0.Value<String?> profileImagePath = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> quotaSizeInBytes = const i0.Value.absent(),
            i0.Value<int> quotaUsageInBytes = const i0.Value.absent(),
          }) =>
              i1.UserEntityCompanion.insert(
            id: id,
            name: name,
            isAdmin: isAdmin,
            email: email,
            profileImagePath: profileImagePath,
            updatedAt: updatedAt,
            quotaSizeInBytes: quotaSizeInBytes,
            quotaUsageInBytes: quotaUsageInBytes,
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
  late final i0.GeneratedColumn<i2.Uint8List> id =
      i0.GeneratedColumn<i2.Uint8List>('id', aliasedName, false,
          type: i0.DriftSqlType.blob, requiredDuringInsert: true);
  static const i0.VerificationMeta _nameMeta =
      const i0.VerificationMeta('name');
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
      'name', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _isAdminMeta =
      const i0.VerificationMeta('isAdmin');
  @override
  late final i0.GeneratedColumn<bool> isAdmin = i0.GeneratedColumn<bool>(
      'is_admin', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          i0.GeneratedColumn.constraintIsAlways('CHECK ("is_admin" IN (0, 1))'),
      defaultValue: const i4.Constant(false));
  static const i0.VerificationMeta _emailMeta =
      const i0.VerificationMeta('email');
  @override
  late final i0.GeneratedColumn<String> email = i0.GeneratedColumn<String>(
      'email', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _profileImagePathMeta =
      const i0.VerificationMeta('profileImagePath');
  @override
  late final i0.GeneratedColumn<String> profileImagePath =
      i0.GeneratedColumn<String>('profile_image_path', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i4.currentDateAndTime);
  static const i0.VerificationMeta _quotaSizeInBytesMeta =
      const i0.VerificationMeta('quotaSizeInBytes');
  @override
  late final i0.GeneratedColumn<int> quotaSizeInBytes = i0.GeneratedColumn<int>(
      'quota_size_in_bytes', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _quotaUsageInBytesMeta =
      const i0.VerificationMeta('quotaUsageInBytes');
  @override
  late final i0.GeneratedColumn<int> quotaUsageInBytes =
      i0.GeneratedColumn<int>('quota_usage_in_bytes', aliasedName, false,
          type: i0.DriftSqlType.int,
          requiredDuringInsert: false,
          defaultValue: const i4.Constant(0));
  @override
  List<i0.GeneratedColumn> get $columns => [
        id,
        name,
        isAdmin,
        email,
        profileImagePath,
        updatedAt,
        quotaSizeInBytes,
        quotaUsageInBytes
      ];
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
    if (data.containsKey('is_admin')) {
      context.handle(_isAdminMeta,
          isAdmin.isAcceptableOrUnknown(data['is_admin']!, _isAdminMeta));
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('profile_image_path')) {
      context.handle(
          _profileImagePathMeta,
          profileImagePath.isAcceptableOrUnknown(
              data['profile_image_path']!, _profileImagePathMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('quota_size_in_bytes')) {
      context.handle(
          _quotaSizeInBytesMeta,
          quotaSizeInBytes.isAcceptableOrUnknown(
              data['quota_size_in_bytes']!, _quotaSizeInBytesMeta));
    }
    if (data.containsKey('quota_usage_in_bytes')) {
      context.handle(
          _quotaUsageInBytesMeta,
          quotaUsageInBytes.isAcceptableOrUnknown(
              data['quota_usage_in_bytes']!, _quotaUsageInBytesMeta));
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
          .read(i0.DriftSqlType.blob, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      isAdmin: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_admin'])!,
      email: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}email'])!,
      profileImagePath: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}profile_image_path']),
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      quotaSizeInBytes: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}quota_size_in_bytes']),
      quotaUsageInBytes: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}quota_usage_in_bytes'])!,
    );
  }

  @override
  $UserEntityTable createAlias(String alias) {
    return $UserEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class UserEntityData extends i0.DataClass
    implements i0.Insertable<i1.UserEntityData> {
  final i2.Uint8List id;
  final String name;
  final bool isAdmin;
  final String email;
  final String? profileImagePath;
  final DateTime updatedAt;
  final int? quotaSizeInBytes;
  final int quotaUsageInBytes;
  const UserEntityData(
      {required this.id,
      required this.name,
      required this.isAdmin,
      required this.email,
      this.profileImagePath,
      required this.updatedAt,
      this.quotaSizeInBytes,
      required this.quotaUsageInBytes});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<i2.Uint8List>(id);
    map['name'] = i0.Variable<String>(name);
    map['is_admin'] = i0.Variable<bool>(isAdmin);
    map['email'] = i0.Variable<String>(email);
    if (!nullToAbsent || profileImagePath != null) {
      map['profile_image_path'] = i0.Variable<String>(profileImagePath);
    }
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || quotaSizeInBytes != null) {
      map['quota_size_in_bytes'] = i0.Variable<int>(quotaSizeInBytes);
    }
    map['quota_usage_in_bytes'] = i0.Variable<int>(quotaUsageInBytes);
    return map;
  }

  factory UserEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UserEntityData(
      id: serializer.fromJson<i2.Uint8List>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      isAdmin: serializer.fromJson<bool>(json['isAdmin']),
      email: serializer.fromJson<String>(json['email']),
      profileImagePath: serializer.fromJson<String?>(json['profileImagePath']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      quotaSizeInBytes: serializer.fromJson<int?>(json['quotaSizeInBytes']),
      quotaUsageInBytes: serializer.fromJson<int>(json['quotaUsageInBytes']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<i2.Uint8List>(id),
      'name': serializer.toJson<String>(name),
      'isAdmin': serializer.toJson<bool>(isAdmin),
      'email': serializer.toJson<String>(email),
      'profileImagePath': serializer.toJson<String?>(profileImagePath),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'quotaSizeInBytes': serializer.toJson<int?>(quotaSizeInBytes),
      'quotaUsageInBytes': serializer.toJson<int>(quotaUsageInBytes),
    };
  }

  i1.UserEntityData copyWith(
          {i2.Uint8List? id,
          String? name,
          bool? isAdmin,
          String? email,
          i0.Value<String?> profileImagePath = const i0.Value.absent(),
          DateTime? updatedAt,
          i0.Value<int?> quotaSizeInBytes = const i0.Value.absent(),
          int? quotaUsageInBytes}) =>
      i1.UserEntityData(
        id: id ?? this.id,
        name: name ?? this.name,
        isAdmin: isAdmin ?? this.isAdmin,
        email: email ?? this.email,
        profileImagePath: profileImagePath.present
            ? profileImagePath.value
            : this.profileImagePath,
        updatedAt: updatedAt ?? this.updatedAt,
        quotaSizeInBytes: quotaSizeInBytes.present
            ? quotaSizeInBytes.value
            : this.quotaSizeInBytes,
        quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      );
  UserEntityData copyWithCompanion(i1.UserEntityCompanion data) {
    return UserEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      isAdmin: data.isAdmin.present ? data.isAdmin.value : this.isAdmin,
      email: data.email.present ? data.email.value : this.email,
      profileImagePath: data.profileImagePath.present
          ? data.profileImagePath.value
          : this.profileImagePath,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      quotaSizeInBytes: data.quotaSizeInBytes.present
          ? data.quotaSizeInBytes.value
          : this.quotaSizeInBytes,
      quotaUsageInBytes: data.quotaUsageInBytes.present
          ? data.quotaUsageInBytes.value
          : this.quotaUsageInBytes,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('email: $email, ')
          ..write('profileImagePath: $profileImagePath, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(i0.$driftBlobEquality.hash(id), name, isAdmin,
      email, profileImagePath, updatedAt, quotaSizeInBytes, quotaUsageInBytes);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UserEntityData &&
          i0.$driftBlobEquality.equals(other.id, this.id) &&
          other.name == this.name &&
          other.isAdmin == this.isAdmin &&
          other.email == this.email &&
          other.profileImagePath == this.profileImagePath &&
          other.updatedAt == this.updatedAt &&
          other.quotaSizeInBytes == this.quotaSizeInBytes &&
          other.quotaUsageInBytes == this.quotaUsageInBytes);
}

class UserEntityCompanion extends i0.UpdateCompanion<i1.UserEntityData> {
  final i0.Value<i2.Uint8List> id;
  final i0.Value<String> name;
  final i0.Value<bool> isAdmin;
  final i0.Value<String> email;
  final i0.Value<String?> profileImagePath;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<int?> quotaSizeInBytes;
  final i0.Value<int> quotaUsageInBytes;
  const UserEntityCompanion({
    this.id = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.isAdmin = const i0.Value.absent(),
    this.email = const i0.Value.absent(),
    this.profileImagePath = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.quotaSizeInBytes = const i0.Value.absent(),
    this.quotaUsageInBytes = const i0.Value.absent(),
  });
  UserEntityCompanion.insert({
    required i2.Uint8List id,
    required String name,
    this.isAdmin = const i0.Value.absent(),
    required String email,
    this.profileImagePath = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.quotaSizeInBytes = const i0.Value.absent(),
    this.quotaUsageInBytes = const i0.Value.absent(),
  })  : id = i0.Value(id),
        name = i0.Value(name),
        email = i0.Value(email);
  static i0.Insertable<i1.UserEntityData> custom({
    i0.Expression<i2.Uint8List>? id,
    i0.Expression<String>? name,
    i0.Expression<bool>? isAdmin,
    i0.Expression<String>? email,
    i0.Expression<String>? profileImagePath,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<int>? quotaSizeInBytes,
    i0.Expression<int>? quotaUsageInBytes,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (isAdmin != null) 'is_admin': isAdmin,
      if (email != null) 'email': email,
      if (profileImagePath != null) 'profile_image_path': profileImagePath,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (quotaSizeInBytes != null) 'quota_size_in_bytes': quotaSizeInBytes,
      if (quotaUsageInBytes != null) 'quota_usage_in_bytes': quotaUsageInBytes,
    });
  }

  i1.UserEntityCompanion copyWith(
      {i0.Value<i2.Uint8List>? id,
      i0.Value<String>? name,
      i0.Value<bool>? isAdmin,
      i0.Value<String>? email,
      i0.Value<String?>? profileImagePath,
      i0.Value<DateTime>? updatedAt,
      i0.Value<int?>? quotaSizeInBytes,
      i0.Value<int>? quotaUsageInBytes}) {
    return i1.UserEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      isAdmin: isAdmin ?? this.isAdmin,
      email: email ?? this.email,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      updatedAt: updatedAt ?? this.updatedAt,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<i2.Uint8List>(id.value);
    }
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (isAdmin.present) {
      map['is_admin'] = i0.Variable<bool>(isAdmin.value);
    }
    if (email.present) {
      map['email'] = i0.Variable<String>(email.value);
    }
    if (profileImagePath.present) {
      map['profile_image_path'] = i0.Variable<String>(profileImagePath.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (quotaSizeInBytes.present) {
      map['quota_size_in_bytes'] = i0.Variable<int>(quotaSizeInBytes.value);
    }
    if (quotaUsageInBytes.present) {
      map['quota_usage_in_bytes'] = i0.Variable<int>(quotaUsageInBytes.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('email: $email, ')
          ..write('profileImagePath: $profileImagePath, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes')
          ..write(')'))
        .toString();
  }
}
