// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/user.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.dart'
    as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;

typedef $$AuthUserEntityTableCreateCompanionBuilder =
    i1.AuthUserEntityCompanion Function({
      required String id,
      required String name,
      required String email,
      i0.Value<bool> isAdmin,
      i0.Value<bool> hasProfileImage,
      i0.Value<DateTime> profileChangedAt,
      required i2.AvatarColor avatarColor,
      i0.Value<int> quotaSizeInBytes,
      i0.Value<int> quotaUsageInBytes,
      i0.Value<String?> pinCode,
    });
typedef $$AuthUserEntityTableUpdateCompanionBuilder =
    i1.AuthUserEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> name,
      i0.Value<String> email,
      i0.Value<bool> isAdmin,
      i0.Value<bool> hasProfileImage,
      i0.Value<DateTime> profileChangedAt,
      i0.Value<i2.AvatarColor> avatarColor,
      i0.Value<int> quotaSizeInBytes,
      i0.Value<int> quotaUsageInBytes,
      i0.Value<String?> pinCode,
    });

class $$AuthUserEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AuthUserEntityTable> {
  $$AuthUserEntityTableFilterComposer({
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

  i0.ColumnFilters<bool> get isAdmin => $composableBuilder(
    column: $table.isAdmin,
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

  i0.ColumnFilters<int> get quotaSizeInBytes => $composableBuilder(
    column: $table.quotaSizeInBytes,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get quotaUsageInBytes => $composableBuilder(
    column: $table.quotaUsageInBytes,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get pinCode => $composableBuilder(
    column: $table.pinCode,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$AuthUserEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AuthUserEntityTable> {
  $$AuthUserEntityTableOrderingComposer({
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

  i0.ColumnOrderings<bool> get isAdmin => $composableBuilder(
    column: $table.isAdmin,
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

  i0.ColumnOrderings<int> get quotaSizeInBytes => $composableBuilder(
    column: $table.quotaSizeInBytes,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get quotaUsageInBytes => $composableBuilder(
    column: $table.quotaUsageInBytes,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get pinCode => $composableBuilder(
    column: $table.pinCode,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$AuthUserEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AuthUserEntityTable> {
  $$AuthUserEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<bool> get isAdmin =>
      $composableBuilder(column: $table.isAdmin, builder: (column) => column);

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

  i0.GeneratedColumn<int> get quotaSizeInBytes => $composableBuilder(
    column: $table.quotaSizeInBytes,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get quotaUsageInBytes => $composableBuilder(
    column: $table.quotaUsageInBytes,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get pinCode =>
      $composableBuilder(column: $table.pinCode, builder: (column) => column);
}

class $$AuthUserEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$AuthUserEntityTable,
          i1.AuthUserEntityData,
          i1.$$AuthUserEntityTableFilterComposer,
          i1.$$AuthUserEntityTableOrderingComposer,
          i1.$$AuthUserEntityTableAnnotationComposer,
          $$AuthUserEntityTableCreateCompanionBuilder,
          $$AuthUserEntityTableUpdateCompanionBuilder,
          (
            i1.AuthUserEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$AuthUserEntityTable,
              i1.AuthUserEntityData
            >,
          ),
          i1.AuthUserEntityData,
          i0.PrefetchHooks Function()
        > {
  $$AuthUserEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$AuthUserEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$AuthUserEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$AuthUserEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$AuthUserEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String> name = const i0.Value.absent(),
                i0.Value<String> email = const i0.Value.absent(),
                i0.Value<bool> isAdmin = const i0.Value.absent(),
                i0.Value<bool> hasProfileImage = const i0.Value.absent(),
                i0.Value<DateTime> profileChangedAt = const i0.Value.absent(),
                i0.Value<i2.AvatarColor> avatarColor = const i0.Value.absent(),
                i0.Value<int> quotaSizeInBytes = const i0.Value.absent(),
                i0.Value<int> quotaUsageInBytes = const i0.Value.absent(),
                i0.Value<String?> pinCode = const i0.Value.absent(),
              }) => i1.AuthUserEntityCompanion(
                id: id,
                name: name,
                email: email,
                isAdmin: isAdmin,
                hasProfileImage: hasProfileImage,
                profileChangedAt: profileChangedAt,
                avatarColor: avatarColor,
                quotaSizeInBytes: quotaSizeInBytes,
                quotaUsageInBytes: quotaUsageInBytes,
                pinCode: pinCode,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                required String email,
                i0.Value<bool> isAdmin = const i0.Value.absent(),
                i0.Value<bool> hasProfileImage = const i0.Value.absent(),
                i0.Value<DateTime> profileChangedAt = const i0.Value.absent(),
                required i2.AvatarColor avatarColor,
                i0.Value<int> quotaSizeInBytes = const i0.Value.absent(),
                i0.Value<int> quotaUsageInBytes = const i0.Value.absent(),
                i0.Value<String?> pinCode = const i0.Value.absent(),
              }) => i1.AuthUserEntityCompanion.insert(
                id: id,
                name: name,
                email: email,
                isAdmin: isAdmin,
                hasProfileImage: hasProfileImage,
                profileChangedAt: profileChangedAt,
                avatarColor: avatarColor,
                quotaSizeInBytes: quotaSizeInBytes,
                quotaUsageInBytes: quotaUsageInBytes,
                pinCode: pinCode,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$AuthUserEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$AuthUserEntityTable,
      i1.AuthUserEntityData,
      i1.$$AuthUserEntityTableFilterComposer,
      i1.$$AuthUserEntityTableOrderingComposer,
      i1.$$AuthUserEntityTableAnnotationComposer,
      $$AuthUserEntityTableCreateCompanionBuilder,
      $$AuthUserEntityTableUpdateCompanionBuilder,
      (
        i1.AuthUserEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$AuthUserEntityTable,
          i1.AuthUserEntityData
        >,
      ),
      i1.AuthUserEntityData,
      i0.PrefetchHooks Function()
    >;

class $AuthUserEntityTable extends i3.AuthUserEntity
    with i0.TableInfo<$AuthUserEntityTable, i1.AuthUserEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AuthUserEntityTable(this.attachedDatabase, [this._alias]);
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
  static const i0.VerificationMeta _isAdminMeta = const i0.VerificationMeta(
    'isAdmin',
  );
  @override
  late final i0.GeneratedColumn<bool> isAdmin = i0.GeneratedColumn<bool>(
    'is_admin',
    aliasedName,
    false,
    type: i0.DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'CHECK ("is_admin" IN (0, 1))',
    ),
    defaultValue: const i4.Constant(false),
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
  avatarColor =
      i0.GeneratedColumn<int>(
        'avatar_color',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: true,
      ).withConverter<i2.AvatarColor>(
        i1.$AuthUserEntityTable.$converteravatarColor,
      );
  static const i0.VerificationMeta _quotaSizeInBytesMeta =
      const i0.VerificationMeta('quotaSizeInBytes');
  @override
  late final i0.GeneratedColumn<int> quotaSizeInBytes = i0.GeneratedColumn<int>(
    'quota_size_in_bytes',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const i4.Constant(0),
  );
  static const i0.VerificationMeta _quotaUsageInBytesMeta =
      const i0.VerificationMeta('quotaUsageInBytes');
  @override
  late final i0.GeneratedColumn<int> quotaUsageInBytes =
      i0.GeneratedColumn<int>(
        'quota_usage_in_bytes',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: false,
        defaultValue: const i4.Constant(0),
      );
  static const i0.VerificationMeta _pinCodeMeta = const i0.VerificationMeta(
    'pinCode',
  );
  @override
  late final i0.GeneratedColumn<String> pinCode = i0.GeneratedColumn<String>(
    'pin_code',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    name,
    email,
    isAdmin,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
    quotaSizeInBytes,
    quotaUsageInBytes,
    pinCode,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'auth_user_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.AuthUserEntityData> instance, {
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
    if (data.containsKey('is_admin')) {
      context.handle(
        _isAdminMeta,
        isAdmin.isAcceptableOrUnknown(data['is_admin']!, _isAdminMeta),
      );
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
    if (data.containsKey('quota_size_in_bytes')) {
      context.handle(
        _quotaSizeInBytesMeta,
        quotaSizeInBytes.isAcceptableOrUnknown(
          data['quota_size_in_bytes']!,
          _quotaSizeInBytesMeta,
        ),
      );
    }
    if (data.containsKey('quota_usage_in_bytes')) {
      context.handle(
        _quotaUsageInBytesMeta,
        quotaUsageInBytes.isAcceptableOrUnknown(
          data['quota_usage_in_bytes']!,
          _quotaUsageInBytesMeta,
        ),
      );
    }
    if (data.containsKey('pin_code')) {
      context.handle(
        _pinCodeMeta,
        pinCode.isAcceptableOrUnknown(data['pin_code']!, _pinCodeMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.AuthUserEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.AuthUserEntityData(
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
      isAdmin: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}is_admin'],
      )!,
      hasProfileImage: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}has_profile_image'],
      )!,
      profileChangedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}profile_changed_at'],
      )!,
      avatarColor: i1.$AuthUserEntityTable.$converteravatarColor.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}avatar_color'],
        )!,
      ),
      quotaSizeInBytes: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}quota_size_in_bytes'],
      )!,
      quotaUsageInBytes: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}quota_usage_in_bytes'],
      )!,
      pinCode: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}pin_code'],
      ),
    );
  }

  @override
  $AuthUserEntityTable createAlias(String alias) {
    return $AuthUserEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AvatarColor, int, int> $converteravatarColor =
      const i0.EnumIndexConverter<i2.AvatarColor>(i2.AvatarColor.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class AuthUserEntityData extends i0.DataClass
    implements i0.Insertable<i1.AuthUserEntityData> {
  final String id;
  final String name;
  final String email;
  final bool isAdmin;
  final bool hasProfileImage;
  final DateTime profileChangedAt;
  final i2.AvatarColor avatarColor;
  final int quotaSizeInBytes;
  final int quotaUsageInBytes;
  final String? pinCode;
  const AuthUserEntityData({
    required this.id,
    required this.name,
    required this.email,
    required this.isAdmin,
    required this.hasProfileImage,
    required this.profileChangedAt,
    required this.avatarColor,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    this.pinCode,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['name'] = i0.Variable<String>(name);
    map['email'] = i0.Variable<String>(email);
    map['is_admin'] = i0.Variable<bool>(isAdmin);
    map['has_profile_image'] = i0.Variable<bool>(hasProfileImage);
    map['profile_changed_at'] = i0.Variable<DateTime>(profileChangedAt);
    {
      map['avatar_color'] = i0.Variable<int>(
        i1.$AuthUserEntityTable.$converteravatarColor.toSql(avatarColor),
      );
    }
    map['quota_size_in_bytes'] = i0.Variable<int>(quotaSizeInBytes);
    map['quota_usage_in_bytes'] = i0.Variable<int>(quotaUsageInBytes);
    if (!nullToAbsent || pinCode != null) {
      map['pin_code'] = i0.Variable<String>(pinCode);
    }
    return map;
  }

  factory AuthUserEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return AuthUserEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      email: serializer.fromJson<String>(json['email']),
      isAdmin: serializer.fromJson<bool>(json['isAdmin']),
      hasProfileImage: serializer.fromJson<bool>(json['hasProfileImage']),
      profileChangedAt: serializer.fromJson<DateTime>(json['profileChangedAt']),
      avatarColor: i1.$AuthUserEntityTable.$converteravatarColor.fromJson(
        serializer.fromJson<int>(json['avatarColor']),
      ),
      quotaSizeInBytes: serializer.fromJson<int>(json['quotaSizeInBytes']),
      quotaUsageInBytes: serializer.fromJson<int>(json['quotaUsageInBytes']),
      pinCode: serializer.fromJson<String?>(json['pinCode']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'email': serializer.toJson<String>(email),
      'isAdmin': serializer.toJson<bool>(isAdmin),
      'hasProfileImage': serializer.toJson<bool>(hasProfileImage),
      'profileChangedAt': serializer.toJson<DateTime>(profileChangedAt),
      'avatarColor': serializer.toJson<int>(
        i1.$AuthUserEntityTable.$converteravatarColor.toJson(avatarColor),
      ),
      'quotaSizeInBytes': serializer.toJson<int>(quotaSizeInBytes),
      'quotaUsageInBytes': serializer.toJson<int>(quotaUsageInBytes),
      'pinCode': serializer.toJson<String?>(pinCode),
    };
  }

  i1.AuthUserEntityData copyWith({
    String? id,
    String? name,
    String? email,
    bool? isAdmin,
    bool? hasProfileImage,
    DateTime? profileChangedAt,
    i2.AvatarColor? avatarColor,
    int? quotaSizeInBytes,
    int? quotaUsageInBytes,
    i0.Value<String?> pinCode = const i0.Value.absent(),
  }) => i1.AuthUserEntityData(
    id: id ?? this.id,
    name: name ?? this.name,
    email: email ?? this.email,
    isAdmin: isAdmin ?? this.isAdmin,
    hasProfileImage: hasProfileImage ?? this.hasProfileImage,
    profileChangedAt: profileChangedAt ?? this.profileChangedAt,
    avatarColor: avatarColor ?? this.avatarColor,
    quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
    quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
    pinCode: pinCode.present ? pinCode.value : this.pinCode,
  );
  AuthUserEntityData copyWithCompanion(i1.AuthUserEntityCompanion data) {
    return AuthUserEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      email: data.email.present ? data.email.value : this.email,
      isAdmin: data.isAdmin.present ? data.isAdmin.value : this.isAdmin,
      hasProfileImage: data.hasProfileImage.present
          ? data.hasProfileImage.value
          : this.hasProfileImage,
      profileChangedAt: data.profileChangedAt.present
          ? data.profileChangedAt.value
          : this.profileChangedAt,
      avatarColor: data.avatarColor.present
          ? data.avatarColor.value
          : this.avatarColor,
      quotaSizeInBytes: data.quotaSizeInBytes.present
          ? data.quotaSizeInBytes.value
          : this.quotaSizeInBytes,
      quotaUsageInBytes: data.quotaUsageInBytes.present
          ? data.quotaUsageInBytes.value
          : this.quotaUsageInBytes,
      pinCode: data.pinCode.present ? data.pinCode.value : this.pinCode,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AuthUserEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes, ')
          ..write('pinCode: $pinCode')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    email,
    isAdmin,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
    quotaSizeInBytes,
    quotaUsageInBytes,
    pinCode,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.AuthUserEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.email == this.email &&
          other.isAdmin == this.isAdmin &&
          other.hasProfileImage == this.hasProfileImage &&
          other.profileChangedAt == this.profileChangedAt &&
          other.avatarColor == this.avatarColor &&
          other.quotaSizeInBytes == this.quotaSizeInBytes &&
          other.quotaUsageInBytes == this.quotaUsageInBytes &&
          other.pinCode == this.pinCode);
}

class AuthUserEntityCompanion
    extends i0.UpdateCompanion<i1.AuthUserEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> name;
  final i0.Value<String> email;
  final i0.Value<bool> isAdmin;
  final i0.Value<bool> hasProfileImage;
  final i0.Value<DateTime> profileChangedAt;
  final i0.Value<i2.AvatarColor> avatarColor;
  final i0.Value<int> quotaSizeInBytes;
  final i0.Value<int> quotaUsageInBytes;
  final i0.Value<String?> pinCode;
  const AuthUserEntityCompanion({
    this.id = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.email = const i0.Value.absent(),
    this.isAdmin = const i0.Value.absent(),
    this.hasProfileImage = const i0.Value.absent(),
    this.profileChangedAt = const i0.Value.absent(),
    this.avatarColor = const i0.Value.absent(),
    this.quotaSizeInBytes = const i0.Value.absent(),
    this.quotaUsageInBytes = const i0.Value.absent(),
    this.pinCode = const i0.Value.absent(),
  });
  AuthUserEntityCompanion.insert({
    required String id,
    required String name,
    required String email,
    this.isAdmin = const i0.Value.absent(),
    this.hasProfileImage = const i0.Value.absent(),
    this.profileChangedAt = const i0.Value.absent(),
    required i2.AvatarColor avatarColor,
    this.quotaSizeInBytes = const i0.Value.absent(),
    this.quotaUsageInBytes = const i0.Value.absent(),
    this.pinCode = const i0.Value.absent(),
  }) : id = i0.Value(id),
       name = i0.Value(name),
       email = i0.Value(email),
       avatarColor = i0.Value(avatarColor);
  static i0.Insertable<i1.AuthUserEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? name,
    i0.Expression<String>? email,
    i0.Expression<bool>? isAdmin,
    i0.Expression<bool>? hasProfileImage,
    i0.Expression<DateTime>? profileChangedAt,
    i0.Expression<int>? avatarColor,
    i0.Expression<int>? quotaSizeInBytes,
    i0.Expression<int>? quotaUsageInBytes,
    i0.Expression<String>? pinCode,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (isAdmin != null) 'is_admin': isAdmin,
      if (hasProfileImage != null) 'has_profile_image': hasProfileImage,
      if (profileChangedAt != null) 'profile_changed_at': profileChangedAt,
      if (avatarColor != null) 'avatar_color': avatarColor,
      if (quotaSizeInBytes != null) 'quota_size_in_bytes': quotaSizeInBytes,
      if (quotaUsageInBytes != null) 'quota_usage_in_bytes': quotaUsageInBytes,
      if (pinCode != null) 'pin_code': pinCode,
    });
  }

  i1.AuthUserEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? name,
    i0.Value<String>? email,
    i0.Value<bool>? isAdmin,
    i0.Value<bool>? hasProfileImage,
    i0.Value<DateTime>? profileChangedAt,
    i0.Value<i2.AvatarColor>? avatarColor,
    i0.Value<int>? quotaSizeInBytes,
    i0.Value<int>? quotaUsageInBytes,
    i0.Value<String?>? pinCode,
  }) {
    return i1.AuthUserEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      isAdmin: isAdmin ?? this.isAdmin,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      avatarColor: avatarColor ?? this.avatarColor,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      pinCode: pinCode ?? this.pinCode,
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
    if (isAdmin.present) {
      map['is_admin'] = i0.Variable<bool>(isAdmin.value);
    }
    if (hasProfileImage.present) {
      map['has_profile_image'] = i0.Variable<bool>(hasProfileImage.value);
    }
    if (profileChangedAt.present) {
      map['profile_changed_at'] = i0.Variable<DateTime>(profileChangedAt.value);
    }
    if (avatarColor.present) {
      map['avatar_color'] = i0.Variable<int>(
        i1.$AuthUserEntityTable.$converteravatarColor.toSql(avatarColor.value),
      );
    }
    if (quotaSizeInBytes.present) {
      map['quota_size_in_bytes'] = i0.Variable<int>(quotaSizeInBytes.value);
    }
    if (quotaUsageInBytes.present) {
      map['quota_usage_in_bytes'] = i0.Variable<int>(quotaUsageInBytes.value);
    }
    if (pinCode.present) {
      map['pin_code'] = i0.Variable<String>(pinCode.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AuthUserEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes, ')
          ..write('pinCode: $pinCode')
          ..write(')'))
        .toString();
  }
}
