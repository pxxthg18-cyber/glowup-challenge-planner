import React from 'react';
import { FoodTrackerView } from '../components/food/FoodTrackerView';

export const FoodTrackerPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <FoodTrackerView />
    </div>
  );
};
