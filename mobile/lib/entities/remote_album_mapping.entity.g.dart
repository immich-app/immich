// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'remote_album_mapping.entity.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetRemoteAlbumMappingCollection on Isar {
  IsarCollection<RemoteAlbumMapping> get remoteAlbumMappings =>
      this.collection();
}

const RemoteAlbumMappingSchema = CollectionSchema(
  name: r'RemoteAlbumMapping',
  id: -1351040990048458851,
  properties: {
    r'localAlbumMappingId': PropertySchema(
      id: 0,
      name: r'localAlbumMappingId',
      type: IsarType.string,
    ),
    r'remoteAlbumMappingId': PropertySchema(
      id: 1,
      name: r'remoteAlbumMappingId',
      type: IsarType.string,
    )
  },
  estimateSize: _remoteAlbumMappingEstimateSize,
  serialize: _remoteAlbumMappingSerialize,
  deserialize: _remoteAlbumMappingDeserialize,
  deserializeProp: _remoteAlbumMappingDeserializeProp,
  idName: r'id',
  indexes: {
    r'localAlbumMappingId': IndexSchema(
      id: -3436349769577783964,
      name: r'localAlbumMappingId',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'localAlbumMappingId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _remoteAlbumMappingGetId,
  getLinks: _remoteAlbumMappingGetLinks,
  attach: _remoteAlbumMappingAttach,
  version: '3.1.0+1',
);

int _remoteAlbumMappingEstimateSize(
  RemoteAlbumMapping object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.localAlbumMappingId.length * 3;
  {
    final value = object.remoteAlbumMappingId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _remoteAlbumMappingSerialize(
  RemoteAlbumMapping object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.localAlbumMappingId);
  writer.writeString(offsets[1], object.remoteAlbumMappingId);
}

RemoteAlbumMapping _remoteAlbumMappingDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = RemoteAlbumMapping(
    localAlbumMappingId: reader.readString(offsets[0]),
    remoteAlbumMappingId: reader.readStringOrNull(offsets[1]),
  );
  return object;
}

P _remoteAlbumMappingDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readStringOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _remoteAlbumMappingGetId(RemoteAlbumMapping object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _remoteAlbumMappingGetLinks(
    RemoteAlbumMapping object) {
  return [];
}

void _remoteAlbumMappingAttach(
    IsarCollection<dynamic> col, Id id, RemoteAlbumMapping object) {}

extension RemoteAlbumMappingByIndex on IsarCollection<RemoteAlbumMapping> {
  Future<RemoteAlbumMapping?> getByLocalAlbumMappingId(
      String localAlbumMappingId) {
    return getByIndex(r'localAlbumMappingId', [localAlbumMappingId]);
  }

  RemoteAlbumMapping? getByLocalAlbumMappingIdSync(String localAlbumMappingId) {
    return getByIndexSync(r'localAlbumMappingId', [localAlbumMappingId]);
  }

  Future<bool> deleteByLocalAlbumMappingId(String localAlbumMappingId) {
    return deleteByIndex(r'localAlbumMappingId', [localAlbumMappingId]);
  }

  bool deleteByLocalAlbumMappingIdSync(String localAlbumMappingId) {
    return deleteByIndexSync(r'localAlbumMappingId', [localAlbumMappingId]);
  }

  Future<List<RemoteAlbumMapping?>> getAllByLocalAlbumMappingId(
      List<String> localAlbumMappingIdValues) {
    final values = localAlbumMappingIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'localAlbumMappingId', values);
  }

  List<RemoteAlbumMapping?> getAllByLocalAlbumMappingIdSync(
      List<String> localAlbumMappingIdValues) {
    final values = localAlbumMappingIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'localAlbumMappingId', values);
  }

  Future<int> deleteAllByLocalAlbumMappingId(
      List<String> localAlbumMappingIdValues) {
    final values = localAlbumMappingIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'localAlbumMappingId', values);
  }

  int deleteAllByLocalAlbumMappingIdSync(
      List<String> localAlbumMappingIdValues) {
    final values = localAlbumMappingIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'localAlbumMappingId', values);
  }

  Future<Id> putByLocalAlbumMappingId(RemoteAlbumMapping object) {
    return putByIndex(r'localAlbumMappingId', object);
  }

  Id putByLocalAlbumMappingIdSync(RemoteAlbumMapping object,
      {bool saveLinks = true}) {
    return putByIndexSync(r'localAlbumMappingId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByLocalAlbumMappingId(
      List<RemoteAlbumMapping> objects) {
    return putAllByIndex(r'localAlbumMappingId', objects);
  }

  List<Id> putAllByLocalAlbumMappingIdSync(List<RemoteAlbumMapping> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'localAlbumMappingId', objects,
        saveLinks: saveLinks);
  }
}

