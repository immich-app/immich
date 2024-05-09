// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'store.entity.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetStoreValueCollection on Isar {
  IsarCollection<StoreValue> get storeValues => this.collection();
}

const StoreValueSchema = CollectionSchema(
  name: r'StoreValue',
  id: 902899285492123510,
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
  estimateSize: _storeValueEstimateSize,
  serialize: _storeValueSerialize,
  deserialize: _storeValueDeserialize,
  deserializeProp: _storeValueDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _storeValueGetId,
  getLinks: _storeValueGetLinks,
  attach: _storeValueAttach,
  version: '3.1.0+1',
);

int _storeValueEstimateSize(
  StoreValue object,
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

void _storeValueSerialize(
  StoreValue object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.intValue);
  writer.writeString(offsets[1], object.strValue);
}

StoreValue _storeValueDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = StoreValue(
    id,
    intValue: reader.readLongOrNull(offsets[0]),
    strValue: reader.readStringOrNull(offsets[1]),
  );
  return object;
}

P _storeValueDeserializeProp<P>(
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

Id _storeValueGetId(StoreValue object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _storeValueGetLinks(StoreValue object) {
  return [];
}

void _storeValueAttach(IsarCollection<dynamic> col, Id id, StoreValue object) {
  object.id = id;
}

extension StoreValueQueryWhereSort
    on QueryBuilder<StoreValue, StoreValue, QWhere> {
  QueryBuilder<StoreValue, StoreValue, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension StoreValueQueryWhere
    on QueryBuilder<StoreValue, StoreValue, QWhereClause> {
  QueryBuilder<StoreValue, StoreValue, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterWhereClause> idNotEqualTo(Id id) {
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

  QueryBuilder<StoreValue, StoreValue, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterWhereClause> idBetween(
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

extension StoreValueQueryFilter
    on QueryBuilder<StoreValue, StoreValue, QFilterCondition> {
  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> idBetween(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> intValueIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'intValue',
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
      intValueIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'intValue',
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> intValueEqualTo(
      int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'intValue',
        value: value,
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> intValueLessThan(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> intValueBetween(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'strValue',
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
      strValueIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'strValue',
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueEqualTo(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueLessThan(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueBetween(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueEndsWith(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'strValue',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition> strValueMatches(
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

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
      strValueIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'strValue',
        value: '',
      ));
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterFilterCondition>
      strValueIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'strValue',
        value: '',
      ));
    });
  }
}

extension StoreValueQueryObject
    on QueryBuilder<StoreValue, StoreValue, QFilterCondition> {}

extension StoreValueQueryLinks
    on QueryBuilder<StoreValue, StoreValue, QFilterCondition> {}

extension StoreValueQuerySortBy
    on QueryBuilder<StoreValue, StoreValue, QSortBy> {
  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> sortByIntValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.asc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> sortByIntValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.desc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> sortByStrValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.asc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> sortByStrValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.desc);
    });
  }
}

extension StoreValueQuerySortThenBy
    on QueryBuilder<StoreValue, StoreValue, QSortThenBy> {
  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> thenByIntValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.asc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> thenByIntValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'intValue', Sort.desc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> thenByStrValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.asc);
    });
  }

  QueryBuilder<StoreValue, StoreValue, QAfterSortBy> thenByStrValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'strValue', Sort.desc);
    });
  }
}

extension StoreValueQueryWhereDistinct
    on QueryBuilder<StoreValue, StoreValue, QDistinct> {
  QueryBuilder<StoreValue, StoreValue, QDistinct> distinctByIntValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'intValue');
    });
  }

  QueryBuilder<StoreValue, StoreValue, QDistinct> distinctByStrValue(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'strValue', caseSensitive: caseSensitive);
    });
  }
}

extension StoreValueQueryProperty
    on QueryBuilder<StoreValue, StoreValue, QQueryProperty> {
  QueryBuilder<StoreValue, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<StoreValue, int?, QQueryOperations> intValueProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'intValue');
    });
  }

  QueryBuilder<StoreValue, String?, QQueryOperations> strValueProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'strValue');
    });
  }
}
