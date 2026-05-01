import { ObservableCallback } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';
import { MetricGroupRepository } from 'src/repositories/telemetry.repository';
import { describe, expect, it, vi } from 'vitest';

const newMetricService = () => {
  const observableGauge = { addCallback: vi.fn() };
  const metricService = {
    getCounter: vi.fn(),
    getUpDownCounter: vi.fn(),
    getHistogram: vi.fn(),
    getObservableGauge: vi.fn().mockReturnValue(observableGauge),
  } as unknown as MetricService;

  return { metricService, observableGauge };
};

describe(MetricGroupRepository.name, () => {
  it('registers observable gauges when enabled', () => {
    const { metricService, observableGauge } = newMetricService();
    const callback: ObservableCallback = vi.fn();

    new MetricGroupRepository(metricService).configure({ enabled: true }).observeGauge('immich.assets.total', callback);

    expect(metricService.getObservableGauge).toHaveBeenCalledWith('immich.assets.total', undefined);
    expect(observableGauge.addCallback).toHaveBeenCalledWith(callback);
  });

  it('does not register observable gauges when disabled', () => {
    const { metricService, observableGauge } = newMetricService();
    const callback: ObservableCallback = vi.fn();

    new MetricGroupRepository(metricService)
      .configure({ enabled: false })
      .observeGauge('immich.assets.total', callback);

    expect(metricService.getObservableGauge).not.toHaveBeenCalled();
    expect(observableGauge.addCallback).not.toHaveBeenCalled();
  });
});
