// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album.model.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetLocalAlbumCollection on Isar {
  IsarCollection<LocalAlbum> get localAlbums => this.collection();
}

const LocalAlbumSchema = CollectionSchema(
  name: r'LocalAlbum',
  id: -6998504736398460068,
  properties: {
    r'backupSelection': PropertySchema(
      id: 0,
      name: r'backupSelection',
      type: IsarType.byte,
      enumMap: _LocalAlbumbackupSelectionEnumValueMap,
    ),
    r'id': PropertySchema(
      id: 1,
      name: r'id',
      type: IsarType.string,
    ),
    r'lastBackup': PropertySchema(
      id: 2,
      name: r'lastBackup',
      type: IsarType.dateTime,
    ),
    r'modifiedAt': PropertySchema(
      id: 3,
      name: r'modifiedAt',
      type: IsarType.dateTime,
    ),
    r'name': PropertySchema(
      id: 4,
      name: r'name',
      type: IsarType.string,
    )
  },
  estimateSize: _localAlbumEstimateSize,
  serialize: _localAlbumSerialize,
  deserialize: _localAlbumDeserialize,
  deserializeProp: _localAlbumDeserializeProp,
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
    )
  },
  links: {
    r'thumb': LinkSchema(
      id: 5843495776199463484,
      name: r'thumb',
      target: r'Asset',
      single: true,
    ),
    r'assets': LinkSchema(
      id: -5720977241952340499,
      name: r'assets',
      target: r'Asset',
      single: false,
    )
  },
  embeddedSchemas: {},
  getId: _localAlbumGetId,
  getLinks: _localAlbumGetLinks,
  attach: _localAlbumAttach,
  version: '3.1.0+1',
);

int _localAlbumEstimateSize(
  LocalAlbum object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.id.length * 3;
  bytesCount += 3 + object.name.length * 3;
  return bytesCount;
}

void _localAlbumSerialize(
  LocalAlbum object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeByte(offsets[0], object.backupSelection.index);
  writer.writeString(offsets[1], object.id);
  writer.writeDateTime(offsets[2], object.lastBackup);
  writer.writeDateTime(offsets[3], object.modifiedAt);
  writer.writeString(offsets[4], object.name);
}

LocalAlbum _localAlbumDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = LocalAlbum(
    backupSelection: _LocalAlbumbackupSelectionValueEnumMap[
            reader.readByteOrNull(offsets[0])] ??
        BackupSelection.none,
    id: reader.readString(offsets[1]),
    lastBackup: reader.readDateTime(offsets[2]),
    modifiedAt: reader.readDateTime(offsets[3]),
    name: reader.readString(offsets[4]),
  );
  return object;
}

