// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'device_asset.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetDeviceAssetCollection on Isar {
  IsarCollection<DeviceAsset> get deviceAssets => this.collection();
}

const DeviceAssetSchema = CollectionSchema(
  name: r'DeviceAsset',
  id: -2122558759826746878,
  properties: {
    r'backupSelection': PropertySchema(
      id: 0,
      name: r'backupSelection',
      type: IsarType.byte,
      enumMap: _DeviceAssetbackupSelectionEnumValueMap,
    ),
    r'hash': PropertySchema(
      id: 1,
      name: r'hash',
      type: IsarType.byteList,
    ),
    r'id': PropertySchema(
      id: 2,
      name: r'id',
      type: IsarType.string,
    )
  },
  estimateSize: _deviceAssetEstimateSize,
  serialize: _deviceAssetSerialize,
  deserialize: _deviceAssetDeserialize,
  deserializeProp: _deviceAssetDeserializeProp,
  idName: r'isarId',
  indexes: {
    r'id': IndexSchema(
      id: -3268401673993471357,
      name: r'id',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'id',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    ),
    r'hash': IndexSchema(
      id: -7973251393006690288,
      name: r'hash',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'hash',
          type: IndexType.hash,
          caseSensitive: false,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _deviceAssetGetId,
  getLinks: _deviceAssetGetLinks,
  attach: _deviceAssetAttach,
  version: '3.1.0+1',
);

int _deviceAssetEstimateSize(
  DeviceAsset object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.hash.length;
  bytesCount += 3 + object.id.length * 3;
  return bytesCount;
}

void _deviceAssetSerialize(
  DeviceAsset object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeByte(offsets[0], object.backupSelection.index);
  writer.writeByteList(offsets[1], object.hash);
  writer.writeString(offsets[2], object.id);
}

DeviceAsset _deviceAssetDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = DeviceAsset(
    backupSelection: _DeviceAssetbackupSelectionValueEnumMap[
            reader.readByteOrNull(offsets[0])] ??
        BackupSelection.none,
    hash: reader.readByteList(offsets[1]) ?? [],
    id: reader.readString(offsets[2]),
  );
  return object;
}

P _deviceAssetDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (_DeviceAssetbackupSelectionValueEnumMap[
              reader.readByteOrNull(offset)] ??
          BackupSelection.none) as P;
    case 1:
      return (reader.readByteList(offset) ?? []) as P;
    case 2:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _DeviceAssetbackupSelectionEnumValueMap = {
  'none': 0,
  'select': 1,
  'exclude': 2,
};
const _DeviceAssetbackupSelectionValueEnumMap = {
  0: BackupSelection.none,
  1: BackupSelection.select,
  2: BackupSelection.exclude,
};

Id _deviceAssetGetId(DeviceAsset object) {
  return object.isarId;
}

List<IsarLinkBase<dynamic>> _deviceAssetGetLinks(DeviceAsset object) {
  return [];
}

void _deviceAssetAttach(
    IsarCollection<dynamic> col, Id id, DeviceAsset object) {}

extension DeviceAssetByIndex on IsarCollection<DeviceAsset> {
  Future<DeviceAsset?> getById(String id) {
    return getByIndex(r'id', [id]);
  }

  DeviceAsset? getByIdSync(String id) {
    return getByIndexSync(r'id', [id]);
  }

  Future<bool> deleteById(String id) {
    return deleteByIndex(r'id', [id]);
  }

  bool deleteByIdSync(String id) {
    return deleteByIndexSync(r'id', [id]);
  }

  Future<List<DeviceAsset?>> getAllById(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return getAllByIndex(r'id', values);
  }

  List<DeviceAsset?> getAllByIdSync(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'id', values);
  }

  Future<int> deleteAllById(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'id', values);
  }

  int deleteAllByIdSync(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'id', values);
  }

  Future<Id> putById(DeviceAsset object) {
    return putByIndex(r'id', object);
  }

  Id putByIdSync(DeviceAsset object, {bool saveLinks = true}) {
    return putByIndexSync(r'id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllById(List<DeviceAsset> objects) {
    return putAllByIndex(r'id', objects);
  }

  List<Id> putAllByIdSync(List<DeviceAsset> objects, {bool saveLinks = true}) {
    return putAllByIndexSync(r'id', objects, saveLinks: saveLinks);
  }
}

