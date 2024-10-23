/// <reference types="chromecast-caf-sender" />

const FRAMEWORK_LINK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

export const loadCastFramework = (() => {
  let promise: Promise<typeof cast> | undefined;

  return () => {
    if (promise === undefined) {
      promise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = FRAMEWORK_LINK;
        window.__onGCastApiAvailable = (isAvailable) => {
          if (isAvailable) {
            cast.framework.CastContext.getInstance().setOptions({
              receiverApplicationId: 'BBBF7E5B',
              autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
            });

            resolve(cast);
          }
        };
        document.body.appendChild(script);
      });
    }
    return promise;
  };
})();

export const castPhoto = async (url: string) => {
  const mediaInfo = new chrome.cast.media.MediaInfo(
    url + '&sessionKey=ZQUKH1WfVByDt4jEs7TvitxkPNzqLD5YTmgK3EPwRO8',
    'image/jpeg',
  );
  const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
  if (!castSession) {
    return;
  }
  const request = new chrome.cast.media.LoadRequest(mediaInfo);
  console.log(mediaInfo);
  return castSession.loadMedia(request);
};
