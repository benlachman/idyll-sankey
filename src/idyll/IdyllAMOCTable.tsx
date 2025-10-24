/**
 * Idyll wrapper component for AMOC Temperature Table
 * Allows integration with Idyll's reactive variable system
 */

import * as React from 'react';
import { AMOCTemperatureTable } from '../components/AMOCTemperatureTable';

interface IdyllAMOCTableProps {
  amocDecrease?: number;
}

class IdyllAMOCTable extends React.Component<IdyllAMOCTableProps> {
  static defaultProps = {
    amocDecrease: 15,
  };

  render() {
    const { amocDecrease } = this.props;

    return (
      <AMOCTemperatureTable amocDecrease={amocDecrease!} />
    );
  }
}

export default IdyllAMOCTable;
