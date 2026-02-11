import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./db";
import {
  recipes,
  recipeIngredients,
  recipeInstructions,
  tags,
  recipeTags,
} from "./db/schema";

const cuisines = [
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "French",
  "Greek",
  "Spanish",
  "Korean",
  "Vietnamese",
  "Middle Eastern",
  "American",
  "Mediterranean",
  "Caribbean",
  "Brazilian",
  "Ethiopian",
  "Moroccan",
  "Turkish",
  "German",
];

const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Appetizer",
  "Side Dish",
  "Soup",
  "Salad",
  "Beverage",
  "Brunch",
  "Main Course",
  "Bread",
  "Pasta",
  "Rice",
  "Noodles",
  "Seafood",
  "Vegetarian",
  "Vegan",
];

const difficulties = ["easy", "medium", "hard"];

const sources = [
  "Family Recipe",
  "Food Network",
  "Bon Appétit",
  "NYT Cooking",
  "Serious Eats",
  "Tasty",
  "AllRecipes",
  "Jamie Oliver",
  "Gordon Ramsay",
  "Grandma's Recipe",
];

const allTags = [
  // Dietary
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Low-Carb",
  "Paleo",
  "Pescatarian",
  "Nut-Free",
  "Egg-Free",
  // Meal Type
  "Quick & Easy",
  "One-Pot",
  "Meal Prep",
  "Slow Cooker",
  "Instant Pot",
  "Air Fryer",
  "Grilled",
  "Baked",
  "Fried",
  "Steamed",
  // Occasion
  "Holiday",
  "Party",
  "Game Day",
  "Date Night",
  "Kid-Friendly",
  "Comfort Food",
  "Street Food",
  "Restaurant Style",
  // Season
  "Summer",
  "Winter",
  "Spring",
  "Fall",
  // Time
  "30-Min",
  "15-Min",
  "Make Ahead",
  "Freezer-Friendly",
  "Leftover-Friendly",
  // Health
  "High-Protein",
  "Low-Calorie",
  "Heart-Healthy",
  "Anti-Inflammatory",
  "Superfood",
  // Style
  "Spicy",
  "Sweet",
  "Savory",
  "Tangy",
  "Creamy",
  "Crunchy",
  "Light",
  "Hearty",
  // Cooking Method
  "No-Cook",
  "Raw",
  "Pressure Cooker",
  "Stovetop",
  "Microwave",
  "BBQ",
  "Smoked",
  // Special
  "Budget-Friendly",
  "Gourmet",
  "Authentic",
  "Fusion",
  "Traditional",
  "Modern",
  "Classic",
];

