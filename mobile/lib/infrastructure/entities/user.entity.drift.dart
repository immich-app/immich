// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/user.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;

typedef $$UserEntityTableCreateCompanionBuilder =
    i1.UserEntityCompanion Function({
      required String id,
      required String name,
      required String email,
      i0.Value<bool> hasProfileImage,
      i0.Value<DateTime> profileChangedAt,
      i0.Value<i2.AvatarColor> avatarColor,
    });
typedef $$UserEntityTableUpdateCompanionBuilder =
    i1.UserEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> name,
      i0.Value<String> email,
      i0.Value<bool> hasProfileImage,
      i0.Value<DateTime> profileChangedAt,
      i0.Value<i2.AvatarColor> avatarColor,
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
    column: $table.id,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get hasProfileImage => $composableBuilder(
    column: $table.hasProfileImage,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get profileChangedAt => $composableBuilder(
    column: $table.profileChangedAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnWithTypeConverterFilters<i2.AvatarColor, i2.AvatarColor, int>
  get avatarColor => $composableBuilder(
    column: $table.avatarColor,
    builder: (column) => i0.ColumnWithTypeConverterFilters(column),
  );
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
    column: $table.id,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get hasProfileImage => $composableBuilder(
    column: $table.hasProfileImage,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get profileChangedAt => $composableBuilder(
    column: $table.profileChangedAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get avatarColor => $composableBuilder(
    column: $table.avatarColor,
    builder: (column) => i0.ColumnOrderings(column),
  );
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

  i0.GeneratedColumn<bool> get hasProfileImage => $composableBuilder(
    column: $table.hasProfileImage,
    builder: (column) => column,
  );

  i0.GeneratedColumn<DateTime> get profileChangedAt => $composableBuilder(
    column: $table.profileChangedAt,
    builder: (column) => column,
  );

  i0.GeneratedColumnWithTypeConverter<i2.AvatarColor, int> get avatarColor =>
      $composableBuilder(
        column: $table.avatarColor,
        builder: (column) => column,
      );
}

class $$UserEntityTableTableManager
    extends
        i0.RootTableManager<
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
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$UserEntityTable,
              i1.UserEntityData
            >,
          ),
          i1.UserEntityData,
          i0.PrefetchHooks Function()
        > {
  $$UserEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$UserEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$UserEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$UserEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$UserEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String> name = const i0.Value.absent(),
                i0.Value<String> email = const i0.Value.absent(),
                i0.Value<bool> hasProfileImage = const i0.Value.absent(),
                i0.Value<DateTime> profileChangedAt = const i0.Value.absent(),
                i0.Value<i2.AvatarColor> avatarColor = const i0.Value.absent(),
              }) => i1.UserEntityCompanion(
                id: id,
                name: name,
                email: email,
                hasProfileImage: hasProfileImage,
                profileChangedAt: profileChangedAt,
                avatarColor: avatarColor,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                required String email,
                i0.Value<bool> hasProfileImage = const i0.Value.absent(),
                i0.Value<DateTime> profileChangedAt = const i0.Value.absent(),
                i0.Value<i2.AvatarColor> avatarColor = const i0.Value.absent(),
              }) => i1.UserEntityCompanion.insert(
                id: id,
                name: name,
                email: email,
                hasProfileImage: hasProfileImage,
                profileChangedAt: profileChangedAt,
                avatarColor: avatarColor,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$UserEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
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
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$UserEntityTable,
          i1.UserEntityData
        >,
      ),
      i1.UserEntityData,
      i0.PrefetchHooks Function()
    >;

