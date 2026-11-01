import React from 'react';
import { LifeBalanceWheelView } from '../components/wheel/LifeBalanceWheelView';

export const LifeBalancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <LifeBalanceWheelView />
    </div>
  );
};

export default LifeBalancePage;
