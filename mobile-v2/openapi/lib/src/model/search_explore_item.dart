//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_explore_item.g.dart';

/// SearchExploreItem
///
/// Properties:
/// * [data] 
/// * [value] 
@BuiltValue()
abstract class SearchExploreItem implements Built<SearchExploreItem, SearchExploreItemBuilder> {
  @BuiltValueField(wireName: r'data')
  AssetResponseDto get data;

  @BuiltValueField(wireName: r'value')
  String get value;

  SearchExploreItem._();

  factory SearchExploreItem([void updates(SearchExploreItemBuilder b)]) = _$SearchExploreItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchExploreItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchExploreItem> get serializer => _$SearchExploreItemSerializer();
}

class _$SearchExploreItemSerializer implements PrimitiveSerializer<SearchExploreItem> {
  @override
  final Iterable<Type> types = const [SearchExploreItem, _$SearchExploreItem];

  @override
  final String wireName = r'SearchExploreItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchExploreItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(AssetResponseDto),
    );
    yield r'value';
    yield serializers.serialize(
      object.value,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchExploreItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchExploreItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetResponseDto),
          ) as AssetResponseDto;
          result.data.replace(valueDes);
          break;
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchExploreItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchExploreItemBuilder();
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