const recipeNames = [
  "Spaghetti Carbonara",
  "Chicken Tikka Masala",
  "Pad Thai",
  "Beef Tacos",
  "Margherita Pizza",
  "Caesar Salad",
  "Tom Yum Soup",
  "Chicken Fried Rice",
  "Beef Bourguignon",
  "Greek Moussaka",
  "Sushi Rolls",
  "Chicken Parmesan",
  "Beef Pho",
  "Vegetable Curry",
  "Fish and Chips",
  "Lasagna",
  "Ramen",
  "Falafel",
  "Paella",
  "Butter Chicken",
  "BBQ Ribs",
  "Chow Mein",
  "Chicken Enchiladas",
  "Beef Stroganoff",
  "Shrimp Scampi",
  "Lamb Kebabs",
  "Fried Chicken",
  "Mac and Cheese",
  "Burrito Bowl",
  "Chicken Quesadilla",
  "Beef Stir Fry",
  "Salmon Teriyaki",
  "Mushroom Risotto",
  "Chicken Alfredo",
  "Beef Chili",
  "Pork Schnitzel",
  "Veggie Burger",
  "Greek Salad",
  "Chicken Noodle Soup",
  "Beef Tacos Al Pastor",
  "Shrimp Tempura",
  "Chicken Shawarma",
  "Beef Wellington",
  "Vegetable Stir Fry",
  "Chicken Souvlaki",
  "Pork Carnitas",
  "Thai Green Curry",
  "Chicken Katsu",
  "Beef Ramen",
  "Veggie Pizza",
  "Chicken Wings",
  "Fish Tacos",
  "Beef Bulgogi",
  "Chicken Satay",
  "Pork Dumplings",
  "Vegetable Soup",
  "Chicken Caesar Wrap",
  "Beef Nachos",
  "Shrimp Fried Rice",
  "Chicken Fajitas",
  "Lamb Curry",
  "Beef Burrito",
  "Chicken Tandoori",
  "Pork Chops",
  "Veggie Stir Fry",
  "Chicken Pot Pie",
  "Beef Slider",
  "Shrimp Tacos",
  "Chicken Biryani",
  "Pork Ramen",
  "Veggie Wrap",
  "Chicken Teriyaki Bowl",
  "Beef Pho Bowl",
  "Shrimp Pad Thai",
  "Chicken Gyros",
  "Lamb Tagine",
  "Beef Empanadas",
  "Chicken Spring Rolls",
  "Pork Fried Rice",
  "Veggie Quesadilla",
  "Chicken Korma",
  "Beef Tostadas",
  "Shrimp Ceviche",
  "Chicken Yakitori",
  "Pork Belly Bao",
  "Veggie Sushi",
  "Chicken Adobo",
  "Beef Rendang",
  "Shrimp Laksa",
  "Chicken Pho",
  "Pork Tonkatsu",
  "Veggie Paella",
  "Chicken Vindaloo",
  "Beef Bibimbap",
  "Shrimp Gumbo",
  "Chicken Tagine",
  "Pork Banh Mi",
  "Veggie Pad See Ew",
  "Chicken Cacciatore",
  "Beef Kofta",
  "Shrimp Risotto",
];

const ingredientsList = [
  [
    "2 cups pasta",
    "4 eggs",
    "1 cup parmesan",
    "6 slices bacon",
    "Black pepper",
    "Salt",
  ],
  [
    "2 lbs chicken breast",
    "1 cup yogurt",
    "2 tbsp garam masala",
    "1 can crushed tomatoes",
    "1 cup heavy cream",
    "4 cloves garlic",
    "2 inch ginger",
  ],
  [
    "8 oz rice noodles",
    "2 eggs",
    "1 cup bean sprouts",
    "3 tbsp fish sauce",
    "1/4 cup peanuts",
    "2 limes",
    "3 green onions",
  ],
  [
    "1 lb ground beef",
    "8 corn tortillas",
    "1 cup shredded cheese",
    "1 head lettuce",
    "2 tomatoes",
    "1/2 cup sour cream",
    "1 cup salsa",
  ],
  [
    "1 pizza dough",
    "1 cup tomato sauce",
    "8 oz fresh mozzarella",
    "Fresh basil leaves",
    "2 tbsp olive oil",
    "Salt",
  ],
  [
    "1 lb chicken thighs",
    "3 cups rice",
    "2 cups chicken broth",
    "1 onion",
    "3 cloves garlic",
    "2 tbsp soy sauce",
    "Mixed vegetables",
  ],
  [
    "2 lbs beef chuck",
    "2 cups red wine",
    "4 carrots",
    "2 onions",
    "3 cloves garlic",
    "Fresh thyme",
    "Bay leaves",
  ],
  [
    "1 lb ground lamb",
    "2 eggplants",
    "4 potatoes",
    "2 cups béchamel sauce",
    "1 onion",
    "2 tomatoes",
    "Cinnamon",
  ],
];