P _localAlbumDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (_LocalAlbumbackupSelectionValueEnumMap[
              reader.readByteOrNull(offset)] ??
          BackupSelection.none) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readDateTime(offset)) as P;
    case 3:
      return (reader.readDateTime(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _LocalAlbumbackupSelectionEnumValueMap = {
  'none': 0,
  'select': 1,
  'exclude': 2,
};
const _LocalAlbumbackupSelectionValueEnumMap = {
  0: BackupSelection.none,
  1: BackupSelection.select,
  2: BackupSelection.exclude,
};

Id _localAlbumGetId(LocalAlbum object) {
  return object.isarId;
}

List<IsarLinkBase<dynamic>> _localAlbumGetLinks(LocalAlbum object) {
  return [object.thumb, object.assets];
}

void _localAlbumAttach(IsarCollection<dynamic> col, Id id, LocalAlbum object) {
  object.thumb.attach(col, col.isar.collection<Asset>(), r'thumb', id);
  object.assets.attach(col, col.isar.collection<Asset>(), r'assets', id);
}

extension LocalAlbumByIndex on IsarCollection<LocalAlbum> {
  Future<LocalAlbum?> getById(String id) {
    return getByIndex(r'id', [id]);
  }

  LocalAlbum? getByIdSync(String id) {
    return getByIndexSync(r'id', [id]);
  }

  Future<bool> deleteById(String id) {
    return deleteByIndex(r'id', [id]);
  }

  bool deleteByIdSync(String id) {
    return deleteByIndexSync(r'id', [id]);
  }

  Future<List<LocalAlbum?>> getAllById(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return getAllByIndex(r'id', values);
  }

  List<LocalAlbum?> getAllByIdSync(List<String> idValues) {
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

  Future<Id> putById(LocalAlbum object) {
    return putByIndex(r'id', object);
  }

  Id putByIdSync(LocalAlbum object, {bool saveLinks = true}) {
    return putByIndexSync(r'id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllById(List<LocalAlbum> objects) {
    return putAllByIndex(r'id', objects);
  }

  List<Id> putAllByIdSync(List<LocalAlbum> objects, {bool saveLinks = true}) {
    return putAllByIndexSync(r'id', objects, saveLinks: saveLinks);
  }
}

extension LocalAlbumQueryWhereSort
    on QueryBuilder<LocalAlbum, LocalAlbum, QWhere> {
  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhere> anyIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension LocalAlbumQueryWhere
    on QueryBuilder<LocalAlbum, LocalAlbum, QWhereClause> {
  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> isarIdEqualTo(
      Id isarId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: isarId,
        upper: isarId,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> isarIdNotEqualTo(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> isarIdGreaterThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: isarId, includeLower: include),
      );
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> isarIdLessThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: isarId, includeUpper: include),
      );
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> isarIdBetween(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> idEqualTo(String id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'id',
        value: [id],
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterWhereClause> idNotEqualTo(
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
}

extension LocalAlbumQueryFilter
    on QueryBuilder<LocalAlbum, LocalAlbum, QFilterCondition> {
  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      backupSelectionEqualTo(BackupSelection value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'backupSelection',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idEqualTo(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idBetween(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idStartsWith(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idEndsWith(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idContains(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idMatches(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> idIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> isarIdEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> isarIdGreaterThan(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> isarIdLessThan(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> isarIdBetween(
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

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> lastBackupEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastBackup',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      lastBackupGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lastBackup',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      lastBackupLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lastBackup',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> lastBackupBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lastBackup',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> modifiedAtEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'modifiedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      modifiedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'modifiedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      modifiedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'modifiedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> modifiedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'modifiedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'name',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'name',
        value: '',
      ));
    });
  }
}

extension LocalAlbumQueryObject
    on QueryBuilder<LocalAlbum, LocalAlbum, QFilterCondition> {}

extension LocalAlbumQueryLinks
    on QueryBuilder<LocalAlbum, LocalAlbum, QFilterCondition> {
  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> thumb(
      FilterQuery<Asset> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'thumb');
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> thumbIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'thumb', 0, true, 0, true);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> assets(
      FilterQuery<Asset> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'assets');
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      assetsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', length, true, length, true);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition> assetsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, true, 0, true);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      assetsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, false, 999999, true);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      assetsLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, true, length, include);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      assetsLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', length, include, 999999, true);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterFilterCondition>
      assetsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(
          r'assets', lower, includeLower, upper, includeUpper);
    });
  }
}

extension LocalAlbumQuerySortBy
    on QueryBuilder<LocalAlbum, LocalAlbum, QSortBy> {
  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByBackupSelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy>
      sortByBackupSelectionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByLastBackup() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByLastBackupDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByModifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByModifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }
}

extension LocalAlbumQuerySortThenBy
    on QueryBuilder<LocalAlbum, LocalAlbum, QSortThenBy> {
  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByBackupSelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy>
      thenByBackupSelectionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'backupSelection', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByIsarIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByLastBackup() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByLastBackupDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByModifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByModifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.desc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QAfterSortBy> thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }
}

extension LocalAlbumQueryWhereDistinct
    on QueryBuilder<LocalAlbum, LocalAlbum, QDistinct> {
  QueryBuilder<LocalAlbum, LocalAlbum, QDistinct> distinctByBackupSelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'backupSelection');
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QDistinct> distinctById(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'id', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QDistinct> distinctByLastBackup() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastBackup');
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QDistinct> distinctByModifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'modifiedAt');
    });
  }

  QueryBuilder<LocalAlbum, LocalAlbum, QDistinct> distinctByName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }
}

