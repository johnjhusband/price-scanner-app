// Environmental Impact Tagging for Pre-Loved Items

const tagsByCategory = {
  bags: [
    "♻️ Saved 35 showers",
    "♻️ Saved 1,800 gallons of water",
    "♻️ Skipped 5 pounds of CO₂",
    "♻️ Saved 2 months of drinking water",
    "♻️ Offset 60 dishwasher cycles"
  ],
  apparel: [
    "♻️ Saved enough energy to microwave 80 meals",
    "♻️ Skipped the emissions of baking 10 cakes",
    "♻️ Offset 3 days of household energy",
    "♻️ Saved 3 days of household energy",
    "♻️ Offset the energy to toast 100 slices of bread"
  ],
  shoes: [
    "♻️ Offset the energy of cooking 30 eggs",
    "♻️ Equal to 90 scoops of ice cream chilled",
    "♻️ Saved the water for 15 bowls of soup",
    "♻️ Saved 40 smoothies",
    "♻️ Saved the energy used in 30 rice cooker runs"
  ],
  kitchenware: [
    "♻️ Equal to 20 pots of coffee brewed",
    "♻️ Saved enough for 35 servings of pasta",
    "♻️ Skipped the water used to make 25 loaves of bread",
    "♻️ Saved enough water to brew 50 cups of tea",
    "♻️ Offset the packaging of 50 granola bars"
  ]
};

// Category detection keywords
const categoryKeywords = {
  bags: ['bag', 'purse', 'tote', 'clutch', 'backpack', 'wallet', 'pouch', 'satchel', 'handbag', 'crossbody'],
  apparel: ['shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater', 'hoodie', 'top', 'blouse', 'skirt', 'suit', 'blazer', 'cardigan', 't-shirt', 'shorts', 'leggings'],
  shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'pump', 'flat', 'slipper', 'trainer', 'runner'],
  kitchenware: ['plate', 'bowl', 'cup', 'mug', 'pot', 'pan', 'utensil', 'kitchen', 'cookware', 'dinnerware', 'glass', 'pitcher', 'teapot']
};

function detectCategory(itemName) {
  const lowerName = itemName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

function getEnvironmentalTag(category) {
  const tags = tagsByCategory[category?.toLowerCase()];
  if (!tags) return "♻️ Small impact, big love";
  
  // Randomly select a tag from the category
  return tags[Math.floor(Math.random() * tags.length)];
}

function getEnvironmentalTagByItemName(itemName) {
  const category = detectCategory(itemName);
  return getEnvironmentalTag(category);
}

module.exports = {
  getEnvironmentalTag,
  getEnvironmentalTagByItemName,
  detectCategory
};