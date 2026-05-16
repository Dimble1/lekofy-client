import React, { useState } from 'react';
import CategorySelector from '../components/CategorySelector';
import AdForm from '../components/AdForm';
import AddCarForm from '../components/AddCarForm';

const PublishAd = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleBack = () => setSelectedCategory(null);

  return (
    <div>
      {!selectedCategory ? (
        <CategorySelector onSelect={setSelectedCategory} />
      ) : selectedCategory.id === 'cars' ? (
        <AddCarForm onBack={handleBack} />
      ) : (
        <AdForm category={selectedCategory} onBack={handleBack} />
      )}
    </div>
  );
};

export default PublishAd;