extension LocalAlbumQueryProperty
    on QueryBuilder<LocalAlbum, LocalAlbum, QQueryProperty> {
  QueryBuilder<LocalAlbum, int, QQueryOperations> isarIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isarId');
    });
  }

  QueryBuilder<LocalAlbum, BackupSelection, QQueryOperations>
      backupSelectionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'backupSelection');
    });
  }

  QueryBuilder<LocalAlbum, String, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<LocalAlbum, DateTime, QQueryOperations> lastBackupProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastBackup');
    });
  }

  QueryBuilder<LocalAlbum, DateTime, QQueryOperations> modifiedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'modifiedAt');
    });
  }

  QueryBuilder<LocalAlbum, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }
}

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetRemoteAlbumCollection on Isar {
  IsarCollection<RemoteAlbum> get remoteAlbums => this.collection();
}

const RemoteAlbumSchema = CollectionSchema(
  name: r'RemoteAlbum',
  id: 4836094642828974178,
  properties: {
    r'activityEnabled': PropertySchema(
      id: 0,
      name: r'activityEnabled',
      type: IsarType.bool,
    ),
    r'createdAt': PropertySchema(
      id: 1,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'endDate': PropertySchema(
      id: 2,
      name: r'endDate',
      type: IsarType.dateTime,
    ),
    r'hashCode': PropertySchema(
      id: 3,
      name: r'hashCode',
      type: IsarType.long,
    ),
    r'id': PropertySchema(
      id: 4,
      name: r'id',
      type: IsarType.string,
    ),
    r'lastModifiedAssetTimestamp': PropertySchema(
      id: 5,
      name: r'lastModifiedAssetTimestamp',
      type: IsarType.dateTime,
    ),
    r'modifiedAt': PropertySchema(
      id: 6,
      name: r'modifiedAt',
      type: IsarType.dateTime,
    ),
    r'name': PropertySchema(
      id: 7,
      name: r'name',
      type: IsarType.string,
    ),
    r'shared': PropertySchema(
      id: 8,
      name: r'shared',
      type: IsarType.bool,
    ),
    r'startDate': PropertySchema(
      id: 9,
      name: r'startDate',
      type: IsarType.dateTime,
    )
  },
  estimateSize: _remoteAlbumEstimateSize,
  serialize: _remoteAlbumSerialize,
  deserialize: _remoteAlbumDeserialize,
  deserializeProp: _remoteAlbumDeserializeProp,
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
    )
  },
  links: {
    r'owner': LinkSchema(
      id: 2462730155249158472,
      name: r'owner',
      target: r'User',
      single: true,
    ),
    r'sharedUsers': LinkSchema(
      id: 479557844317524871,
      name: r'sharedUsers',
      target: r'User',
      single: false,
    ),
    r'thumb': LinkSchema(
      id: -5308933511776214733,
      name: r'thumb',
      target: r'Asset',
      single: true,
    ),
    r'assets': LinkSchema(
      id: 9093953170930700094,
      name: r'assets',
      target: r'Asset',
      single: false,
    )
  },
  embeddedSchemas: {},
  getId: _remoteAlbumGetId,
  getLinks: _remoteAlbumGetLinks,
  attach: _remoteAlbumAttach,
  version: '3.1.0+1',
);

int _remoteAlbumEstimateSize(
  RemoteAlbum object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.id.length * 3;
  bytesCount += 3 + object.name.length * 3;
  return bytesCount;
}

void _remoteAlbumSerialize(
  RemoteAlbum object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeBool(offsets[0], object.activityEnabled);
  writer.writeDateTime(offsets[1], object.createdAt);
  writer.writeDateTime(offsets[2], object.endDate);
  writer.writeLong(offsets[3], object.hashCode);
  writer.writeString(offsets[4], object.id);
  writer.writeDateTime(offsets[5], object.lastModifiedAssetTimestamp);
  writer.writeDateTime(offsets[6], object.modifiedAt);
  writer.writeString(offsets[7], object.name);
  writer.writeBool(offsets[8], object.shared);
  writer.writeDateTime(offsets[9], object.startDate);
}

RemoteAlbum _remoteAlbumDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = RemoteAlbum(
    activityEnabled: reader.readBoolOrNull(offsets[0]) ?? true,
    createdAt: reader.readDateTime(offsets[1]),
    endDate: reader.readDateTimeOrNull(offsets[2]),
    id: reader.readString(offsets[4]),
    lastModifiedAssetTimestamp: reader.readDateTimeOrNull(offsets[5]),
    modifiedAt: reader.readDateTime(offsets[6]),
    name: reader.readString(offsets[7]),
    shared: reader.readBoolOrNull(offsets[8]) ?? false,
    startDate: reader.readDateTimeOrNull(offsets[9]),
  );
  return object;
}

