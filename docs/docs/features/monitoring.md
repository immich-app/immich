# Monitoring

## Overview

Immich provides a variety of performance metrics to allow for local monitoring and insights. This integration is primarily in the form of Prometheus metrics. However, exporting traces is also possible due to the use of OpenTelemetry instrumentation.

:::note
This is an opt-in feature intended for you to monitor immich's performance. This data isn't sent anywhere beyond what you've configured.
:::

## Prometheus

Prometheus is a tool that collects metrics from a number of sources you configure. It operates in a "pull" strategy - that is, it periodically requests metrics from each defined source. This means that the source doesn't send anything until it's requested. It also means that the source -- immich, in this case -- has to expose an endpoint for Prometheus to target when it requests metrics.

### Metrics

These metrics come in a variety of forms:

- Counters, which can only increase. Example: the number of times an endpoint has been called.
- Gauges, which can increase or decrease within a certain range. Example: CPU utilization.
- Histograms, where each observation is assigned to a certain number of "buckets". Example: response time, where each bucket is a number of milliseconds. This one is a bit more complicated.
  - Buckets in this case are _cumulative_; that is, an observation is placed not only into the smallest bucket that contains it, but also to all buckets larger than this. For example, if a histogram has three buckets for 1ms, 5ms and 10ms, an observation of 3ms will be bucketed into both 5ms and 10ms.

The metrics in immich are grouped into API (endpoint calls and response times), host (memory and CPU utilization), and IO (internal database queries, image processing, and so on). Each group of metrics can be enabled or disabled independently.

### Configuration

Immich will not expose an endpoint for metrics by default. To enable this endpoint, you can add the `IMMICH_METRICS=true` environmental variable to your `.env` file. Note that only the server and microservices containers currently use this variable.

:::tip
`IMMICH_METRICS` enables all metrics, but there are also [environmental variables](/docs/install/environment-variables.md#prometheus) to toggle specific metric groups. If you'd like to only expose certain kinds of metrics, you can set only those environmental variables to `true`. Explicitly setting the environmental variable for a metric group overrides `IMMICH_METRICS` for that group. For example, setting `IMMICH_METRICS=true` and `IMMICH_API_METRICS=false` will enable all metrics except API metrics.
:::

The next step is to configure a new or existing Prometheus instance to scrape this endpoint. The following steps assume that you do not have an existing Prometheus instance, but the steps will be similar either way.

You can start by defining a Prometheus service in the Compose file:

```yaml
immich-prometheus:
  container_name: immich_prometheus
  ports:
    # this exposes the default port for Prometheus so you can interact with it
    - 9090:9090
  image: prom/prometheus
  volumes:
    # the Prometheus configuration file - a barebones one is provided to get started
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    # a named volume defined in the bottom of the Compose file; it can also be a mounted folder
    - prometheus-data:/prometheus
```

You will also need to add `prometheus-data` to the list of volumes in the bottom of the Compose file:

```yaml
volumes:
  model-cache:
  prometheus-data:
```

The last piece is the [configuration file][prom-file]. This file defines (among other things) the sources Prometheus should target. Download it and place it in the same folder as the Compose file.

:::tip
The provided file is just a starting point. There are a ton of ways to configure Prometheus, so feel free to experiment!
:::

After bringing down the containers with `docker compose down` and back up with `docker compose up -d`, a Prometheus instance will now collect metrics from the immich server and microservices containers. Note that we didn't need to expose any new ports for these containers - the communication is handled in the internal Docker network.

:::note
To see exactly what metrics are made available, you can additionally add `8081:8081` to the server container's ports and `8082:8081` to the microservices container's ports. Visiting the `/metrics` endpoint for these services will show the same raw data that Prometheus collects.
:::

### Usage

So after setting up Prometheus, how do you actually view the metrics? The simplest way is to use Prometheus directly. Visiting Prometheus will show you a web UI where you can search for and visualize metrics. You can also view the status of your data sources and configure settings, but this is beyond the scope of this guide.

## Grafana

For a dedicated tool with nice presentation, you can use Grafana instead. This connects to Prometheus (and possibly other sources) for sophisticated data visualization.

Setting up Grafana is similar to Prometheus. You can add a service for it:

```yaml
immich-grafana:
  container_name: immich_grafana
  command: ['./run.sh', '-disable-reporting'] # this is to disable Grafana's telemetry
  ports:
    - 3000:3000
  image: grafana/grafana
  volumes:
    # stores your pretty dashboards and panels
    - grafana-data:/var/lib/grafana
```

And add another volume for it:

```yaml
volumes:
  model-cache:
  prometheus-data:
  grafana-data:
```

After bringing down the services and back up again, you can now visit Grafana to view your metrics. On the first login, enter `admin` for both username and password and update your password. You can then go to the settings and add a data source with `http://immich-prometheus:9090` to point Grafana to your Prometheus instance.

### Usage

You can make your first dashboard to get started. Don't forget to save it frequently, or you'll lose all your progress!

You can then make a new panel, specifying Prometheus as the data source for it.

-- TODO: add images and more details here

[prom-file]: https://github.com/immich-app/immich/releases/latest/download/prometheus.yml