extension RemoteAlbumMappingQueryWhereSort
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QWhere> {
  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension RemoteAlbumMappingQueryWhere
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QWhereClause> {
  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      idNotEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      localAlbumMappingIdEqualTo(String localAlbumMappingId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'localAlbumMappingId',
        value: [localAlbumMappingId],
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterWhereClause>
      localAlbumMappingIdNotEqualTo(String localAlbumMappingId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'localAlbumMappingId',
              lower: [],
              upper: [localAlbumMappingId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'localAlbumMappingId',
              lower: [localAlbumMappingId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'localAlbumMappingId',
              lower: [localAlbumMappingId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'localAlbumMappingId',
              lower: [],
              upper: [localAlbumMappingId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension RemoteAlbumMappingQueryFilter
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QFilterCondition> {
  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'localAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'localAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'localAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'localAlbumMappingId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'localAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'localAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'localAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'localAlbumMappingId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'localAlbumMappingId',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      localAlbumMappingIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'localAlbumMappingId',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'remoteAlbumMappingId',
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'remoteAlbumMappingId',
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'remoteAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'remoteAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'remoteAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'remoteAlbumMappingId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'remoteAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'remoteAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'remoteAlbumMappingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'remoteAlbumMappingId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'remoteAlbumMappingId',
        value: '',
      ));
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterFilterCondition>
      remoteAlbumMappingIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'remoteAlbumMappingId',
        value: '',
      ));
    });
  }
}

extension RemoteAlbumMappingQueryObject
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QFilterCondition> {}

extension RemoteAlbumMappingQueryLinks
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QFilterCondition> {}

extension RemoteAlbumMappingQuerySortBy
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QSortBy> {
  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      sortByLocalAlbumMappingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localAlbumMappingId', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      sortByLocalAlbumMappingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localAlbumMappingId', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      sortByRemoteAlbumMappingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteAlbumMappingId', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      sortByRemoteAlbumMappingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteAlbumMappingId', Sort.desc);
    });
  }
}

extension RemoteAlbumMappingQuerySortThenBy
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QSortThenBy> {
  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      thenByLocalAlbumMappingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localAlbumMappingId', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      thenByLocalAlbumMappingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localAlbumMappingId', Sort.desc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      thenByRemoteAlbumMappingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteAlbumMappingId', Sort.asc);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QAfterSortBy>
      thenByRemoteAlbumMappingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteAlbumMappingId', Sort.desc);
    });
  }
}

extension RemoteAlbumMappingQueryWhereDistinct
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QDistinct> {
  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QDistinct>
      distinctByLocalAlbumMappingId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'localAlbumMappingId',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QDistinct>
      distinctByRemoteAlbumMappingId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'remoteAlbumMappingId',
          caseSensitive: caseSensitive);
    });
  }
}

extension RemoteAlbumMappingQueryProperty
    on QueryBuilder<RemoteAlbumMapping, RemoteAlbumMapping, QQueryProperty> {
  QueryBuilder<RemoteAlbumMapping, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<RemoteAlbumMapping, String, QQueryOperations>
      localAlbumMappingIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'localAlbumMappingId');
    });
  }

  QueryBuilder<RemoteAlbumMapping, String?, QQueryOperations>
      remoteAlbumMappingIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'remoteAlbumMappingId');
    });
  }
}