extension DeviceAssetQueryWhereSort
    on QueryBuilder<DeviceAsset, DeviceAsset, QWhere> {
  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhere> anyIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension DeviceAssetQueryWhere
    on QueryBuilder<DeviceAsset, DeviceAsset, QWhereClause> {
  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> isarIdEqualTo(
      Id isarId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: isarId,
        upper: isarId,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> isarIdNotEqualTo(
      Id isarId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: isarId, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: isarId, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: isarId, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: isarId, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> isarIdGreaterThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: isarId, includeLower: include),
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> isarIdLessThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: isarId, includeUpper: include),
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> isarIdBetween(
    Id lowerIsarId,
    Id upperIsarId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerIsarId,
        includeLower: includeLower,
        upper: upperIsarId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> idEqualTo(
      String id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'id',
        value: [id],
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> idNotEqualTo(
      String id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'id',
              lower: [],
              upper: [id],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'id',
              lower: [id],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'id',
              lower: [id],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'id',
              lower: [],
              upper: [id],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> hashEqualTo(
      List<int> hash) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'hash',
        value: [hash],
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterWhereClause> hashNotEqualTo(
      List<int> hash) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'hash',
              lower: [],
              upper: [hash],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'hash',
              lower: [hash],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'hash',
              lower: [hash],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'hash',
              lower: [],
              upper: [hash],
              includeUpper: false,
            ));
      }
    });
  }
}

extension DeviceAssetQueryFilter
    on QueryBuilder<DeviceAsset, DeviceAsset, QFilterCondition> {
  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      backupSelectionEqualTo(BackupSelection value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'backupSelection',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      backupSelectionGreaterThan(
    BackupSelection value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'backupSelection',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      backupSelectionLessThan(
    BackupSelection value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'backupSelection',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      backupSelectionBetween(
    BackupSelection lower,
    BackupSelection upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'backupSelection',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashElementEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'hash',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashElementGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'hash',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashElementLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'hash',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashElementBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'hash',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'hash',
        length,
        true,
        length,
        true,
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> hashIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'hash',
        0,
        true,
        0,
        true,
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'hash',
        0,
        false,
        999999,
        true,
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'hash',
        0,
        true,
        length,
        include,
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'hash',
        length,
        include,
        999999,
        true,
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      hashLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'hash',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'id',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> idIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> isarIdEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition>
      isarIdGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> isarIdLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterFilterCondition> isarIdBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'isarId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension DeviceAssetQueryObject
    on QueryBuilder<DeviceAsset, DeviceAsset, QFilterCondition> {}

extension DeviceAssetQueryLinks
    on QueryBuilder<DeviceAsset, DeviceAsset, QFilterCondition> {}

extension DeviceAssetQuerySortBy
    on QueryBuilder<DeviceAsset, DeviceAsset, QSortBy> {
  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> sortByBackupSelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.asc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy>
      sortByBackupSelectionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.desc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> sortById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> sortByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }
}

extension DeviceAssetQuerySortThenBy
    on QueryBuilder<DeviceAsset, DeviceAsset, QSortThenBy> {
  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> thenByBackupSelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.asc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy>
      thenByBackupSelectionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.desc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> thenByIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.asc);
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QAfterSortBy> thenByIsarIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.desc);
    });
  }
}

extension DeviceAssetQueryWhereDistinct
    on QueryBuilder<DeviceAsset, DeviceAsset, QDistinct> {
  QueryBuilder<DeviceAsset, DeviceAsset, QDistinct>
      distinctByBackupSelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'backupSelection');
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QDistinct> distinctByHash() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'hash');
    });
  }

  QueryBuilder<DeviceAsset, DeviceAsset, QDistinct> distinctById(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'id', caseSensitive: caseSensitive);
    });
  }
}

extension DeviceAssetQueryProperty
    on QueryBuilder<DeviceAsset, DeviceAsset, QQueryProperty> {
  QueryBuilder<DeviceAsset, int, QQueryOperations> isarIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isarId');
    });
  }

  QueryBuilder<DeviceAsset, BackupSelection, QQueryOperations>
      backupSelectionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'backupSelection');
    });
  }

  QueryBuilder<DeviceAsset, List<int>, QQueryOperations> hashProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'hash');
    });
  }

  QueryBuilder<DeviceAsset, String, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }
}
