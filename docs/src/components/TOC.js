import React from 'react';
import TOC from './TOCInline';
import { sortedCombined as FAQComponents } from '../../docs/FAQ/index';

const TOCI = () => {
    return (
        <div>
            {/* For each [key, value] pair in FAQComponents... */}
            {Object.values(FAQComponents).map(({ toc, metadata }) => {
                /* ...render a TOC component with toc and metadata as props */
                return <TOC key={metadata.id} toc={toc} metadata={metadata} />
            })}
        </div>
    );
};

export default TOCI;
