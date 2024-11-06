# Chromecast support

Immich supports the Google's Cast protocol so that photos and videos can be cast to devices such as a Chromecast and a Nest Hub. This feature is considered experimental and has several important limitations listed below. Currently, this feature is only supported by the web client, support on Android and iOS is planned for the future.

## Casting

When you use Chrome and a chromecast is found on your local network, there will be a Cast button in the top navigation bar and in the asset viewer. Click the button and Chrome will pop up a menu to select the device to cast to. Now, browse Immich normally and your photos and videos should show up on the casted device!

When you are finished casting, click the cast menu again and press the stop button.

## Network requirements

Your Immich server must be reachable by the Chromecast, not just your browser. If you are away from your home network you therefore can't cast your vacation photo to your friend's TV if only your computer is connected to a VPN.

Your Immich server address must be resolvable by the Google DNS servers `8.8.8.8` and `8.8.4.4`, so you can't use an internal domain name on your internal DNS server.

You also need a real TLS certificate such as from LetsEncrypt. Self-signed certificates are not supported.

## Limitations

At this stage there are some important limitations to be aware of.

### Video playback

Depending on the device you are casting to, you need to consider the video codecs, resolutions, and framerates are supported please see [this list](https://developers.google.com/cast/docs/media#video_codecs). For instance, Chromecast generation 1 and 2 only support playback of 1080p/30 videos while 3rd gen supports 1080p/60 but only when using H.264.

Immich does not support on-the-fly transcoding, so you'll need to preselect the transcoded video format in the transcoding settings. For instance, if you will be casting to a 3rd gen Chromecast, all videos in your Immich instance must be transcoded to H.264 with at most 1080p at 60 fps.

In the Video Transcoding settings, set the `Transcode Policy` to `Videos higher than target resolution or not in an accepted format`. Then select your target resolution. We currently don't have a way to set the target framerate, so your high refresh rate videos will have a hard time playing on older devices

### Other limitations

- No preloading which means navigating between assets is slow
- No support for slideshows
- No video playback controls like pause, resume, and seek
- Your Immich server must be accessible from the Chromecast device

## Troubleshooting

First, ensure you are using Chrome since other browsers will never be supported by Google.

Next, check the network requirements above.

If you have issues playing video, check the video playback limitations above.
