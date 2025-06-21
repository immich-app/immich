abstract interface class IWidgetRepository {
  Future<void> saveData(String key, String value);
  Future<void> refresh(String iOSName, String androidName);
  Future<void> setAppGroupId(String appGroupId);
}
