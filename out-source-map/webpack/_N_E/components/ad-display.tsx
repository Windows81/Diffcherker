import React, { useContext } from 'react';

import { AdCoordinatorContext } from './ad-coordinator';
import AdBox from './ad-box';
import { AdPositions } from './ad-coordinator';

interface AdDisplayProps {
  diffInputType: string;
  position: keyof AdPositions;
}

const AdDisplay = (props: AdDisplayProps): JSX.Element | undefined => {
  const [positions] = useContext(AdCoordinatorContext);
  const currentPosition = positions[props.position];
  if (currentPosition) {
    return (
      <AdBox
        diffInputType={props.diffInputType}
        position={props.position}
        ads={currentPosition.ads}
      />
    );
  }
};

export default AdDisplay;
