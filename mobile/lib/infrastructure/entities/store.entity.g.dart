// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'store.entity.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetStoreEntityCollection on Isar {
  IsarCollection<StoreEntity> get store => this.collection();
}

const StoreEntitySchema = CollectionSchema(
  name: r'StoreEntity',
  id: -8249385988561344385,
  properties: {
    r'intValue': PropertySchema(
      id: 0,
      name: r'intValue',
      type: IsarType.long,
    ),
    r'strValue': PropertySchema(
      id: 1,
      name: r'strValue',
      type: IsarType.string,
    )
  },
  estimateSize: _storeEntityEstimateSize,
  serialize: _storeEntitySerialize,
  deserialize: _storeEntityDeserialize,
  deserializeProp: _storeEntityDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _storeEntityGetId,
  getLinks: _storeEntityGetLinks,
  attach: _storeEntityAttach,
  version: '3.1.8',
);

int _storeEntityEstimateSize(
  StoreEntity object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.strValue;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _storeEntitySerialize(
  StoreEntity object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.intValue);
  writer.writeString(offsets[1], object.strValue);
}

StoreEntity _storeEntityDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = StoreEntity(
    id: id,
    intValue: reader.readLongOrNull(offsets[0]),
    strValue: reader.readStringOrNull(offsets[1]),
  );
  return object;
}

P _storeEntityDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readLongOrNull(offset)) as P;
    case 1:
      return (reader.readStringOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _storeEntityGetId(StoreEntity object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _storeEntityGetLinks(StoreEntity object) {
  return [];
}

void _storeEntityAttach(
    IsarCollection<dynamic> col, Id id, StoreEntity object) {}

extension StoreEntityQueryWhereSort
    on QueryBuilder<StoreEntity, StoreEntity, QWhere> {
  QueryBuilder<StoreEntity, StoreEntity, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension StoreEntityQueryWhere
    on QueryBuilder<StoreEntity, StoreEntity, QWhereClause> {
  QueryBuilder<StoreEntity, StoreEntity, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterWhereClause> idNotEqualTo(
      Id id) {
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

  QueryBuilder<StoreEntity, StoreEntity, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterWhereClause> idBetween(
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
}

extension StoreEntityQueryFilter
    on QueryBuilder<StoreEntity, StoreEntity, QFilterCondition> {
  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> idBetween(
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

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      intValueIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'intValue',
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      intValueIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'intValue',
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> intValueEqualTo(
      int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'intValue',
        value: value,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      intValueGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'intValue',
        value: value,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      intValueLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'intValue',
        value: value,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> intValueBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'intValue',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'strValue',
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'strValue',
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> strValueEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> strValueBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'strValue',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition> strValueMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'strValue',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'strValue',
        value: '',
      ));
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterFilterCondition>
      strValueIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'strValue',
        value: '',
      ));
    });
  }
}

extension StoreEntityQueryObject
    on QueryBuilder<StoreEntity, StoreEntity, QFilterCondition> {}

extension StoreEntityQueryLinks
    on QueryBuilder<StoreEntity, StoreEntity, QFilterCondition> {}

extension StoreEntityQuerySortBy
    on QueryBuilder<StoreEntity, StoreEntity, QSortBy> {
  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> sortByIntValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.asc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> sortByIntValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.desc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> sortByStrValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.asc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> sortByStrValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.desc);
    });
  }
}

extension StoreEntityQuerySortThenBy
    on QueryBuilder<StoreEntity, StoreEntity, QSortThenBy> {
  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> thenByIntValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.asc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> thenByIntValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.desc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> thenByStrValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.asc);
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QAfterSortBy> thenByStrValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.desc);
    });
  }
}

extension StoreEntityQueryWhereDistinct
    on QueryBuilder<StoreEntity, StoreEntity, QDistinct> {
  QueryBuilder<StoreEntity, StoreEntity, QDistinct> distinctByIntValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'intValue');
    });
  }

  QueryBuilder<StoreEntity, StoreEntity, QDistinct> distinctByStrValue(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'strValue', caseSensitive: caseSensitive);
    });
  }
}

extension StoreEntityQueryProperty
    on QueryBuilder<StoreEntity, StoreEntity, QQueryProperty> {
  QueryBuilder<StoreEntity, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<StoreEntity, int?, QQueryOperations> intValueProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'intValue');
    });
  }

  QueryBuilder<StoreEntity, String?, QQueryOperations> strValueProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'strValue');
    });
  }
}
