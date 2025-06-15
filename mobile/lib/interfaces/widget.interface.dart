abstract interface class IWidgetRepository {
  Future<void> saveData(String key, String value);
  Future<void> refresh(String name);
  Future<void> setAppGroupId(String appGroupId);
}
