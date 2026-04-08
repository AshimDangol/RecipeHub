import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Recipe from '../models/Recipe.js'

await mongoose.connect(process.env.MONGODB_URI)

// ── Users ──────────────────────────────────────────────────────────────────
const usersData = [
  {
    email: 'gordon@recipenest.com',
    password: 'Gordon@1234',
    displayName: 'Gordon Ramsay',
    aboutMe: 'Michelin-starred chef passionate about bold flavours and perfect technique.',
  },
  {
    email: 'julia@recipenest.com',
    password: 'Julia@1234',
    displayName: 'Julia Child',
    aboutMe: 'Bringing French cuisine to the American home kitchen since forever.',
  },
  {
    email: 'jamie@recipenest.com',
    password: 'Jamie@1234',
    displayName: 'Jamie Oliver',
    aboutMe: 'Quick, fresh, and fuss-free food for everyone.',
  },
]

const createdUsers = []
for (const u of usersData) {
  let user = await User.findOne({ email: u.email })
  if (!user) {
    user = await User.create({
      email: u.email,
      passwordHash: await bcrypt.hash(u.password, 12),
      displayName: u.displayName,
      aboutMe: u.aboutMe,
    })
    console.log(`Created user: ${u.displayName}`)
  } else {
    console.log(`User already exists: ${u.displayName}`)
  }
  createdUsers.push(user)
}

const [gordon, julia, jamie] = createdUsers

