// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stack.entity.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetStackCollection on Isar {
  IsarCollection<Stack> get stacks => this.collection();
}

const StackSchema = CollectionSchema(
  name: r'Stack',
  id: -6395708129618985677,
  properties: {
    r'assetCount': PropertySchema(
      id: 0,
      name: r'assetCount',
      type: IsarType.long,
    ),
    r'id': PropertySchema(
      id: 1,
      name: r'id',
      type: IsarType.string,
    ),
    r'primaryAssetId': PropertySchema(
      id: 2,
      name: r'primaryAssetId',
      type: IsarType.string,
    )
  },
  estimateSize: _stackEstimateSize,
  serialize: _stackSerialize,
  deserialize: _stackDeserialize,
  deserializeProp: _stackDeserializeProp,
  idName: r'isarId',
  indexes: {
    r'id': IndexSchema(
      id: -3268401673993471357,
      name: r'id',
      unique: true,
      replace: false,
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
    r'assets': LinkSchema(
      id: 3280079395615349389,
      name: r'assets',
      target: r'Asset',
      single: false,
    )
  },
  embeddedSchemas: {},
  getId: _stackGetId,
  getLinks: _stackGetLinks,
  attach: _stackAttach,
  version: '3.1.0+1',
);

int _stackEstimateSize(
  Stack object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.id.length * 3;
  bytesCount += 3 + object.primaryAssetId.length * 3;
  return bytesCount;
}

void _stackSerialize(
  Stack object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.assetCount);
  writer.writeString(offsets[1], object.id);
  writer.writeString(offsets[2], object.primaryAssetId);
}

Stack _stackDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = Stack(
    assetCount: reader.readLong(offsets[0]),
    id: reader.readString(offsets[1]),
    primaryAssetId: reader.readString(offsets[2]),
  );
  return object;
}

P _stackDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readLong(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _stackGetId(Stack object) {
  return object.isarId;
}

List<IsarLinkBase<dynamic>> _stackGetLinks(Stack object) {
  return [object.assets];
}

void _stackAttach(IsarCollection<dynamic> col, Id id, Stack object) {
  object.assets.attach(col, col.isar.collection<Asset>(), r'assets', id);
}

extension StackByIndex on IsarCollection<Stack> {
  Future<Stack?> getById(String id) {
    return getByIndex(r'id', [id]);
  }

  Stack? getByIdSync(String id) {
    return getByIndexSync(r'id', [id]);
  }

  Future<bool> deleteById(String id) {
    return deleteByIndex(r'id', [id]);
  }

  bool deleteByIdSync(String id) {
    return deleteByIndexSync(r'id', [id]);
  }

  Future<List<Stack?>> getAllById(List<String> idValues) {
    final values = idValues.map((e) => [e]).toList();
    return getAllByIndex(r'id', values);
  }

  List<Stack?> getAllByIdSync(List<String> idValues) {
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

  Future<Id> putById(Stack object) {
    return putByIndex(r'id', object);
  }

  Id putByIdSync(Stack object, {bool saveLinks = true}) {
    return putByIndexSync(r'id', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllById(List<Stack> objects) {
    return putAllByIndex(r'id', objects);
  }

  List<Id> putAllByIdSync(List<Stack> objects, {bool saveLinks = true}) {
    return putAllByIndexSync(r'id', objects, saveLinks: saveLinks);
  }
}

extension StackQueryWhereSort on QueryBuilder<Stack, Stack, QWhere> {
  QueryBuilder<Stack, Stack, QAfterWhere> anyIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension StackQueryWhere on QueryBuilder<Stack, Stack, QWhereClause> {
  QueryBuilder<Stack, Stack, QAfterWhereClause> isarIdEqualTo(Id isarId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: isarId,
        upper: isarId,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterWhereClause> isarIdNotEqualTo(Id isarId) {
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

  QueryBuilder<Stack, Stack, QAfterWhereClause> isarIdGreaterThan(Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: isarId, includeLower: include),
      );
    });
  }

  QueryBuilder<Stack, Stack, QAfterWhereClause> isarIdLessThan(Id isarId,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: isarId, includeUpper: include),
      );
    });
  }

  QueryBuilder<Stack, Stack, QAfterWhereClause> isarIdBetween(
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

  QueryBuilder<Stack, Stack, QAfterWhereClause> idEqualTo(String id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'id',
        value: [id],
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterWhereClause> idNotEqualTo(String id) {
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

extension StackQueryFilter on QueryBuilder<Stack, Stack, QFilterCondition> {
  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetCountEqualTo(
      int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'assetCount',
        value: value,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetCountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'assetCount',
        value: value,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'assetCount',
        value: value,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'assetCount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idEqualTo(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idBetween(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idStartsWith(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idEndsWith(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idContains(String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'id',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idMatches(String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'id',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> idIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'id',
        value: '',
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> isarIdEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isarId',
        value: value,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> isarIdGreaterThan(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> isarIdLessThan(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> isarIdBetween(
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

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'primaryAssetId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'primaryAssetId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'primaryAssetId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'primaryAssetId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'primaryAssetId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'primaryAssetId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'primaryAssetId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'primaryAssetId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'primaryAssetId',
        value: '',
      ));
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> primaryAssetIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'primaryAssetId',
        value: '',
      ));
    });
  }
}

