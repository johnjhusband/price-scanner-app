// Environmental Impact Tagging for Pre-Loved Items

const tagsByCategory = {
  bags: [
    "♻️ Impact: Saved 35 showers",
    "♻️ Impact: Saved 1,800 gallons of water",
    "♻️ Impact: Skipped 5 pounds of CO₂",
    "♻️ Impact: Saved 2 months of drinking water",
    "♻️ Impact: Offset 60 dishwasher cycles"
  ],
  apparel: [
    "♻️ Impact: Saved enough energy to microwave 80 meals",
    "♻️ Impact: Skipped the emissions of baking 10 cakes",
    "♻️ Impact: Offset 3 days of household energy",
    "♻️ Impact: Saved 3 days of household energy",
    "♻️ Impact: Offset the energy to toast 100 slices of bread"
  ],
  shoes: [
    "♻️ Impact: Offset the energy of cooking 30 eggs",
    "♻️ Impact: Equal to 90 scoops of ice cream chilled",
    "♻️ Impact: Saved the water for 15 bowls of soup",
    "♻️ Impact: Saved 40 smoothies",
    "♻️ Impact: Saved the energy used in 30 rice cooker runs"
  ],
  kitchenware: [
    "♻️ Impact: Equal to 20 pots of coffee brewed",
    "♻️ Impact: Saved enough for 35 servings of pasta",
    "♻️ Impact: Skipped the water used to make 25 loaves of bread",
    "♻️ Impact: Saved enough water to brew 50 cups of tea",
    "♻️ Impact: Offset the packaging of 50 granola bars"
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
  if (!tags) return "♻️ Impact: Small steps, big love";
  
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