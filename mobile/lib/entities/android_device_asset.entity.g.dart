// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'android_device_asset.entity.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetAndroidDeviceAssetCollection on Isar {
  IsarCollection<AndroidDeviceAsset> get androidDeviceAssets =>
      this.collection();
}

const AndroidDeviceAssetSchema = CollectionSchema(
  name: r'AndroidDeviceAsset',
  id: -6758387181232899335,
  properties: {
    r'hash': PropertySchema(
      id: 0,
      name: r'hash',
      type: IsarType.byteList,
    )
  },
  estimateSize: _androidDeviceAssetEstimateSize,
  serialize: _androidDeviceAssetSerialize,
  deserialize: _androidDeviceAssetDeserialize,
  deserializeProp: _androidDeviceAssetDeserializeProp,
  idName: r'id',
  indexes: {
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
  getId: _androidDeviceAssetGetId,
  getLinks: _androidDeviceAssetGetLinks,
  attach: _androidDeviceAssetAttach,
  version: '3.1.0+1',
);

int _androidDeviceAssetEstimateSize(
  AndroidDeviceAsset object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.hash.length;
  return bytesCount;
}

void _androidDeviceAssetSerialize(
  AndroidDeviceAsset object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeByteList(offsets[0], object.hash);
}

AndroidDeviceAsset _androidDeviceAssetDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = AndroidDeviceAsset(
    hash: reader.readByteList(offsets[0]) ?? [],
    id: id,
  );
  return object;
}

P _androidDeviceAssetDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readByteList(offset) ?? []) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _androidDeviceAssetGetId(AndroidDeviceAsset object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _androidDeviceAssetGetLinks(
    AndroidDeviceAsset object) {
  return [];
}

void _androidDeviceAssetAttach(
    IsarCollection<dynamic> col, Id id, AndroidDeviceAsset object) {
  object.id = id;
}

extension AndroidDeviceAssetQueryWhereSort
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QWhere> {
  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension AndroidDeviceAssetQueryWhere
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QWhereClause> {
  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
      hashEqualTo(List<int> hash) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'hash',
        value: [hash],
      ));
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterWhereClause>
      hashNotEqualTo(List<int> hash) {
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

extension AndroidDeviceAssetQueryFilter
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QFilterCondition> {
  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
      hashElementEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'hash',
        value: value,
      ));
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
      hashIsEmpty() {
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterFilterCondition>
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
}

extension AndroidDeviceAssetQueryObject
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QFilterCondition> {}

extension AndroidDeviceAssetQueryLinks
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QFilterCondition> {}

extension AndroidDeviceAssetQuerySortBy
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QSortBy> {}

extension AndroidDeviceAssetQuerySortThenBy
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QSortThenBy> {
  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterSortBy>
      thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }
}

extension AndroidDeviceAssetQueryWhereDistinct
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QDistinct> {
  QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QDistinct>
      distinctByHash() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'hash');
    });
  }
}

extension AndroidDeviceAssetQueryProperty
    on QueryBuilder<AndroidDeviceAsset, AndroidDeviceAsset, QQueryProperty> {
  QueryBuilder<AndroidDeviceAsset, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<AndroidDeviceAsset, List<int>, QQueryOperations> hashProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'hash');
    });
  }
}
