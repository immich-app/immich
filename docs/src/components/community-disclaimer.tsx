import Admonition from '@theme/Admonition';
import React from 'react';

/**
 * Disclaimer shown at the top of every community-contributed installation guide.
 * Pass the platform's support venue as children.
 */
export default function CommunityDisclaimer({ children }: { children?: React.ReactNode }): JSX.Element {
  return (
    <Admonition type="warning" title="Community contribution">
      <p>
        This is a community contribution, not officially supported by the Immich team, and is included here for
        convenience. Use it at your own risk.
      </p>
      {children}
    </Admonition>
  );
}
