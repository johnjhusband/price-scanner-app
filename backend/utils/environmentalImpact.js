// Environmental Impact Tagging for Pre-Loved Items

const tagsByCategory = {
  bags: [
    "♻️ Saves 35 showers",
    "♻️ Saves water for 60 cups of coffee",
    "♻️ Offsets 2 months of drinking water",
    "♻️ Offsets 60 dishwasher loads",
    "♻️ Saves water for 45 smoothies",
    "♻️ Replaces water for 90 glasses of lemonade",
    "♻️ Equals 50 tea refills at a café"
  ],
  apparel: [
    "♻️ Microwaves 80 meals",
    "♻️ Bakes 10 cakes",
    "♻️ Toasts 100 slices of bread",
    "♻️ Boils 90 cups of tea",
    "♻️ Cooks 50 bowls of oatmeal",
    "♻️ Steeps 120 herbal teas",
    "♻️ Juices 100 oranges"
  ],
  shoes: [
    "♻️ Cooks 30 eggs",
    "♻️ Chills 90 scoops of ice cream",
    "♻️ Brews 35 cups of coffee",
    "♻️ Mixes 40 smoothies",
    "♻️ Steeps 60 tea bags",
    "♻️ Blends 25 green juices",
    "♻️ Whips 40 pancake stacks"
  ],
  kitchenware: [
    "♻️ Brews 20 pots of coffee",
    "♻️ Boils 35 servings of pasta",
    "♻️ Bakes 25 loaves of bread",
    "♻️ Brews 50 cups of tea",
    "♻️ Wraps 50 granola bars",
    "♻️ Pops 80 bags of popcorn",
    "♻️ Grills 25 burgers",
    "♻️ Blends 45 protein shakes",
    "♻️ Freezes 30 smoothie packs",
    "♻️ Mixes 90 mugs of hot cocoa"
  ],
  toys: [
    "♻️ Preps 60 baby bottles",
    "♻️ Warms 40 jars of baby food",
    "♻️ Steams 35 kids' meals",
    "♻️ Brews 70 cups of toddler tea",
    "♻️ Cools 25 servings of applesauce"
  ],
  accessories: [
    "♻️ Steeps 40 cups of calming tea",
    "♻️ Saves energy for 30 espresso shots",
    "♻️ Equal to 50 cocktail mixers",
    "♻️ Blends 20 fruit bowls",
    "♻️ Chills 45 iced coffees"
  ]
};

// Category detection keywords
const categoryKeywords = {
  bags: ['bag', 'purse', 'tote', 'clutch', 'backpack', 'wallet', 'pouch', 'satchel', 'handbag', 'crossbody'],
  apparel: ['shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater', 'hoodie', 'top', 'blouse', 'skirt', 'suit', 'blazer', 'cardigan', 't-shirt', 'shorts', 'leggings'],
  shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'pump', 'flat', 'slipper', 'trainer', 'runner'],
  kitchenware: ['plate', 'bowl', 'cup', 'mug', 'pot', 'pan', 'utensil', 'kitchen', 'cookware', 'dinnerware', 'glass', 'pitcher', 'teapot'],
  toys: ['toy', 'doll', 'game', 'puzzle', 'lego', 'baby', 'stroller', 'crib', 'highchair', 'playpen', 'rattle', 'teether'],
  accessories: ['watch', 'jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'sunglasses', 'glasses', 'belt', 'scarf', 'hat', 'cap', 'tie']
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
  if (!tags) return "♻️ Small steps, big love";
  
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