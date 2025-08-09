import React, { useState } from 'react';
export default function ObtainiumConfig(): JSX.Element {
  let [inputUrl, setInputUrl] = useState('');
  let [inputApiKey, setInputApiKey] = useState('');
  let [archVariant, setArchVariant] = useState('');
  let obtainiumUrl = `https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22app.alextran.immich%22%2C%22url%22%3A%22${inputUrl}%2Fapi%2Fserver%2Fapk-links%22%2C%22author%22%3A%22Immich%22%2C%22name%22%3A%22Immich%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22intermediateLink%5C%22%3A%5B%5D%2C%5C%22customLinkFilterRegex%5C%22%3A%5C%22%5C%22%2C%5C%22filterByLinkText%5C%22%3Afalse%2C%5C%22skipSort%5C%22%3Afalse%2C%5C%22reverseSort%5C%22%3Afalse%2C%5C%22sortByLastLinkSegment%5C%22%3Afalse%2C%5C%22versionExtractWholePage%5C%22%3Afalse%2C%5C%22requestHeader%5C%22%3A%5B%7B%5C%22requestHeader%5C%22%3A%5C%22User-Agent%3A%20Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F114.0.0.0%20Mobile%20Safari%2F537.36%5C%22%7D%2C%7B%5C%22requestHeader%5C%22%3A%5C%22x-api-key%3A%20${inputApiKey}%5C%22%7D%5D%2C%5C%22defaultPseudoVersioningMethod%5C%22%3A%5C%22partialAPKHash%5C%22%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%2Fv(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B).(%5C%5C%5C%5Cd%2B)%2F%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%241.%242.%243%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22${archVariant}%24%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D`;

  return (
    <div>
      <h3>Enter values into the inputs to get a link.</h3>
      <form>
        <label>
          URL:{' '}
          <input
            value={inputUrl}
            placeholder="https://my.immich.app"
            onChange={(update) => setInputUrl(update.target.value)}
            required
          />
        </label>
        <br />
        <label>
          API Key:{' '}
          <input
            value={inputApiKey}
            placeholder="<immich-api-key>"
            onChange={(update) => setInputApiKey(update.target.value)}
            required
          />
        </label>
        <p>
          Variant:{' '}
          <label>
            <input
              type="radio"
              name="archVariantOption"
              value="app-arm64-v8a-release"
              onChange={(update) => setArchVariant(update.target.value)}
              required
            />
            arm64-v8a
          </label>
          <label>
            <input
              type="radio"
              name="archVariantOption"
              value="app-armeabi-v7a-release"
              onChange={(update) => setArchVariant(update.target.value)}
              required
            />
            armeabi-v7a
          </label>
          <label>
            <input
              type="radio"
              name="archVariantOption"
              value="app-release"
              onChange={(update) => setArchVariant(update.target.value)}
              required
            />
            Universal
          </label>
          <label>
            <input
              type="radio"
              name="archVariantOption"
              value="app-x86_64-release"
              onChange={(update) => setArchVariant(update.target.value)}
              required
            />
            x86_64
          </label>
        </p>
      </form>
      <a hidden={!(inputUrl && inputApiKey && archVariant)} href={obtainiumUrl} target="_blank">
        <img className="h-24" alt="Get it on Obtainium" src="/img/obtainium-badge.png" />
      </a>
    </div>
  );
}
