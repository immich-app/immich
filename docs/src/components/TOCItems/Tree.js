/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import Link from '@docusaurus/Link';

// Recursive component rendering the toc tree
function TOCItemTree({ toc, className, linkClassName, isChild, metadata }) {
  if (!toc.length) {
    return null;
  }
  return (
    <ul className={isChild ? undefined : className}>
      {toc.map((heading) => (
        <li key={heading.id}>
          <Link
            className={linkClassName ?? undefined} key={heading.id}
            href={`${metadata?.permalink}#${heading.id}`}
            to={`${metadata?.permalink}#${heading.id}`}
          >
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <span
              // Developer provided the HTML, so assume it's safe.
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: heading.value }}
            ></span>
          </Link>
          <TOCItemTree
            isChild
            toc={heading.children}
            className={className}
            linkClassName={linkClassName}
            metadata={metadata}
          />
        </li>
      ))}
    </ul>
  );
}
// Memo only the tree root is enough
export default React.memo(TOCItemTree);
