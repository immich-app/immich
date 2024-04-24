//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:openapi/src/model/search_facet_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_asset_response_dto.g.dart';

/// SearchAssetResponseDto
///
/// Properties:
/// * [count] 
/// * [facets] 
/// * [items] 
/// * [nextPage] 
/// * [total] 
@BuiltValue()
abstract class SearchAssetResponseDto implements Built<SearchAssetResponseDto, SearchAssetResponseDtoBuilder> {
  @BuiltValueField(wireName: r'count')
  int get count;

  @BuiltValueField(wireName: r'facets')
  BuiltList<SearchFacetResponseDto> get facets;

  @BuiltValueField(wireName: r'items')
  BuiltList<AssetResponseDto> get items;

  @BuiltValueField(wireName: r'nextPage')
  String? get nextPage;

  @BuiltValueField(wireName: r'total')
  int get total;

  SearchAssetResponseDto._();

  factory SearchAssetResponseDto([void updates(SearchAssetResponseDtoBuilder b)]) = _$SearchAssetResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchAssetResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchAssetResponseDto> get serializer => _$SearchAssetResponseDtoSerializer();
}

class _$SearchAssetResponseDtoSerializer implements PrimitiveSerializer<SearchAssetResponseDto> {
  @override
  final Iterable<Type> types = const [SearchAssetResponseDto, _$SearchAssetResponseDto];

  @override
  final String wireName = r'SearchAssetResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchAssetResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(int),
    );
    yield r'facets';
    yield serializers.serialize(
      object.facets,
      specifiedType: const FullType(BuiltList, [FullType(SearchFacetResponseDto)]),
    );
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
    );
    yield r'nextPage';
    yield object.nextPage == null ? null : serializers.serialize(
      object.nextPage,
      specifiedType: const FullType.nullable(String),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchAssetResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchAssetResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.count = valueDes;
          break;
        case r'facets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SearchFacetResponseDto)]),
          ) as BuiltList<SearchFacetResponseDto>;
          result.facets.replace(valueDes);
          break;
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
          ) as BuiltList<AssetResponseDto>;
          result.items.replace(valueDes);
          break;
        case r'nextPage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.nextPage = valueDes;
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchAssetResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchAssetResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