P _remoteAlbumDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readBoolOrNull(offset) ?? true) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 3:
      return (reader.readLong(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 6:
      return (reader.readDateTime(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readBoolOrNull(offset) ?? false) as P;
    case 9:
      return (reader.readDateTimeOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _remoteAlbumGetId(RemoteAlbum object) {
  return object.isarId;
}

List<IsarLinkBase<dynamic>> _remoteAlbumGetLinks(RemoteAlbum object) {
  return [object.owner, object.sharedUsers, object.thumb, object.assets];
}

void _remoteAlbumAttach(
    IsarCollection<dynamic> col, Id id, RemoteAlbum object) {
  object.owner.attach(col, col.isar.collection<User>(), r'owner', id);
  object.sharedUsers
      .attach(col, col.isar.collection<User>(), r'sharedUsers', id);
  object.thumb.attach(col, col.isar.collection<Asset>(), r'thumb', id);
  object.assets.attach(col, col.isar.collection<Asset>(), r'assets', id);
}

extension RemoteAlbumByIndex on IsarCollection<RemoteAlbum> {
  Future<RemoteAlbum?> getById(String id) {
    return getByIndex(r'id', [id]);
  }

  RemoteAlbum? getByIdSync(String id) {
    return getByIndexSync(r'id', [id]);
  }

  Future<bool> deleteById(String id) {
    return deleteByIndex(r'id', [id]);
  }

  bool deleteByIdSync(String id) {
    return deleteByIndexSync(r'id', [id]);
  }

  Future<List<RemoteAlbum?>> getAllById(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return getAllByIndex(r'id', values);
  }

  List<RemoteAlbum?> getAllByIdSync(List<String> idValues) {
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

  Future<Id> putById(RemoteAlbum object) {
    return putByIndex(r'id', object);
  }

  Id putByIdSync(RemoteAlbum object, {bool saveLinks = true}) {
    return putByIndexSync(r'id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllById(List<RemoteAlbum> objects) {
    return putAllByIndex(r'id', objects);
  }

  List<Id> putAllByIdSync(List<RemoteAlbum> objects, {bool saveLinks = true}) {
    return putAllByIndexSync(r'id', objects, saveLinks: saveLinks);
  }
}

extension RemoteAlbumQueryWhereSort
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QWhere> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhere> anyIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension RemoteAlbumQueryWhere
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QWhereClause> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> isarIdEqualTo(
      Id isarId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: isarId,
        upper: isarId,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> isarIdNotEqualTo(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> isarIdGreaterThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: isarId, includeLower: include),
      );
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> isarIdLessThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: isarId, includeUpper: include),
      );
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> isarIdBetween(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> idEqualTo(
      String id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'id',
        value: [id],
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterWhereClause> idNotEqualTo(
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
}

extension RemoteAlbumQueryFilter
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QFilterCondition> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      activityEnabledEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'activityEnabled',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      createdAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      createdAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      createdAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'createdAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      endDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'endDate',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      endDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'endDate',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> endDateEqualTo(
      DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'endDate',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      endDateGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'endDate',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> endDateLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'endDate',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> endDateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'endDate',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> hashCodeEqualTo(
      int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'hashCode',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      hashCodeGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'hashCode',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      hashCodeLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'hashCode',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> hashCodeBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'hashCode',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idEqualTo(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idBetween(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idStartsWith(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idEndsWith(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idContains(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idMatches(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> idIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> isarIdEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> isarIdLessThan(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> isarIdBetween(
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

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      lastModifiedAssetTimestampIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'lastModifiedAssetTimestamp',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      lastModifiedAssetTimestampIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'lastModifiedAssetTimestamp',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      lastModifiedAssetTimestampEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastModifiedAssetTimestamp',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      lastModifiedAssetTimestampGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lastModifiedAssetTimestamp',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      lastModifiedAssetTimestampLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lastModifiedAssetTimestamp',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      lastModifiedAssetTimestampBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lastModifiedAssetTimestamp',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      modifiedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'modifiedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      modifiedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'modifiedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      modifiedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'modifiedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      modifiedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'modifiedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'name',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> sharedEqualTo(
      bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'shared',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      startDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'startDate',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      startDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'startDate',
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      startDateEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'startDate',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      startDateGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'startDate',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      startDateLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'startDate',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      startDateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'startDate',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension RemoteAlbumQueryObject
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QFilterCondition> {}

extension RemoteAlbumQueryLinks
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QFilterCondition> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> owner(
      FilterQuery<User> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'owner');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> ownerIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'owner', 0, true, 0, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> sharedUsers(
      FilterQuery<User> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'sharedUsers');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      sharedUsersLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'sharedUsers', length, true, length, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      sharedUsersIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'sharedUsers', 0, true, 0, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      sharedUsersIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'sharedUsers', 0, false, 999999, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      sharedUsersLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'sharedUsers', 0, true, length, include);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      sharedUsersLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'sharedUsers', length, include, 999999, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      sharedUsersLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(
          r'sharedUsers', lower, includeLower, upper, includeUpper);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> thumb(
      FilterQuery<Asset> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'thumb');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> thumbIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'thumb', 0, true, 0, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition> assets(
      FilterQuery<Asset> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'assets');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      assetsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', length, true, length, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      assetsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, true, 0, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      assetsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, false, 999999, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      assetsLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, true, length, include);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      assetsLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', length, include, 999999, true);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterFilterCondition>
      assetsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(
          r'assets', lower, includeLower, upper, includeUpper);
    });
  }
}

extension RemoteAlbumQuerySortBy
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QSortBy> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByActivityEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'activityEnabled', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy>
      sortByActivityEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'activityEnabled', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByEndDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByEndDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByHashCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hashCode', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByHashCodeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hashCode', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy>
      sortByLastModifiedAssetTimestamp() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastModifiedAssetTimestamp', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy>
      sortByLastModifiedAssetTimestampDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastModifiedAssetTimestamp', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByModifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByModifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByShared() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'shared', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortBySharedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'shared', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByStartDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> sortByStartDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.desc);
    });
  }
}

extension RemoteAlbumQuerySortThenBy
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QSortThenBy> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByActivityEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'activityEnabled', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy>
      thenByActivityEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'activityEnabled', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByEndDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByEndDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByHashCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hashCode', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByHashCodeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hashCode', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByIsarIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy>
      thenByLastModifiedAssetTimestamp() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastModifiedAssetTimestamp', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy>
      thenByLastModifiedAssetTimestampDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastModifiedAssetTimestamp', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByModifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByModifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'modifiedAt', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByShared() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'shared', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenBySharedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'shared', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByStartDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QAfterSortBy> thenByStartDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.desc);
    });
  }
}

extension RemoteAlbumQueryWhereDistinct
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> {
  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct>
      distinctByActivityEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'activityEnabled');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByEndDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'endDate');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByHashCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'hashCode');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctById(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'id', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct>
      distinctByLastModifiedAssetTimestamp() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastModifiedAssetTimestamp');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByModifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'modifiedAt');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByShared() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'shared');
    });
  }

  QueryBuilder<RemoteAlbum, RemoteAlbum, QDistinct> distinctByStartDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'startDate');
    });
  }
}

