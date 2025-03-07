// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/domain/models/user.model.dart' as i1;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;

typedef $$UserEntityTableCreateCompanionBuilder = i2.UserEntityCompanion
    Function({
  i0.Value<int> id,
  required String uid,
  i0.Value<DateTime> updatedAt,
  required String name,
  required String email,
  i0.Value<bool> isAdmin,
  i0.Value<int> quotaSizeInBytes,
  i0.Value<int> quotaUsageInBytes,
  i0.Value<bool> isPartnerSharedBy,
  i0.Value<bool> isPartnerSharedWith,
  i0.Value<bool> inTimeline,
  i0.Value<String?> profileImagePath,
  i0.Value<bool> memoryEnabled,
  required i1.AvatarColor avatarColor,
});
typedef $$UserEntityTableUpdateCompanionBuilder = i2.UserEntityCompanion
    Function({
  i0.Value<int> id,
  i0.Value<String> uid,
  i0.Value<DateTime> updatedAt,
  i0.Value<String> name,
  i0.Value<String> email,
  i0.Value<bool> isAdmin,
  i0.Value<int> quotaSizeInBytes,
  i0.Value<int> quotaUsageInBytes,
  i0.Value<bool> isPartnerSharedBy,
  i0.Value<bool> isPartnerSharedWith,
  i0.Value<bool> inTimeline,
  i0.Value<String?> profileImagePath,
  i0.Value<bool> memoryEnabled,
  i0.Value<i1.AvatarColor> avatarColor,
});