// ── Recipes ────────────────────────────────────────────────────────────────
const recipesData = [
  {
    author: gordon._id,
    title: 'Beef Wellington',
    description: 'A classic British masterpiece — tender beef fillet wrapped in mushroom duxelles and golden puff pastry.',
    category: 'Dinner',
    difficulty: 'Hard',
    preparationTimeMinutes: 120,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    ingredients: [
      { name: 'Beef fillet', quantity: '800g', orderIndex: 0 },
      { name: 'Puff pastry', quantity: '500g', orderIndex: 1 },
      { name: 'Mushrooms', quantity: '400g', orderIndex: 2 },
      { name: 'Prosciutto', quantity: '8 slices', orderIndex: 3 },
      { name: 'Dijon mustard', quantity: '2 tbsp', orderIndex: 4 },
      { name: 'Egg', quantity: '2 (beaten)', orderIndex: 5 },
      { name: 'Garlic', quantity: '3 cloves', orderIndex: 6 },
      { name: 'Thyme', quantity: '4 sprigs', orderIndex: 7 },
      { name: 'Olive oil', quantity: '2 tbsp', orderIndex: 8 },
      { name: 'Salt & pepper', quantity: 'to taste', orderIndex: 9 },
    ],
    instructions: [
      { stepText: 'Season the beef fillet generously with salt and pepper. Sear in a hot oiled pan for 2 minutes on each side until browned all over. Brush with Dijon mustard and let cool.', orderIndex: 0 },
      { stepText: 'Blitz mushrooms, garlic, and thyme in a food processor. Cook the mixture in a dry pan until all moisture has evaporated. Season and let cool.', orderIndex: 1 },
      { stepText: 'Lay prosciutto slices overlapping on cling film. Spread mushroom duxelles over the prosciutto, then place the beef at the edge and roll tightly. Refrigerate for 30 minutes.', orderIndex: 2 },
      { stepText: 'Roll out puff pastry, unwrap the beef roll and place on the pastry. Wrap tightly, sealing the edges with egg wash. Score the top and brush with egg wash.', orderIndex: 3 },
      { stepText: 'Bake at 200°C (400°F) for 25–30 minutes until the pastry is golden. Rest for 10 minutes before slicing.', orderIndex: 4 },
    ],
  },
  {
    author: gordon._id,
    title: 'Pan-Seared Salmon with Lemon Butter',
    description: 'Crispy-skinned salmon with a silky lemon butter sauce. Ready in 20 minutes.',
    category: 'Dinner',
    difficulty: 'Easy',
    preparationTimeMinutes: 20,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
    ingredients: [
      { name: 'Salmon fillets', quantity: '4 (skin-on)', orderIndex: 0 },
      { name: 'Butter', quantity: '3 tbsp', orderIndex: 1 },
      { name: 'Lemon', quantity: '1 (juiced)', orderIndex: 2 },
      { name: 'Garlic', quantity: '2 cloves (minced)', orderIndex: 3 },
      { name: 'Fresh dill', quantity: '2 tbsp', orderIndex: 4 },
      { name: 'Olive oil', quantity: '1 tbsp', orderIndex: 5 },
      { name: 'Salt & pepper', quantity: 'to taste', orderIndex: 6 },
    ],
    instructions: [
      { stepText: 'Pat salmon dry and season both sides with salt and pepper.', orderIndex: 0 },
      { stepText: 'Heat olive oil in a pan over high heat. Place salmon skin-side down and press gently. Cook for 4 minutes until skin is crispy.', orderIndex: 1 },
      { stepText: 'Flip and cook for 2 more minutes. Remove salmon and set aside.', orderIndex: 2 },
      { stepText: 'Reduce heat to medium. Add butter and garlic to the pan, cook for 1 minute. Add lemon juice and dill, stir to combine.', orderIndex: 3 },
      { stepText: 'Pour the lemon butter sauce over the salmon and serve immediately.', orderIndex: 4 },
    ],
  },
  {
    author: julia._id,
    title: 'Beef Bourguignon',
    description: 'The ultimate French comfort food — slow-braised beef in red wine with mushrooms, pearl onions, and bacon.',
    category: 'Dinner',
    difficulty: 'Medium',
    preparationTimeMinutes: 180,
    imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800',
    ingredients: [
      { name: 'Beef chuck', quantity: '1.5kg (cubed)', orderIndex: 0 },
      { name: 'Red wine (Burgundy)', quantity: '750ml', orderIndex: 1 },
      { name: 'Bacon lardons', quantity: '200g', orderIndex: 2 },
      { name: 'Pearl onions', quantity: '200g', orderIndex: 3 },
      { name: 'Mushrooms', quantity: '300g', orderIndex: 4 },
      { name: 'Carrots', quantity: '3 (sliced)', orderIndex: 5 },
      { name: 'Beef stock', quantity: '500ml', orderIndex: 6 },
      { name: 'Tomato paste', quantity: '2 tbsp', orderIndex: 7 },
      { name: 'Garlic', quantity: '4 cloves', orderIndex: 8 },
      { name: 'Thyme & bay leaves', quantity: '1 bouquet garni', orderIndex: 9 },
      { name: 'Flour', quantity: '2 tbsp', orderIndex: 10 },
      { name: 'Butter', quantity: '2 tbsp', orderIndex: 11 },
    ],
    instructions: [
      { stepText: 'Marinate beef in wine with carrots, garlic, and bouquet garni overnight in the fridge.', orderIndex: 0 },
      { stepText: 'Remove beef and pat dry. Brown in batches in a Dutch oven with butter. Set aside.', orderIndex: 1 },
      { stepText: 'Cook bacon lardons until crispy. Add tomato paste and flour, stir for 1 minute.', orderIndex: 2 },
      { stepText: 'Return beef to the pot. Add the marinade wine, stock, and vegetables. Bring to a simmer.', orderIndex: 3 },
      { stepText: 'Cover and braise in the oven at 160°C (325°F) for 2.5 hours. Add mushrooms and pearl onions in the last 30 minutes. Adjust seasoning and serve with crusty bread.', orderIndex: 4 },
    ],
  },
  {
    author: julia._id,
    title: 'Classic French Omelette',
    description: 'Silky, pale, and perfectly rolled — the French omelette is the ultimate test of technique.',
    category: 'Breakfast',
    difficulty: 'Medium',
    preparationTimeMinutes: 10,
    imageUrl: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800',
    ingredients: [
      { name: 'Eggs', quantity: '3 large', orderIndex: 0 },
      { name: 'Butter', quantity: '1 tbsp', orderIndex: 1 },
      { name: 'Fresh chives', quantity: '1 tbsp (chopped)', orderIndex: 2 },
      { name: 'Salt', quantity: 'pinch', orderIndex: 3 },
    ],
    instructions: [
      { stepText: 'Crack eggs into a bowl, add a pinch of salt, and beat vigorously with a fork until fully combined.', orderIndex: 0 },
      { stepText: 'Heat butter in a non-stick pan over medium-high heat until foaming but not browning.', orderIndex: 1 },
      { stepText: 'Pour in eggs and immediately stir rapidly with a fork while shaking the pan. Keep the eggs moving.', orderIndex: 2 },
      { stepText: 'When eggs are just set but still slightly wet, stop stirring. Tilt the pan and roll the omelette onto a plate. It should be pale yellow with no colour.', orderIndex: 3 },
      { stepText: 'Garnish with fresh chives and serve immediately.', orderIndex: 4 },
    ],
  },
  {
    author: jamie._id,
    title: 'Spaghetti Carbonara',
    description: 'The real deal — no cream, just eggs, Pecorino, guanciale, and pasta water magic.',
    category: 'Dinner',
    difficulty: 'Medium',
    preparationTimeMinutes: 25,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    ingredients: [
      { name: 'Spaghetti', quantity: '400g', orderIndex: 0 },
      { name: 'Guanciale (or pancetta)', quantity: '200g', orderIndex: 1 },
      { name: 'Egg yolks', quantity: '4', orderIndex: 2 },
      { name: 'Whole egg', quantity: '1', orderIndex: 3 },
      { name: 'Pecorino Romano', quantity: '80g (grated)', orderIndex: 4 },
      { name: 'Black pepper', quantity: '2 tsp (coarsely ground)', orderIndex: 5 },
      { name: 'Salt', quantity: 'for pasta water', orderIndex: 6 },
    ],
    instructions: [
      { stepText: 'Cook spaghetti in well-salted boiling water until al dente. Reserve 1 cup of pasta water before draining.', orderIndex: 0 },
      { stepText: 'Meanwhile, cook guanciale in a cold pan over medium heat until crispy and the fat has rendered. Remove from heat.', orderIndex: 1 },
      { stepText: 'Whisk egg yolks, whole egg, and Pecorino together in a bowl. Season with black pepper.', orderIndex: 2 },
      { stepText: 'Add hot drained pasta to the guanciale pan (off heat). Toss to coat in the fat.', orderIndex: 3 },
      { stepText: 'Add the egg mixture and a splash of pasta water. Toss vigorously — the residual heat will cook the eggs into a creamy sauce. Add more pasta water as needed. Serve immediately with extra Pecorino.', orderIndex: 4 },
    ],
  },
  {
    author: jamie._id,
    title: '15-Minute Chicken Stir Fry',
    description: 'Fast, colourful, and packed with flavour. Perfect weeknight dinner.',
    category: 'Dinner',
    difficulty: 'Easy',
    preparationTimeMinutes: 15,
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
    ingredients: [
      { name: 'Chicken breast', quantity: '500g (sliced)', orderIndex: 0 },
      { name: 'Bell peppers', quantity: '2 (sliced)', orderIndex: 1 },
      { name: 'Broccoli', quantity: '200g (florets)', orderIndex: 2 },
      { name: 'Soy sauce', quantity: '3 tbsp', orderIndex: 3 },
      { name: 'Oyster sauce', quantity: '2 tbsp', orderIndex: 4 },
      { name: 'Sesame oil', quantity: '1 tsp', orderIndex: 5 },
      { name: 'Garlic', quantity: '3 cloves (minced)', orderIndex: 6 },
      { name: 'Ginger', quantity: '1 tsp (grated)', orderIndex: 7 },
      { name: 'Cornstarch', quantity: '1 tbsp', orderIndex: 8 },
      { name: 'Vegetable oil', quantity: '2 tbsp', orderIndex: 9 },
    ],
    instructions: [
      { stepText: 'Toss chicken slices with cornstarch, a pinch of salt, and 1 tbsp soy sauce. Set aside.', orderIndex: 0 },
      { stepText: 'Heat oil in a wok over high heat until smoking. Add chicken and stir fry for 3–4 minutes until golden. Remove and set aside.', orderIndex: 1 },
      { stepText: 'Add garlic and ginger to the wok, stir for 30 seconds. Add broccoli and peppers, stir fry for 3 minutes.', orderIndex: 2 },
      { stepText: 'Return chicken to the wok. Add remaining soy sauce, oyster sauce, and a splash of water. Toss everything together for 1 minute.', orderIndex: 3 },
      { stepText: 'Drizzle with sesame oil, toss once more, and serve over steamed rice.', orderIndex: 4 },
    ],
  },
  {
    author: gordon._id,
    title: 'Scrambled Eggs on Toast',
    description: 'Gordon\'s famous soft scrambled eggs — low and slow is the secret.',
    category: 'Breakfast',
    difficulty: 'Easy',
    preparationTimeMinutes: 10,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    ingredients: [
      { name: 'Eggs', quantity: '6 large', orderIndex: 0 },
      { name: 'Butter', quantity: '2 tbsp', orderIndex: 1 },
      { name: 'Crème fraîche', quantity: '1 tbsp', orderIndex: 2 },
      { name: 'Chives', quantity: '1 tbsp (chopped)', orderIndex: 3 },
      { name: 'Sourdough bread', quantity: '2 slices (toasted)', orderIndex: 4 },
      { name: 'Salt & pepper', quantity: 'to taste', orderIndex: 5 },
    ],
    instructions: [
      { stepText: 'Crack eggs into a cold non-stick pan. Add butter. Do not whisk yet.', orderIndex: 0 },
      { stepText: 'Place over medium-low heat and stir continuously with a rubber spatula, moving the eggs around the pan.', orderIndex: 1 },
      { stepText: 'Every 30 seconds, take the pan off the heat and keep stirring. This controls the temperature and keeps the eggs soft.', orderIndex: 2 },
      { stepText: 'When eggs are just barely set and still glossy, remove from heat. Stir in crème fraîche to stop the cooking. Season with salt and pepper.', orderIndex: 3 },
      { stepText: 'Spoon over toasted sourdough and garnish with chives. Serve immediately.', orderIndex: 4 },
    ],
  },
  {
    author: julia._id,
    title: 'Chocolate Mousse',
    description: 'Light, airy, and intensely chocolatey. A timeless French dessert.',
    category: 'Dessert',
    difficulty: 'Medium',
    preparationTimeMinutes: 30,
    imageUrl: 'https://images.unsplash.com/photo-1511715282680-fbf93a50e721?w=800',
    ingredients: [
      { name: 'Dark chocolate (70%)', quantity: '200g', orderIndex: 0 },
      { name: 'Eggs', quantity: '4 (separated)', orderIndex: 1 },
      { name: 'Sugar', quantity: '50g', orderIndex: 2 },
      { name: 'Heavy cream', quantity: '200ml', orderIndex: 3 },
      { name: 'Butter', quantity: '30g', orderIndex: 4 },
      { name: 'Pinch of salt', quantity: '1 pinch', orderIndex: 5 },
    ],
    instructions: [
      { stepText: 'Melt chocolate and butter together in a bowl over simmering water. Let cool slightly.', orderIndex: 0 },
      { stepText: 'Whisk egg yolks with sugar until pale and thick. Fold into the cooled chocolate.', orderIndex: 1 },
      { stepText: 'Whip cream to soft peaks. Fold gently into the chocolate mixture.', orderIndex: 2 },
      { stepText: 'Beat egg whites with a pinch of salt to stiff peaks. Fold carefully into the mixture in three additions.', orderIndex: 3 },
      { stepText: 'Divide into glasses and refrigerate for at least 2 hours before serving.', orderIndex: 4 },
    ],
  },
  {
    author: jamie._id,
    title: 'Avocado Toast with Poached Egg',
    description: 'The brunch classic done right — creamy avocado, runny poached egg, chilli flakes.',
    category: 'Breakfast',
    difficulty: 'Easy',
    preparationTimeMinutes: 15,
    imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800',
    ingredients: [
      { name: 'Sourdough bread', quantity: '2 thick slices', orderIndex: 0 },
      { name: 'Ripe avocado', quantity: '1 large', orderIndex: 1 },
      { name: 'Eggs', quantity: '2 large', orderIndex: 2 },
      { name: 'Lemon juice', quantity: '1 tsp', orderIndex: 3 },
      { name: 'Chilli flakes', quantity: 'pinch', orderIndex: 4 },
      { name: 'White wine vinegar', quantity: '1 tbsp', orderIndex: 5 },
      { name: 'Salt & pepper', quantity: 'to taste', orderIndex: 6 },
    ],
    instructions: [
      { stepText: 'Toast the sourdough until golden and crispy.', orderIndex: 0 },
      { stepText: 'Mash avocado with lemon juice, salt, and pepper. Spread generously over the toast.', orderIndex: 1 },
      { stepText: 'Bring a pan of water to a gentle simmer. Add vinegar. Crack each egg into a small cup.', orderIndex: 2 },
      { stepText: 'Create a gentle whirlpool in the water and slide in the eggs. Poach for 3 minutes for a runny yolk.', orderIndex: 3 },
      { stepText: 'Place poached eggs on the avocado toast. Season with chilli flakes, salt, and pepper. Serve immediately.', orderIndex: 4 },
    ],
  },
]

let created = 0, skipped = 0
for (const r of recipesData) {
  const exists = await Recipe.findOne({ title: r.title, author: r.author })
  if (!exists) {
    await Recipe.create(r)
    created++
  } else {
    skipped++
  }
}

console.log(`\nDone. ${created} recipes created, ${skipped} already existed.`)
console.log('\nUser credentials:')
for (const u of usersData) {
  console.log(`  ${u.displayName.padEnd(15)} ${u.email}  /  ${u.password}`)
}

await mongoose.disconnect()
