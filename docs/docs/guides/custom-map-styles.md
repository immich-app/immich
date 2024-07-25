# Custom Map Styles

You may decide that you'd like to modify the style document which is used to
draw the maps in Immich. In addition to visual customization, this also allows
you to pick your own map tile provider instead of the default one. The default
`style.json` for [light theme](https://github.com/immich-app/immich/tree/main/server/resources/style-light.json)
and [dark theme](https://github.com/immich-app/immich/blob/main/server/resources/style-dark.json)
can be used as a basis for creating your own style.

There are several sources for already-made `style.json` map themes, as well as
online generators you can use.

1. In **Immich**, navigate to **Administration --> Settings --> Map & GPS Settings** and expand the **Map Settings** subsection.
2. Paste the link to your JSON style in either the **Light Style** or **Dark Style**. (You can add different styles which will help make the map style more appropriate depending on whether you set **Immich** to Light or Dark mode.)
3. Save your selections. Reload the map, and enjoy your custom map style!

## Use Maptiler to build a custom style

Customizing the map style can be done easily using Maptiler, if you do not want to write an entire JSON document by hand.

1. Create a free account at https://cloud.maptiler.com
2. Once logged in, you can either create a brand new map by clicking on **New Map**, selecting a starter map, and then clicking **Customize**, OR by selecting a **Standard Map** and customizing it from there.
3. The **editor** interface is self-explanatory. You can change colors, remove visible layers, or add optional layers (e.g., administrative, topo, hydro, etc.) in the composer.
4. Once you have your map composed, click on **Save** at the top right. Give it a unique name to save it to your account.
5. Next, **Publish** your style using the **Publish** button at the top right. This will deploy it to production, which means it is able to be exposed over the Internet. Maptiler will present an interactive side-by-side map with the original and your changes prior to publication.<br/>![Maptiler Publication Settings](img/immich_map_styles_publish.png)
6. Maptiler will warn you that changing the map will change it across all apps using the map. Since no apps are using the map yet, this is okay.
7. Clicking on the name of your new map at the top left will bring you to the item's **details** page. From here, copy the link to the JSON style under **Use vector style**. This link will automatically contain your personal API key to Maptiler.

## Use Nginx as a caching proxy in front of any tile provider

Hosting a caching proxy between the clients and the tile provider can bring
several benefits :

- Limit the amount of personally identifiable information (PII) sent to the tile
  provider by using the Immich instance's IP address and stripping the
  `Referer` header
- Limit the frequency at which PII is sent to the tile provider by caching tiles
  that have already been loaded through the proxy
- If you do not need the map displaying your photos to be perfectly up to date,
  you can set an arbitrarily long caching duration
- Most use cases for the map will frequently zoom on the same areas, which makes
  it a good fit for a cache
- The decreased load on the upstream tile provider makes it reasonable to use Open
  Street Map's tile server

This guide will use [Nginx proxy module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
to build a caching proxy in front of Open Street Map's tileserver and to serve a custom
`style.json` for the maps.

This works if you already proxy your services behind an Nginx instance.
It is probably possible to achieve similar results with other reverse proxies,
but this would obviously need to be adapted.

### Caching proxy

Inside Nginx's `http` config block (usually in `/etc/nginx/nginx.conf`), create
a cache zone (a directory that will hold cached responses from OSM) :

```nginx
http {
    # You should not need to edit existing lines in the http block, only add the line below
    proxy_cache_path /var/cache/nginx/osm levels=1:2 keys_zone=osm:100m max_size=5g inactive=180d;
}
```

You may need to manually create the `/var/cache/nginx/osm` directory and set its
owner to Nginx's user (typically `www-data` on Debian based distros).

Customize the `max_size` parameter to change the maximum amount of cached data
you want to store on your server. The `inactive` parameter will cause Nginx to
discard cached data that's not been accessed in this duration (180d ~ 6months).

Then, inside the `server` block that serves your Immich instance, create a new
`location` block :

```nginx
server {
    listen 443 ssl;
    server_name immich.your-domain.tld;

    # You should not need to change your existing config, only add the location block below

    location /map_proxy/ {
        proxy_pass https://tile.openstreetmap.org/;
        proxy_cache osm;
        proxy_cache_valid 180d;
        proxy_ignore_headers Cache-Control Expires;
        proxy_ssl_server_name on;
        proxy_ssl_name tile.openstreetmap.org;
        proxy_set_header Host tile.openstreetmap.org;
        proxy_set_header User-Agent "Nginx Caching Tile Proxy for self-hosters";
        proxy_set_header Cookie "";
        proxy_set_header Referer "";
    }
}
```

Reload Nginx (`sudo systemctl reload nginx`). Confirm this works by visiting
`https://immich.your-domain.tld/map_proxy/0/0/0.png`, which should now return a
world map PNG (the one from https://tile.openstreetmap.org/0/0/0.png )

This config ignores cache control headers from OSM and sets its own cache
validity duration (`proxy_cache_valid` parameter). After the specified duration,
the proxy will re-fetch the tiles. 6 months seem reasonable to me for the use
case, and it can probably be set to a few years without it causing issues.

Besides being lighter on OSM's servers, the caching proxy will improve privacy
by only requesting tiles from upstream when loaded for the first time. This
config also strips cookies and referrer before forwarding the queries to OSM, as
well as set a user agent for the proxy following [OSM foundation's
guidelines](https://operations.osmfoundation.org/policies/tiles/) (according to
these guidelines, you should add a contact information to this user agent)

This can probably be made to work on a different domain than the one serving
your Immich instance, but this will require tweaking CORS headers.

### Custom `style.json`

The following map style can be used to replace Immich's default tile provider
with your caching proxy :

```json
{
  "version": 8,
  "name": "Immich Map",
  "sources": {
    "immich-map": {
      "type": "raster",
      "tileSize": 256,
      "tiles": ["https://immich.your-domain.tld/map_proxy/{z}/{x}/{y}.png"]
    }
  },
  "sprite": "https://maputnik.github.io/osm-liberty/sprites/osm-liberty",
  "glyphs": "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  "layers": [
    {
      "id": "raster-tiles",
      "type": "raster",
      "source": "immich-map",
      "minzoom": 0,
      "maxzoom": 22
    }
  ],
  "id": "immich-map-dark"
}
```

Replace `immich.your-domain.tld` with your actual Immich domain, and remember
the absolute path you save this at on your server.

### One last update to nginx's config

Since Immich currently does not provide a way to manually edit `style.json`, we
need to serve it from http(s). Add one more `location` block below the previous
one :

```nginx
location /map_style.json {
    alias /srv/immich/mapstyle.json;
}
```

Replace the `alias` parameter with the location where you saved the json
map style. After reloading nginx, your json style will be available at
`https://immich.your-domain.tld/map_style.json`. You can now use this URL to
your style as both the light and dark themes in your instance's settings.
