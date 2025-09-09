import React from 'react';
import Translate from '@docusaurus/Translate';

export default function CustomAnnouncement() {
  return (
    <div className="custom-announcement-wrapper">
      <div className="custom-announcement-bar">
        ⚠️ 
        {' '}
        <Translate id="announcement.project_prefix">The project is under</Translate>
        {' '}
        <strong>
          <Translate id="announcement.project_active">very active</Translate>
        </strong>
        {' '}
        <Translate id="announcement.project_suffix">development.</Translate>
        {' '}
        <Translate id="announcement.warning_prefix">Expect bugs and changes. Do not use it as</Translate>
        {' '}
        <strong>
          <Translate id="announcement.warning_bold">the only way</Translate>
        </strong>
        {' '}
        <Translate id="announcement.warning_suffix">to store your photos and videos!</Translate>
      </div>
      <div className="custom-announcement-bar-line"></div>
    </div>
  );
}