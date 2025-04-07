import * as React from 'react';
import CongressBudget from 'static/images/congress-budget.svg';
import DowJones from 'static/images/dow-jones.svg';
import Intuit from 'static/images/intuit.svg';
import Lyft from 'static/images/lyft.svg';
import NatGeo from 'static/images/nat-geo.svg';
import Salesforce from 'static/images/salesforce.svg';
import WSJ from 'static/images/wsj.svg';
import Zoom from 'static/images/zoom.svg';

import css from './brands-marquee.module.css';

const Marquee = (): JSX.Element => {
  const images = [
    Intuit,
    Lyft,
    NatGeo,
    Salesforce,
    WSJ,
    CongressBudget,
    Zoom,
    DowJones,
  ];
  return (
    <div className={css.flexIconsContainer}>
      {images.map((ImageComponent, index) => (
        <div key={index} className={css.flexIconItem}>
          <ImageComponent />
        </div>
      ))}
    </div>
  );
};

export default Marquee;