extension RemoteAlbumQueryProperty
    on QueryBuilder<RemoteAlbum, RemoteAlbum, QQueryProperty> {
  QueryBuilder<RemoteAlbum, int, QQueryOperations> isarIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isarId');
    });
  }

  QueryBuilder<RemoteAlbum, bool, QQueryOperations> activityEnabledProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'activityEnabled');
    });
  }

  QueryBuilder<RemoteAlbum, DateTime, QQueryOperations> createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<RemoteAlbum, DateTime?, QQueryOperations> endDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'endDate');
    });
  }

  QueryBuilder<RemoteAlbum, int, QQueryOperations> hashCodeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'hashCode');
    });
  }

  QueryBuilder<RemoteAlbum, String, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<RemoteAlbum, DateTime?, QQueryOperations>
      lastModifiedAssetTimestampProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastModifiedAssetTimestamp');
    });
  }

  QueryBuilder<RemoteAlbum, DateTime, QQueryOperations> modifiedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'modifiedAt');
    });
  }

  QueryBuilder<RemoteAlbum, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }

  QueryBuilder<RemoteAlbum, bool, QQueryOperations> sharedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'shared');
    });
  }

  QueryBuilder<RemoteAlbum, DateTime?, QQueryOperations> startDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'startDate');
    });
  }
}