class $$UserEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i2.$UserEntityTable> {
  $$UserEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get uid => $composableBuilder(
      column: $table.uid, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isAdmin => $composableBuilder(
      column: $table.isAdmin, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get quotaSizeInBytes => $composableBuilder(
      column: $table.quotaSizeInBytes,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get quotaUsageInBytes => $composableBuilder(
      column: $table.quotaUsageInBytes,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isPartnerSharedBy => $composableBuilder(
      column: $table.isPartnerSharedBy,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isPartnerSharedWith => $composableBuilder(
      column: $table.isPartnerSharedWith,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get inTimeline => $composableBuilder(
      column: $table.inTimeline, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get profileImagePath => $composableBuilder(
      column: $table.profileImagePath,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get memoryEnabled => $composableBuilder(
      column: $table.memoryEnabled,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i1.AvatarColor, i1.AvatarColor, int>
      get avatarColor => $composableBuilder(
          column: $table.avatarColor,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));
}

class $$UserEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i2.$UserEntityTable> {
  $$UserEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get uid => $composableBuilder(
      column: $table.uid, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isAdmin => $composableBuilder(
      column: $table.isAdmin, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get quotaSizeInBytes => $composableBuilder(
      column: $table.quotaSizeInBytes,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get quotaUsageInBytes => $composableBuilder(
      column: $table.quotaUsageInBytes,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isPartnerSharedBy => $composableBuilder(
      column: $table.isPartnerSharedBy,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isPartnerSharedWith => $composableBuilder(
      column: $table.isPartnerSharedWith,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get inTimeline => $composableBuilder(
      column: $table.inTimeline,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get profileImagePath => $composableBuilder(
      column: $table.profileImagePath,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get memoryEnabled => $composableBuilder(
      column: $table.memoryEnabled,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get avatarColor => $composableBuilder(
      column: $table.avatarColor,
      builder: (column) => i0.ColumnOrderings(column));
}

class $$UserEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i2.$UserEntityTable> {
  $$UserEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get uid =>
      $composableBuilder(column: $table.uid, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  i0.GeneratedColumn<bool> get isAdmin =>
      $composableBuilder(column: $table.isAdmin, builder: (column) => column);

  i0.GeneratedColumn<int> get quotaSizeInBytes => $composableBuilder(
      column: $table.quotaSizeInBytes, builder: (column) => column);

  i0.GeneratedColumn<int> get quotaUsageInBytes => $composableBuilder(
      column: $table.quotaUsageInBytes, builder: (column) => column);

  i0.GeneratedColumn<bool> get isPartnerSharedBy => $composableBuilder(
      column: $table.isPartnerSharedBy, builder: (column) => column);

  i0.GeneratedColumn<bool> get isPartnerSharedWith => $composableBuilder(
      column: $table.isPartnerSharedWith, builder: (column) => column);

  i0.GeneratedColumn<bool> get inTimeline => $composableBuilder(
      column: $table.inTimeline, builder: (column) => column);

  i0.GeneratedColumn<String> get profileImagePath => $composableBuilder(
      column: $table.profileImagePath, builder: (column) => column);

  i0.GeneratedColumn<bool> get memoryEnabled => $composableBuilder(
      column: $table.memoryEnabled, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i1.AvatarColor, int> get avatarColor =>
      $composableBuilder(
          column: $table.avatarColor, builder: (column) => column);
}

class $$UserEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i2.$UserEntityTable,
    i1.User,
    i2.$$UserEntityTableFilterComposer,
    i2.$$UserEntityTableOrderingComposer,
    i2.$$UserEntityTableAnnotationComposer,
    $$UserEntityTableCreateCompanionBuilder,
    $$UserEntityTableUpdateCompanionBuilder,
    (
      i1.User,
      i0.BaseReferences<i0.GeneratedDatabase, i2.$UserEntityTable, i1.User>
    ),
    i1.User,
    i0.PrefetchHooks Function()> {
  $$UserEntityTableTableManager(
      i0.GeneratedDatabase db, i2.$UserEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i2.$$UserEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i2.$$UserEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i2.$$UserEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            i0.Value<String> uid = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<String> email = const i0.Value.absent(),
            i0.Value<bool> isAdmin = const i0.Value.absent(),
            i0.Value<int> quotaSizeInBytes = const i0.Value.absent(),
            i0.Value<int> quotaUsageInBytes = const i0.Value.absent(),
            i0.Value<bool> isPartnerSharedBy = const i0.Value.absent(),
            i0.Value<bool> isPartnerSharedWith = const i0.Value.absent(),
            i0.Value<bool> inTimeline = const i0.Value.absent(),
            i0.Value<String?> profileImagePath = const i0.Value.absent(),
            i0.Value<bool> memoryEnabled = const i0.Value.absent(),
            i0.Value<i1.AvatarColor> avatarColor = const i0.Value.absent(),
          }) =>
              i2.UserEntityCompanion(
            id: id,
            uid: uid,
            updatedAt: updatedAt,
            name: name,
            email: email,
            isAdmin: isAdmin,
            quotaSizeInBytes: quotaSizeInBytes,
            quotaUsageInBytes: quotaUsageInBytes,
            isPartnerSharedBy: isPartnerSharedBy,
            isPartnerSharedWith: isPartnerSharedWith,
            inTimeline: inTimeline,
            profileImagePath: profileImagePath,
            memoryEnabled: memoryEnabled,
            avatarColor: avatarColor,
          ),
          createCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            required String uid,
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            required String name,
            required String email,
            i0.Value<bool> isAdmin = const i0.Value.absent(),
            i0.Value<int> quotaSizeInBytes = const i0.Value.absent(),
            i0.Value<int> quotaUsageInBytes = const i0.Value.absent(),
            i0.Value<bool> isPartnerSharedBy = const i0.Value.absent(),
            i0.Value<bool> isPartnerSharedWith = const i0.Value.absent(),
            i0.Value<bool> inTimeline = const i0.Value.absent(),
            i0.Value<String?> profileImagePath = const i0.Value.absent(),
            i0.Value<bool> memoryEnabled = const i0.Value.absent(),
            required i1.AvatarColor avatarColor,
          }) =>
              i2.UserEntityCompanion.insert(
            id: id,
            uid: uid,
            updatedAt: updatedAt,
            name: name,
            email: email,
            isAdmin: isAdmin,
            quotaSizeInBytes: quotaSizeInBytes,
            quotaUsageInBytes: quotaUsageInBytes,
            isPartnerSharedBy: isPartnerSharedBy,
            isPartnerSharedWith: isPartnerSharedWith,
            inTimeline: inTimeline,
            profileImagePath: profileImagePath,
            memoryEnabled: memoryEnabled,
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
    i2.$UserEntityTable,
    i1.User,
    i2.$$UserEntityTableFilterComposer,
    i2.$$UserEntityTableOrderingComposer,
    i2.$$UserEntityTableAnnotationComposer,
    $$UserEntityTableCreateCompanionBuilder,
    $$UserEntityTableUpdateCompanionBuilder,
    (
      i1.User,
      i0.BaseReferences<i0.GeneratedDatabase, i2.$UserEntityTable, i1.User>
    ),
    i1.User,
    i0.PrefetchHooks Function()>;
i0.Index get userUid =>
    i0.Index('user_uid', 'CREATE INDEX user_uid ON user_entity (uid)');

class $UserEntityTable extends i3.UserEntity
    with i0.TableInfo<$UserEntityTable, i1.User> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UserEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _uidMeta = const i0.VerificationMeta('uid');
  @override
  late final i0.GeneratedColumn<String> uid = i0.GeneratedColumn<String>(
      'uid', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i4.currentDateAndTime);
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
  static const i0.VerificationMeta _quotaSizeInBytesMeta =
      const i0.VerificationMeta('quotaSizeInBytes');
  @override
  late final i0.GeneratedColumn<int> quotaSizeInBytes = i0.GeneratedColumn<int>(
      'quota_size_in_bytes', aliasedName, false,
      type: i0.DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const i4.Constant(0));
  static const i0.VerificationMeta _quotaUsageInBytesMeta =
      const i0.VerificationMeta('quotaUsageInBytes');
  @override
  late final i0.GeneratedColumn<int> quotaUsageInBytes =
      i0.GeneratedColumn<int>('quota_usage_in_bytes', aliasedName, false,
          type: i0.DriftSqlType.int,
          requiredDuringInsert: false,
          defaultValue: const i4.Constant(0));
  static const i0.VerificationMeta _isPartnerSharedByMeta =
      const i0.VerificationMeta('isPartnerSharedBy');
  @override
  late final i0.GeneratedColumn<bool> isPartnerSharedBy =
      i0.GeneratedColumn<bool>('is_partner_shared_by', aliasedName, false,
          type: i0.DriftSqlType.bool,
          requiredDuringInsert: false,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'CHECK ("is_partner_shared_by" IN (0, 1))'),
          defaultValue: const i4.Constant(false));
  static const i0.VerificationMeta _isPartnerSharedWithMeta =
      const i0.VerificationMeta('isPartnerSharedWith');
  @override
  late final i0.GeneratedColumn<bool> isPartnerSharedWith =
      i0.GeneratedColumn<bool>('is_partner_shared_with', aliasedName, false,
          type: i0.DriftSqlType.bool,
          requiredDuringInsert: false,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'CHECK ("is_partner_shared_with" IN (0, 1))'),
          defaultValue: const i4.Constant(false));
  static const i0.VerificationMeta _inTimelineMeta =
      const i0.VerificationMeta('inTimeline');
  @override
  late final i0.GeneratedColumn<bool> inTimeline = i0.GeneratedColumn<bool>(
      'in_timeline', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("in_timeline" IN (0, 1))'),
      defaultValue: const i4.Constant(false));
  static const i0.VerificationMeta _profileImagePathMeta =
      const i0.VerificationMeta('profileImagePath');
  @override
  late final i0.GeneratedColumn<String> profileImagePath =
      i0.GeneratedColumn<String>('profile_image_path', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _memoryEnabledMeta =
      const i0.VerificationMeta('memoryEnabled');
  @override
  late final i0.GeneratedColumn<bool> memoryEnabled = i0.GeneratedColumn<bool>(
      'memory_enabled', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("memory_enabled" IN (0, 1))'),
      defaultValue: const i4.Constant(true));
  static const i0.VerificationMeta _avatarColorMeta =
      const i0.VerificationMeta('avatarColor');
  @override
  late final i0.GeneratedColumnWithTypeConverter<i1.AvatarColor, int>
      avatarColor = i0.GeneratedColumn<int>('avatar_color', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i1.AvatarColor>(
              i2.$UserEntityTable.$converteravatarColor);
  @override
  List<i0.GeneratedColumn> get $columns => [
        id,
        uid,
        updatedAt,
        name,
        email,
        isAdmin,
        quotaSizeInBytes,
        quotaUsageInBytes,
        isPartnerSharedBy,
        isPartnerSharedWith,
        inTimeline,
        profileImagePath,
        memoryEnabled,
        avatarColor
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_entity';
  @override
  i0.VerificationContext validateIntegrity(i0.Insertable<i1.User> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('uid')) {
      context.handle(
          _uidMeta, uid.isAcceptableOrUnknown(data['uid']!, _uidMeta));
    } else if (isInserting) {
      context.missing(_uidMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
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
    if (data.containsKey('is_admin')) {
      context.handle(_isAdminMeta,
          isAdmin.isAcceptableOrUnknown(data['is_admin']!, _isAdminMeta));
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
    if (data.containsKey('is_partner_shared_by')) {
      context.handle(
          _isPartnerSharedByMeta,
          isPartnerSharedBy.isAcceptableOrUnknown(
              data['is_partner_shared_by']!, _isPartnerSharedByMeta));
    }
    if (data.containsKey('is_partner_shared_with')) {
      context.handle(
          _isPartnerSharedWithMeta,
          isPartnerSharedWith.isAcceptableOrUnknown(
              data['is_partner_shared_with']!, _isPartnerSharedWithMeta));
    }
    if (data.containsKey('in_timeline')) {
      context.handle(
          _inTimelineMeta,
          inTimeline.isAcceptableOrUnknown(
              data['in_timeline']!, _inTimelineMeta));
    }
    if (data.containsKey('profile_image_path')) {
      context.handle(
          _profileImagePathMeta,
          profileImagePath.isAcceptableOrUnknown(
              data['profile_image_path']!, _profileImagePathMeta));
    }
    if (data.containsKey('memory_enabled')) {
      context.handle(
          _memoryEnabledMeta,
          memoryEnabled.isAcceptableOrUnknown(
              data['memory_enabled']!, _memoryEnabledMeta));
    }
    context.handle(_avatarColorMeta, const i0.VerificationResult.success());
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.User map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.User(
      uid: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}uid'])!,
      email: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}email'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      isAdmin: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_admin'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      profileImagePath: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}profile_image_path']),
      avatarColor: i2.$UserEntityTable.$converteravatarColor.fromSql(
          attachedDatabase.typeMapping.read(
              i0.DriftSqlType.int, data['${effectivePrefix}avatar_color'])!),
      memoryEnabled: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.bool, data['${effectivePrefix}memory_enabled'])!,
      inTimeline: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}in_timeline'])!,
      isPartnerSharedBy: attachedDatabase.typeMapping.read(i0.DriftSqlType.bool,
          data['${effectivePrefix}is_partner_shared_by'])!,
      isPartnerSharedWith: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.bool,
          data['${effectivePrefix}is_partner_shared_with'])!,
      quotaUsageInBytes: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}quota_usage_in_bytes'])!,
      quotaSizeInBytes: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}quota_size_in_bytes'])!,
    );
  }

  @override
  $UserEntityTable createAlias(String alias) {
    return $UserEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i1.AvatarColor, int, int> $converteravatarColor =
      const i0.EnumIndexConverter<i1.AvatarColor>(i1.AvatarColor.values);
}

class UserEntityCompanion extends i0.UpdateCompanion<i1.User> {
  final i0.Value<int> id;
  final i0.Value<String> uid;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<String> name;
  final i0.Value<String> email;
  final i0.Value<bool> isAdmin;
  final i0.Value<int> quotaSizeInBytes;
  final i0.Value<int> quotaUsageInBytes;
  final i0.Value<bool> isPartnerSharedBy;
  final i0.Value<bool> isPartnerSharedWith;
  final i0.Value<bool> inTimeline;
  final i0.Value<String?> profileImagePath;
  final i0.Value<bool> memoryEnabled;
  final i0.Value<i1.AvatarColor> avatarColor;
  const UserEntityCompanion({
    this.id = const i0.Value.absent(),
    this.uid = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.email = const i0.Value.absent(),
    this.isAdmin = const i0.Value.absent(),
    this.quotaSizeInBytes = const i0.Value.absent(),
    this.quotaUsageInBytes = const i0.Value.absent(),
    this.isPartnerSharedBy = const i0.Value.absent(),
    this.isPartnerSharedWith = const i0.Value.absent(),
    this.inTimeline = const i0.Value.absent(),
    this.profileImagePath = const i0.Value.absent(),
    this.memoryEnabled = const i0.Value.absent(),
    this.avatarColor = const i0.Value.absent(),
  });
  UserEntityCompanion.insert({
    this.id = const i0.Value.absent(),
    required String uid,
    this.updatedAt = const i0.Value.absent(),
    required String name,
    required String email,
    this.isAdmin = const i0.Value.absent(),
    this.quotaSizeInBytes = const i0.Value.absent(),
    this.quotaUsageInBytes = const i0.Value.absent(),
    this.isPartnerSharedBy = const i0.Value.absent(),
    this.isPartnerSharedWith = const i0.Value.absent(),
    this.inTimeline = const i0.Value.absent(),
    this.profileImagePath = const i0.Value.absent(),
    this.memoryEnabled = const i0.Value.absent(),
    required i1.AvatarColor avatarColor,
  })  : uid = i0.Value(uid),
        name = i0.Value(name),
        email = i0.Value(email),
        avatarColor = i0.Value(avatarColor);
  static i0.Insertable<i1.User> custom({
    i0.Expression<int>? id,
    i0.Expression<String>? uid,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<String>? name,
    i0.Expression<String>? email,
    i0.Expression<bool>? isAdmin,
    i0.Expression<int>? quotaSizeInBytes,
    i0.Expression<int>? quotaUsageInBytes,
    i0.Expression<bool>? isPartnerSharedBy,
    i0.Expression<bool>? isPartnerSharedWith,
    i0.Expression<bool>? inTimeline,
    i0.Expression<String>? profileImagePath,
    i0.Expression<bool>? memoryEnabled,
    i0.Expression<int>? avatarColor,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (uid != null) 'uid': uid,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (isAdmin != null) 'is_admin': isAdmin,
      if (quotaSizeInBytes != null) 'quota_size_in_bytes': quotaSizeInBytes,
      if (quotaUsageInBytes != null) 'quota_usage_in_bytes': quotaUsageInBytes,
      if (isPartnerSharedBy != null) 'is_partner_shared_by': isPartnerSharedBy,
      if (isPartnerSharedWith != null)
        'is_partner_shared_with': isPartnerSharedWith,
      if (inTimeline != null) 'in_timeline': inTimeline,
      if (profileImagePath != null) 'profile_image_path': profileImagePath,
      if (memoryEnabled != null) 'memory_enabled': memoryEnabled,
      if (avatarColor != null) 'avatar_color': avatarColor,
    });
  }

  i2.UserEntityCompanion copyWith(
      {i0.Value<int>? id,
      i0.Value<String>? uid,
      i0.Value<DateTime>? updatedAt,
      i0.Value<String>? name,
      i0.Value<String>? email,
      i0.Value<bool>? isAdmin,
      i0.Value<int>? quotaSizeInBytes,
      i0.Value<int>? quotaUsageInBytes,
      i0.Value<bool>? isPartnerSharedBy,
      i0.Value<bool>? isPartnerSharedWith,
      i0.Value<bool>? inTimeline,
      i0.Value<String?>? profileImagePath,
      i0.Value<bool>? memoryEnabled,
      i0.Value<i1.AvatarColor>? avatarColor}) {
    return i2.UserEntityCompanion(
      id: id ?? this.id,
      uid: uid ?? this.uid,
      updatedAt: updatedAt ?? this.updatedAt,
      name: name ?? this.name,
      email: email ?? this.email,
      isAdmin: isAdmin ?? this.isAdmin,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      isPartnerSharedBy: isPartnerSharedBy ?? this.isPartnerSharedBy,
      isPartnerSharedWith: isPartnerSharedWith ?? this.isPartnerSharedWith,
      inTimeline: inTimeline ?? this.inTimeline,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      memoryEnabled: memoryEnabled ?? this.memoryEnabled,
      avatarColor: avatarColor ?? this.avatarColor,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<int>(id.value);
    }
    if (uid.present) {
      map['uid'] = i0.Variable<String>(uid.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
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
    if (quotaSizeInBytes.present) {
      map['quota_size_in_bytes'] = i0.Variable<int>(quotaSizeInBytes.value);
    }
    if (quotaUsageInBytes.present) {
      map['quota_usage_in_bytes'] = i0.Variable<int>(quotaUsageInBytes.value);
    }
    if (isPartnerSharedBy.present) {
      map['is_partner_shared_by'] = i0.Variable<bool>(isPartnerSharedBy.value);
    }
    if (isPartnerSharedWith.present) {
      map['is_partner_shared_with'] =
          i0.Variable<bool>(isPartnerSharedWith.value);
    }
    if (inTimeline.present) {
      map['in_timeline'] = i0.Variable<bool>(inTimeline.value);
    }
    if (profileImagePath.present) {
      map['profile_image_path'] = i0.Variable<String>(profileImagePath.value);
    }
    if (memoryEnabled.present) {
      map['memory_enabled'] = i0.Variable<bool>(memoryEnabled.value);
    }
    if (avatarColor.present) {
      map['avatar_color'] = i0.Variable<int>(
          i2.$UserEntityTable.$converteravatarColor.toSql(avatarColor.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityCompanion(')
          ..write('id: $id, ')
          ..write('uid: $uid, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes, ')
          ..write('isPartnerSharedBy: $isPartnerSharedBy, ')
          ..write('isPartnerSharedWith: $isPartnerSharedWith, ')
          ..write('inTimeline: $inTimeline, ')
          ..write('profileImagePath: $profileImagePath, ')
          ..write('memoryEnabled: $memoryEnabled, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }
}
