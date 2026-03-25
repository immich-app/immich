const int kTimelineDynamicLayoutMinThreshold = 2;
const int kTimelineDynamicLayoutMaxThreshold = 6;
const int kTimelineMobileDefaultDynamicLayoutThreshold = 2;
const int kTimelineTabletDefaultDynamicLayoutThreshold = 3;

int resolveTimelineDynamicLayoutThreshold({required bool isMobile, int? configuredThreshold}) {
  return configuredThreshold ??
      (isMobile ? kTimelineMobileDefaultDynamicLayoutThreshold : kTimelineTabletDefaultDynamicLayoutThreshold);
}

bool shouldUseDynamicLayout({required int columnCount, required bool isMobile, int? configuredThreshold}) {
  return columnCount <=
      resolveTimelineDynamicLayoutThreshold(isMobile: isMobile, configuredThreshold: configuredThreshold);
}