class $UserEntityTable extends i3.UserEntity
    with i0.TableInfo<$UserEntityTable, i1.UserEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UserEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _nameMeta = const i0.VerificationMeta(
    'name',
  );
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _emailMeta = const i0.VerificationMeta(
    'email',
  );
  @override
  late final i0.GeneratedColumn<String> email = i0.GeneratedColumn<String>(
    'email',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _hasProfileImageMeta =
      const i0.VerificationMeta('hasProfileImage');
  @override
  late final i0.GeneratedColumn<bool> hasProfileImage =
      i0.GeneratedColumn<bool>(
        'has_profile_image',
        aliasedName,
        false,
        type: i0.DriftSqlType.bool,
        requiredDuringInsert: false,
        defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("has_profile_image" IN (0, 1))',
        ),
        defaultValue: const i4.Constant(false),
      );
  static const i0.VerificationMeta _profileChangedAtMeta =
      const i0.VerificationMeta('profileChangedAt');
  @override
  late final i0.GeneratedColumn<DateTime> profileChangedAt =
      i0.GeneratedColumn<DateTime>(
        'profile_changed_at',
        aliasedName,
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: i4.currentDateAndTime,
      );
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AvatarColor, int>
  avatarColor = i0.GeneratedColumn<int>(
    'avatar_color',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const i4.Constant(0),
  ).withConverter<i2.AvatarColor>(i1.$UserEntityTable.$converteravatarColor);
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    name,
    email,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.UserEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('email')) {
      context.handle(
        _emailMeta,
        email.isAcceptableOrUnknown(data['email']!, _emailMeta),
      );
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('has_profile_image')) {
      context.handle(
        _hasProfileImageMeta,
        hasProfileImage.isAcceptableOrUnknown(
          data['has_profile_image']!,
          _hasProfileImageMeta,
        ),
      );
    }
    if (data.containsKey('profile_changed_at')) {
      context.handle(
        _profileChangedAtMeta,
        profileChangedAt.isAcceptableOrUnknown(
          data['profile_changed_at']!,
          _profileChangedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.UserEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UserEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      email: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}email'],
      )!,
      hasProfileImage: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}has_profile_image'],
      )!,
      profileChangedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}profile_changed_at'],
      )!,
      avatarColor: i1.$UserEntityTable.$converteravatarColor.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}avatar_color'],
        )!,
      ),
    );
  }

  @override
  $UserEntityTable createAlias(String alias) {
    return $UserEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AvatarColor, int, int> $converteravatarColor =
      const i0.EnumIndexConverter<i2.AvatarColor>(i2.AvatarColor.values);
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
  final bool hasProfileImage;
  final DateTime profileChangedAt;
  final i2.AvatarColor avatarColor;
  const UserEntityData({
    required this.id,
    required this.name,
    required this.email,
    required this.hasProfileImage,
    required this.profileChangedAt,
    required this.avatarColor,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['name'] = i0.Variable<String>(name);
    map['email'] = i0.Variable<String>(email);
    map['has_profile_image'] = i0.Variable<bool>(hasProfileImage);
    map['profile_changed_at'] = i0.Variable<DateTime>(profileChangedAt);
    {
      map['avatar_color'] = i0.Variable<int>(
        i1.$UserEntityTable.$converteravatarColor.toSql(avatarColor),
      );
    }
    return map;
  }

  factory UserEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UserEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      email: serializer.fromJson<String>(json['email']),
      hasProfileImage: serializer.fromJson<bool>(json['hasProfileImage']),
      profileChangedAt: serializer.fromJson<DateTime>(json['profileChangedAt']),
      avatarColor: i1.$UserEntityTable.$converteravatarColor.fromJson(
        serializer.fromJson<int>(json['avatarColor']),
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'email': serializer.toJson<String>(email),
      'hasProfileImage': serializer.toJson<bool>(hasProfileImage),
      'profileChangedAt': serializer.toJson<DateTime>(profileChangedAt),
      'avatarColor': serializer.toJson<int>(
        i1.$UserEntityTable.$converteravatarColor.toJson(avatarColor),
      ),
    };
  }

  i1.UserEntityData copyWith({
    String? id,
    String? name,
    String? email,
    bool? hasProfileImage,
    DateTime? profileChangedAt,
    i2.AvatarColor? avatarColor,
  }) => i1.UserEntityData(
    id: id ?? this.id,
    name: name ?? this.name,
    email: email ?? this.email,
    hasProfileImage: hasProfileImage ?? this.hasProfileImage,
    profileChangedAt: profileChangedAt ?? this.profileChangedAt,
    avatarColor: avatarColor ?? this.avatarColor,
  );
  UserEntityData copyWithCompanion(i1.UserEntityCompanion data) {
    return UserEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      email: data.email.present ? data.email.value : this.email,
      hasProfileImage: data.hasProfileImage.present
          ? data.hasProfileImage.value
          : this.hasProfileImage,
      profileChangedAt: data.profileChangedAt.present
          ? data.profileChangedAt.value
          : this.profileChangedAt,
      avatarColor: data.avatarColor.present
          ? data.avatarColor.value
          : this.avatarColor,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    email,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UserEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.email == this.email &&
          other.hasProfileImage == this.hasProfileImage &&
          other.profileChangedAt == this.profileChangedAt &&
          other.avatarColor == this.avatarColor);
}

class UserEntityCompanion extends i0.UpdateCompanion<i1.UserEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> name;
  final i0.Value<String> email;
  final i0.Value<bool> hasProfileImage;
  final i0.Value<DateTime> profileChangedAt;
  final i0.Value<i2.AvatarColor> avatarColor;
  const UserEntityCompanion({
    this.id = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.email = const i0.Value.absent(),
    this.hasProfileImage = const i0.Value.absent(),
    this.profileChangedAt = const i0.Value.absent(),
    this.avatarColor = const i0.Value.absent(),
  });
  UserEntityCompanion.insert({
    required String id,
    required String name,
    required String email,
    this.hasProfileImage = const i0.Value.absent(),
    this.profileChangedAt = const i0.Value.absent(),
    this.avatarColor = const i0.Value.absent(),
  }) : id = i0.Value(id),
       name = i0.Value(name),
       email = i0.Value(email);
  static i0.Insertable<i1.UserEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? name,
    i0.Expression<String>? email,
    i0.Expression<bool>? hasProfileImage,
    i0.Expression<DateTime>? profileChangedAt,
    i0.Expression<int>? avatarColor,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (hasProfileImage != null) 'has_profile_image': hasProfileImage,
      if (profileChangedAt != null) 'profile_changed_at': profileChangedAt,
      if (avatarColor != null) 'avatar_color': avatarColor,
    });
  }

  i1.UserEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? name,
    i0.Value<String>? email,
    i0.Value<bool>? hasProfileImage,
    i0.Value<DateTime>? profileChangedAt,
    i0.Value<i2.AvatarColor>? avatarColor,
  }) {
    return i1.UserEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
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
    if (hasProfileImage.present) {
      map['has_profile_image'] = i0.Variable<bool>(hasProfileImage.value);
    }
    if (profileChangedAt.present) {
      map['profile_changed_at'] = i0.Variable<DateTime>(profileChangedAt.value);
    }
    if (avatarColor.present) {
      map['avatar_color'] = i0.Variable<int>(
        i1.$UserEntityTable.$converteravatarColor.toSql(avatarColor.value),
      );
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }
}
