
import React from 'react';
import TOCInline from './TOCInline/index';
const TOC = ({metadata , toc}) => {
    return (
        <div>
            <div className="col col--12">
            <h1>{metadata.title}</h1>
            <TOCInline toc={toc} metadata={metadata}/>
            </div>
        </div>
    );
};

export default TOC;






