/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import TOCItems from '../TOCItems/index';
import styles from './styles.module.css';
export default function TOCInline({toc, minHeadingLevel, maxHeadingLevel ,metadata}) {
  return (
    <div className={styles.tableOfContentsInline}>
      <TOCItems
        toc={toc}
        minHeadingLevel={minHeadingLevel}
        maxHeadingLevel={maxHeadingLevel}
        className="table-of-contents"
        linkClassName={null}
        metadata={metadata}
      />
    </div>
  );
}
