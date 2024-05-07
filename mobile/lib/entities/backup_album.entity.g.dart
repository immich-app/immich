// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'backup_album.entity.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetBackupAlbumCollection on Isar {
  IsarCollection<BackupAlbum> get backupAlbums => this.collection();
}

const BackupAlbumSchema = CollectionSchema(
  name: r'BackupAlbum',
  id: 8308487201128361847,
  properties: {
    r'id': PropertySchema(
      id: 0,
      name: r'id',
      type: IsarType.string,
    ),
    r'lastBackup': PropertySchema(
      id: 1,
      name: r'lastBackup',
      type: IsarType.dateTime,
    ),
    r'selection': PropertySchema(
      id: 2,
      name: r'selection',
      type: IsarType.byte,
      enumMap: _BackupAlbumselectionEnumValueMap,
    )
  },
  estimateSize: _backupAlbumEstimateSize,
  serialize: _backupAlbumSerialize,
  deserialize: _backupAlbumDeserialize,
  deserializeProp: _backupAlbumDeserializeProp,
  idName: r'isarId',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _backupAlbumGetId,
  getLinks: _backupAlbumGetLinks,
  attach: _backupAlbumAttach,
  version: '3.1.0+1',
);

int _backupAlbumEstimateSize(
  BackupAlbum object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.id.length * 3;
  return bytesCount;
}

void _backupAlbumSerialize(
  BackupAlbum object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.id);
  writer.writeDateTime(offsets[1], object.lastBackup);
  writer.writeByte(offsets[2], object.selection.index);
}

BackupAlbum _backupAlbumDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = BackupAlbum(
    reader.readString(offsets[0]),
    reader.readDateTime(offsets[1]),
    _BackupAlbumselectionValueEnumMap[reader.readByteOrNull(offsets[2])] ??
        BackupSelection.none,
  );
  return object;
}

P _backupAlbumDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (_BackupAlbumselectionValueEnumMap[
              reader.readByteOrNull(offset)] ??
          BackupSelection.none) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _BackupAlbumselectionEnumValueMap = {
  'none': 0,
  'select': 1,
  'exclude': 2,
};
const _BackupAlbumselectionValueEnumMap = {
  0: BackupSelection.none,
  1: BackupSelection.select,
  2: BackupSelection.exclude,
};

Id _backupAlbumGetId(BackupAlbum object) {
  return object.isarId;
}

List<IsarLinkBase<dynamic>> _backupAlbumGetLinks(BackupAlbum object) {
  return [];
}

void _backupAlbumAttach(
    IsarCollection<dynamic> col, Id id, BackupAlbum object) {}

extension BackupAlbumQueryWhereSort
    on QueryBuilder<BackupAlbum, BackupAlbum, QWhere> {
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterWhere> anyIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension BackupAlbumQueryWhere
    on QueryBuilder<BackupAlbum, BackupAlbum, QWhereClause> {
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterWhereClause> isarIdEqualTo(
      Id isarId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: isarId,
        upper: isarId,
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterWhereClause> isarIdNotEqualTo(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterWhereClause> isarIdGreaterThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: isarId, includeLower: include),
      );
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterWhereClause> isarIdLessThan(
      Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: isarId, includeUpper: include),
      );
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterWhereClause> isarIdBetween(
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
}

extension BackupAlbumQueryFilter
    on QueryBuilder<BackupAlbum, BackupAlbum, QFilterCondition> {
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idEqualTo(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idBetween(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idStartsWith(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idEndsWith(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idContains(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idMatches(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> idIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> isarIdEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> isarIdLessThan(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition> isarIdBetween(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      lastBackupEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastBackup',
        value: value,
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      lastBackupBetween(
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

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      selectionEqualTo(BackupSelection value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'selection',
        value: value,
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      selectionGreaterThan(
    BackupSelection value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'selection',
        value: value,
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      selectionLessThan(
    BackupSelection value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'selection',
        value: value,
      ));
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      selectionBetween(
    BackupSelection lower,
    BackupSelection upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'selection',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension BackupAlbumQueryObject
    on QueryBuilder<BackupAlbum, BackupAlbum, QFilterCondition> {}

extension BackupAlbumQueryLinks
    on QueryBuilder<BackupAlbum, BackupAlbum, QFilterCondition> {}

extension BackupAlbumQuerySortBy
    on QueryBuilder<BackupAlbum, BackupAlbum, QSortBy> {
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> sortById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> sortByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> sortByLastBackup() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> sortByLastBackupDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.desc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> sortBySelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'selection', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> sortBySelectionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'selection', Sort.desc);
    });
  }
}

extension BackupAlbumQuerySortThenBy
    on QueryBuilder<BackupAlbum, BackupAlbum, QSortThenBy> {
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenByIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenByIsarIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.desc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenByLastBackup() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenByLastBackupDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastBackup', Sort.desc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenBySelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'selection', Sort.asc);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> thenBySelectionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'selection', Sort.desc);
    });
  }
}

extension BackupAlbumQueryWhereDistinct
    on QueryBuilder<BackupAlbum, BackupAlbum, QDistinct> {
  QueryBuilder<BackupAlbum, BackupAlbum, QDistinct> distinctById(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'id', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QDistinct> distinctByLastBackup() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastBackup');
    });
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QDistinct> distinctBySelection() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'selection');
    });
  }
}

extension BackupAlbumQueryProperty
    on QueryBuilder<BackupAlbum, BackupAlbum, QQueryProperty> {
  QueryBuilder<BackupAlbum, int, QQueryOperations> isarIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isarId');
    });
  }

  QueryBuilder<BackupAlbum, String, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<BackupAlbum, DateTime, QQueryOperations> lastBackupProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastBackup');
    });
  }

  QueryBuilder<BackupAlbum, BackupSelection, QQueryOperations>
      selectionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'selection');
    });
  }
}