extension StackQueryObject on QueryBuilder<Stack, Stack, QFilterCondition> {}

extension StackQueryLinks on QueryBuilder<Stack, Stack, QFilterCondition> {
  QueryBuilder<Stack, Stack, QAfterFilterCondition> assets(
      FilterQuery<Asset> q) {
    return QueryBuilder.apply(this, (query) {
      return query.link(q, r'assets');
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetsLengthEqualTo(
      int length) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', length, true, length, true);
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, true, 0, true);
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, false, 999999, true);
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetsLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', 0, true, length, include);
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetsLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.linkLength(r'assets', length, include, 999999, true);
    });
  }

  QueryBuilder<Stack, Stack, QAfterFilterCondition> assetsLengthBetween(
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

extension StackQuerySortBy on QueryBuilder<Stack, Stack, QSortBy> {
  QueryBuilder<Stack, Stack, QAfterSortBy> sortByAssetCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'assetCount', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> sortByAssetCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'assetCount', Sort.desc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> sortById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> sortByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> sortByPrimaryAssetId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'primaryAssetId', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> sortByPrimaryAssetIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'primaryAssetId', Sort.desc);
    });
  }
}

extension StackQuerySortThenBy on QueryBuilder<Stack, Stack, QSortThenBy> {
  QueryBuilder<Stack, Stack, QAfterSortBy> thenByAssetCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'assetCount', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenByAssetCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'assetCount', Sort.desc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenByIsarId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenByIsarIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isarId', Sort.desc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenByPrimaryAssetId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'primaryAssetId', Sort.asc);
    });
  }

  QueryBuilder<Stack, Stack, QAfterSortBy> thenByPrimaryAssetIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'primaryAssetId', Sort.desc);
    });
  }
}

extension StackQueryWhereDistinct on QueryBuilder<Stack, Stack, QDistinct> {
  QueryBuilder<Stack, Stack, QDistinct> distinctByAssetCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'assetCount');
    });
  }

  QueryBuilder<Stack, Stack, QDistinct> distinctById(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'id', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<Stack, Stack, QDistinct> distinctByPrimaryAssetId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'primaryAssetId',
          caseSensitive: caseSensitive);
    });
  }
}

extension StackQueryProperty on QueryBuilder<Stack, Stack, QQueryProperty> {
  QueryBuilder<Stack, int, QQueryOperations> isarIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isarId');
    });
  }

  QueryBuilder<Stack, int, QQueryOperations> assetCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'assetCount');
    });
  }

  QueryBuilder<Stack, String, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<Stack, String, QQueryOperations> primaryAssetIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'primaryAssetId');
    });
  }
}