const instructionsList = [
  [
    "Boil pasta in salted water according to package directions",
    "Cook bacon in a large pan until crispy, then chop",
    "Mix eggs with parmesan cheese in a bowl",
    "Drain pasta and add to pan with bacon",
    "Remove from heat and add egg mixture, stirring quickly",
    "Season with black pepper and serve immediately",
  ],
  [
    "Marinate chicken in yogurt and spices for 2 hours",
    "Preheat oven to 400°F and grill chicken until cooked",
    "Make sauce by sautéing garlic and ginger",
    "Add tomatoes and cream, simmer for 10 minutes",
    "Add grilled chicken to sauce",
    "Garnish with cilantro and serve with rice",
  ],
  [
    "Soak rice noodles in warm water for 20 minutes",
    "Beat eggs and scramble in a wok",
    "Stir fry vegetables until tender",
    "Add drained noodles and fish sauce",
    "Toss everything together",
    "Top with peanuts, lime, and green onions",
  ],
  [
    "Brown ground beef with taco seasoning",
    "Warm tortillas in a dry pan",
    "Fill tortillas with seasoned beef",
    "Top with cheese, lettuce, tomatoes",
    "Add sour cream and salsa",
    "Serve immediately",
  ],
  [
    "Roll out pizza dough on a floured surface",
    "Spread tomato sauce evenly",
    "Tear mozzarella and distribute on pizza",
    "Bake at 450°F for 12-15 minutes",
    "Top with fresh basil leaves",
    "Drizzle with olive oil before serving",
  ],
];

async function seed() {
  console.log("🌱 Starting seed...");

  const USER_ID = "user_38ze3CiJQ9DoqnqjSgNl1tEkax9";

  try {
    // First, create all tags
    console.log("📌 Creating tags...");
    const createdTags: { [key: string]: number } = {};

    for (const tagName of allTags) {
      const [tag] = await db
        .insert(tags)
        .values({
          name: tagName,
        })
        .returning();
      createdTags[tagName] = tag.id;
      console.log(`  ✓ Created tag: ${tagName}`);
    }

    console.log("📝 Creating recipes...");

    for (let i = 0; i < 100; i++) {
      const recipeName =
        recipeNames[i % recipeNames.length] +
        (i >= recipeNames.length
          ? ` ${Math.floor(i / recipeNames.length) + 1}`
          : "");
      const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const difficulty =
        difficulties[Math.floor(Math.random() * difficulties.length)];

      // Insert recipe
      const [recipe] = await db
        .insert(recipes)
        .values({
          userId: USER_ID,
          title: recipeName,
          imageUrl: null,
          servings: Math.floor(Math.random() * 6) + 2,
          prepTime: Math.floor(Math.random() * 30) + 10,
          cookTime: Math.floor(Math.random() * 60) + 15,
          totalTime: Math.floor(Math.random() * 90) + 25,
          difficulty: difficulty,
          cuisine: cuisine,
          category: category,
          calories: Math.floor(Math.random() * 600) + 200,
          protein: Math.floor(Math.random() * 40) + 10,
          carbs: Math.floor(Math.random() * 60) + 20,
          fat: Math.floor(Math.random() * 30) + 5,
          source: sources[Math.floor(Math.random() * sources.length)],
          sourceUrl: null,
          isFavorite: Math.random() > 0.7,
          rating:
            Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 3 : null,
          notes: Math.random() > 0.7 ? "Great recipe! Family favorite." : null,
        })
        .returning();

      // Insert ingredients
      const ingredients = ingredientsList[i % ingredientsList.length];
      for (let j = 0; j < ingredients.length; j++) {
        await db.insert(recipeIngredients).values({
          recipeId: recipe.id,
          ingredient: ingredients[j],
          amount: ingredients[j].split(" ").slice(0, 2).join(" "),
          order: j + 1,
        });
      }

      // Insert instructions
      const instructions = instructionsList[i % instructionsList.length];
      for (let j = 0; j < instructions.length; j++) {
        await db.insert(recipeInstructions).values({
          recipeId: recipe.id,
          step: instructions[j],
          order: j + 1,
        });
      }

      // Add 3-6 random tags to each recipe
      const numTags = Math.floor(Math.random() * 4) + 3; // 3-6 tags
      const shuffledTags = [...allTags].sort(() => Math.random() - 0.5);
      const selectedTags = shuffledTags.slice(0, numTags);

      for (const tagName of selectedTags) {
        await db.insert(recipeTags).values({
          recipeId: recipe.id,
          tagId: createdTags[tagName],
        });
      }

      console.log(
        `✅ Created recipe ${i + 1}/100: ${recipeName} (${selectedTags.length} tags)`,
      );
    }

    console.log("🎉 Seed completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Created ${allTags.length} unique tags`);
    console.log(`   - Created 100 recipes`);
    console.log(`   - Each recipe has 3-6 tags`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
