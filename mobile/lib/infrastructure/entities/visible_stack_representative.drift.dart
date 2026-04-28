// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/visible_stack_representative.drift.dart'
    as i1;

class VisibleStackRepresentativeData extends i0.DataClass {
  final String stackId;
  final String ownerId;
  final String? assetId;
  const VisibleStackRepresentativeData({
    required this.stackId,
    required this.ownerId,
    this.assetId,
  });
  factory VisibleStackRepresentativeData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return VisibleStackRepresentativeData(
      stackId: serializer.fromJson<String>(json['stack_id']),
      ownerId: serializer.fromJson<String>(json['owner_id']),
      assetId: serializer.fromJson<String?>(json['asset_id']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'stack_id': serializer.toJson<String>(stackId),
      'owner_id': serializer.toJson<String>(ownerId),
      'asset_id': serializer.toJson<String?>(assetId),
    };
  }

  i1.VisibleStackRepresentativeData copyWith({
    String? stackId,
    String? ownerId,
    i0.Value<String?> assetId = const i0.Value.absent(),
  }) => i1.VisibleStackRepresentativeData(
    stackId: stackId ?? this.stackId,
    ownerId: ownerId ?? this.ownerId,
    assetId: assetId.present ? assetId.value : this.assetId,
  );
  @override
  String toString() {
    return (StringBuffer('VisibleStackRepresentativeData(')
          ..write('stackId: $stackId, ')
          ..write('ownerId: $ownerId, ')
          ..write('assetId: $assetId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(stackId, ownerId, assetId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.VisibleStackRepresentativeData &&
          other.stackId == this.stackId &&
          other.ownerId == this.ownerId &&
          other.assetId == this.assetId);
}

class VisibleStackRepresentative
    extends
        i0.ViewInfo<
          i1.VisibleStackRepresentative,
          i1.VisibleStackRepresentativeData
        >
    implements i0.HasResultSet {
  final String? _alias;
  @override
  final i0.GeneratedDatabase attachedDatabase;
  VisibleStackRepresentative(this.attachedDatabase, [this._alias]);
  @override
  List<i0.GeneratedColumn> get $columns => [stackId, ownerId, assetId];
  @override
  String get aliasedName => _alias ?? entityName;
  @override
  String get entityName => 'visible_stack_representative';
  @override
  Map<i0.SqlDialect, String> get createViewStatements => {
    i0.SqlDialect.sqlite:
        'CREATE VIEW visible_stack_representative AS SELECT se.id AS stack_id, se.owner_id, COALESCE((SELECT primary_asset.id FROM remote_asset_entity AS primary_asset WHERE primary_asset.id = se.primary_asset_id AND primary_asset.deleted_at IS NULL AND primary_asset.visibility = 0 AND primary_asset.owner_id = se.owner_id LIMIT 1), (SELECT candidate.id FROM remote_asset_entity AS candidate WHERE candidate.stack_id = se.id AND candidate.deleted_at IS NULL AND candidate.visibility = 0 AND candidate.owner_id = se.owner_id ORDER BY candidate.created_at DESC, candidate.id ASC LIMIT 1)) AS asset_id FROM stack_entity AS se',
  };
  @override
  VisibleStackRepresentative get asDslTable => this;
  @override
  i1.VisibleStackRepresentativeData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.VisibleStackRepresentativeData(
      stackId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}stack_id'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      ),
    );
  }

  late final i0.GeneratedColumn<String> stackId = i0.GeneratedColumn<String>(
    'stack_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
  );
  late final i0.GeneratedColumn<String> ownerId = i0.GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
  );
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
  );
  @override
  VisibleStackRepresentative createAlias(String alias) {
    return VisibleStackRepresentative(attachedDatabase, alias);
  }

  @override
  i0.Query? get query => null;
  @override
  Set<String> get readTables => const {'stack_entity', 'remote_asset_entity'};
}
