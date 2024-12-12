import { Column, Img, Link, Row, Text } from '@react-email/components';
import * as React from 'react';

export const ImmichFooter = () => (
  <>
    <Row className="h-18 w-full">
      <Column align="center" className="w-6/12 sm:w-full">
        <div>
          <Link href="https://play.google.com/store/apps/details?id=app.alextran.immich" className="object-contain">
            <Img className="max-w-full" src={`https://immich.app/img/google-play-badge.png`} />
          </Link>
        </div>
      </Column>
      <Column align="center" className="w-6/12 sm:w-full">
        <div className="h-full p-6">
          <Link href="https://apps.apple.com/sg/app/immich/id1613945652">
            <Img src={`https://immich.app/img/ios-app-store-badge.png`} alt="Immich" className="max-w-full" />
          </Link>
        </div>
      </Column>
    </Row>

    <Text className="text-center text-sm text-immich-footer">
      <Link href="https://immich.app">Immich</Link> project is available under GNU AGPL v3 license.
    </Text>
  </>
);
