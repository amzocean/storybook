// Story seed definitions — themes, titles, age ranges, author names
// Each batch of 20 picks randomly from this pool

export interface StorySeed {
  title: string;
  premise: string;
  category: string;
  detailLevel: number; // 1=ages 2-3, 2=4-5, 3=5-7, 4=7-9, 5=8-10
  pageCount: number;
  tags: string[];
}

// Diverse author names (random first+last combos)
export const FIRST_NAMES = [
  'Amira', 'Ben', 'Chloe', 'Davi', 'Elena', 'Finn', 'Grace', 'Hassan',
  'Isla', 'James', 'Kira', 'Leo', 'Maya', 'Noah', 'Olivia', 'Priya',
  'Quinn', 'Ravi', 'Sofia', 'Tariq', 'Uma', 'Victor', 'Willow', 'Xander',
  'Yuki', 'Zara', 'Aaliya', 'Beckett', 'Carmen', 'Diego', 'Evelyn', 'Farid',
  'Gemma', 'Hugo', 'Ines', 'Jasper', 'Keiko', 'Liam', 'Mila', 'Nico',
  'Orla', 'Pablo', 'Rosie', 'Sami', 'Talia', 'Uri', 'Vera', 'Wren',
];

export const LAST_NAMES = [
  'Ali', 'Brooks', 'Chen', 'Diaz', 'Evans', 'Fernandez', 'Garcia', 'Harper',
  'Ibrahim', 'Jensen', 'Kim', 'Lopez', 'Martin', 'Nakamura', 'Osei', 'Patel',
  'Quinn', 'Rivera', 'Singh', 'Taylor', 'Ueda', 'Vasquez', 'Williams', 'Xu',
  'Yamamoto', 'Zimmerman', 'Ahmad', 'Baker', 'Costa', 'Dubois', 'Eriksson',
  'Fontaine', 'Gonzalez', 'Huynh', 'Ivanova', 'Johansson', 'Khalil', 'Lee',
];

export function randomAuthor(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

// Master seed pool — 250+ story ideas across themes
export const STORY_SEEDS: StorySeed[] = [
  // === DINOSAURS (20) ===
  { title: "The Dinosaur Who Was Afraid of the Dark", premise: "A baby T-Rex discovers that nighttime isn't scary when you have friends by your side", category: "dinosaurs", detailLevel: 2, pageCount: 6, tags: ["bedtime", "fears", "friendship"] },
  { title: "Dino's First Day at Dino School", premise: "A nervous young triceratops makes unexpected friends on the first day of prehistoric school", category: "dinosaurs", detailLevel: 3, pageCount: 6, tags: ["school", "friendship", "anxiety"] },
  { title: "The Pterodactyl Who Couldn't Fly", premise: "A young pterodactyl with small wings learns that being different is a superpower", category: "dinosaurs", detailLevel: 3, pageCount: 7, tags: ["self-confidence", "being-different"] },
  { title: "Rex's Big Roar", premise: "A tiny T-Rex has a whisper-soft roar but finds a creative way to be heard", category: "dinosaurs", detailLevel: 2, pageCount: 6, tags: ["self-confidence", "creativity"] },
  { title: "The Dinosaur Egg Hunt", premise: "Three dinosaur siblings go on an adventure to find a mysterious golden egg in the jungle", category: "dinosaurs", detailLevel: 3, pageCount: 7, tags: ["adventure", "siblings", "mystery"] },
  { title: "Steggy's Sparkly Plates", premise: "A stegosaurus discovers her back plates can glow different colors based on her emotions", category: "dinosaurs", detailLevel: 2, pageCount: 6, tags: ["emotions", "self-discovery"] },
  { title: "The Dinosaur Who Loved to Dance", premise: "A brachiosaurus finds joy in dancing even though everyone says dinosaurs don't dance", category: "dinosaurs", detailLevel: 3, pageCount: 6, tags: ["dancing", "passion", "being-yourself"] },
  { title: "Volcano Valley Rescue", premise: "Brave dinosaur friends work together to save baby dinos from a rumbling volcano", category: "dinosaurs", detailLevel: 4, pageCount: 8, tags: ["teamwork", "bravery", "adventure"] },
  { title: "The Last Dinosaur's Garden", premise: "A gentle diplodocus plants a magical garden that brings color back to a gray world", category: "dinosaurs", detailLevel: 3, pageCount: 6, tags: ["nature", "hope", "gardening"] },
  { title: "Dino Dentist Day", premise: "A dinosaur dentist helps prehistoric creatures overcome their fear of tooth checkups", category: "dinosaurs", detailLevel: 2, pageCount: 6, tags: ["dentist", "fears", "funny"] },

  // === SPACE (20) ===
  { title: "Zara's Rocket to the Moon", premise: "A curious girl builds a rocket from cardboard boxes and imagines a real moon adventure", category: "space", detailLevel: 3, pageCount: 7, tags: ["imagination", "STEM", "adventure"] },
  { title: "The Star Who Lost Her Sparkle", premise: "A little star feels dim compared to others until she discovers her unique glow", category: "space", detailLevel: 2, pageCount: 6, tags: ["self-esteem", "being-different"] },
  { title: "Mission to Mars Playground", premise: "Kids transform their playground into a Mars mission, learning teamwork along the way", category: "space", detailLevel: 3, pageCount: 6, tags: ["teamwork", "imagination", "STEM"] },
  { title: "The Friendly Alien Next Door", premise: "A child discovers their new neighbor is a friendly alien learning Earth customs", category: "space", detailLevel: 3, pageCount: 7, tags: ["friendship", "diversity", "funny"] },
  { title: "Astronaut Ava's Space Garden", premise: "An astronaut grows the first flowers in space and learns about patience", category: "space", detailLevel: 3, pageCount: 6, tags: ["STEM", "patience", "nature"] },
  { title: "The Planet That Changed Colors", premise: "A magical planet changes color based on how visitors treat each other", category: "space", detailLevel: 3, pageCount: 7, tags: ["kindness", "consequences", "fantasy"] },
  { title: "Little Comet's Big Journey", premise: "A small comet travels across the galaxy making friends with different planets", category: "space", detailLevel: 2, pageCount: 6, tags: ["adventure", "friendship", "solar-system"] },
  { title: "The Robot on the Space Station", premise: "A lonely robot on a space station learns about feelings when human astronauts arrive", category: "space", detailLevel: 4, pageCount: 7, tags: ["emotions", "friendship", "robots"] },
  { title: "Stargazing with Grandpa", premise: "A child and grandpa look at stars together, each constellation sparking a mini adventure", category: "space", detailLevel: 3, pageCount: 6, tags: ["family", "grandparents", "imagination"] },
  { title: "The Moonbeam Express", premise: "A magical train made of moonlight takes sleepy children on a tour of the night sky", category: "space", detailLevel: 2, pageCount: 6, tags: ["bedtime", "fantasy", "adventure"] },

  // === BEDTIME (15) ===
  { title: "Sleepy Moon Train", premise: "A magical train picks up tired animals from the forest for a gentle ride to dreamland", category: "fairy-tales", detailLevel: 1, pageCount: 5, tags: ["bedtime", "animals", "gentle"] },
  { title: "The Cloud Pillow Factory", premise: "Tiny cloud workers fluff and shape the softest pillows for children around the world", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["bedtime", "fantasy", "gentle"] },
  { title: "When the Stars Sing Lullabies", premise: "Stars come alive at night and sing soft songs to help a restless bunny fall asleep", category: "fairy-tales", detailLevel: 1, pageCount: 5, tags: ["bedtime", "music", "animals"] },
  { title: "The Night Garden", premise: "Flowers that only bloom at night create a magical garden where dreams grow on vines", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["bedtime", "nature", "dreams"] },
  { title: "Mama Bear's Goodnight Hugs", premise: "Mama bear gives goodnight hugs to all the forest babies before they sleep", category: "animals", detailLevel: 1, pageCount: 5, tags: ["bedtime", "family", "animals"] },
  { title: "The Sandman's Sparkly Dust", premise: "A friendly sandman sprinkles dream dust that turns into mini adventures for sleeping children", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["bedtime", "dreams", "fantasy"] },
  { title: "Five Sleepy Owls", premise: "Five baby owls try to stay awake past bedtime but keep dozing off one by one", category: "animals", detailLevel: 1, pageCount: 5, tags: ["bedtime", "counting", "animals"] },
  { title: "The Yawning Moon", premise: "The moon gets so sleepy from watching over everyone that the stars must tuck HIM in", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["bedtime", "funny", "gentle"] },

  // === SIBLINGS (12) ===
  { title: "Twins Lost in Candy Jungle", premise: "Twin siblings discover a jungle made entirely of candy and must work together to find their way home", category: "adventure", detailLevel: 3, pageCount: 7, tags: ["siblings", "teamwork", "adventure"] },
  { title: "My Little Brother Is a Superhero", premise: "An older sister discovers her annoying little brother actually has secret superpowers", category: "adventure", detailLevel: 3, pageCount: 6, tags: ["siblings", "superheroes", "family"] },
  { title: "The Sharing Seesaw", premise: "Two siblings who hate sharing discover a magic seesaw that only works when they cooperate", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["siblings", "sharing", "cooperation"] },
  { title: "Big Sister's Secret Fort", premise: "A big sister reluctantly lets her younger sibling into her secret fort and finds it's more fun together", category: "adventure", detailLevel: 3, pageCount: 6, tags: ["siblings", "friendship", "sharing"] },
  { title: "The Brother and Sister Explorers", premise: "Siblings turn their backyard into different countries and go on world adventures together", category: "adventure", detailLevel: 3, pageCount: 7, tags: ["siblings", "imagination", "adventure"] },
  { title: "When Baby Came Home", premise: "A child adjusts to having a new baby sibling and discovers the joy of being a big kid", category: "animals", detailLevel: 2, pageCount: 6, tags: ["siblings", "new-baby", "family"] },

  // === FUNNY (15) ===
  { title: "The Chicken Who Became Principal", premise: "A chicken accidentally becomes the school principal and her egg-cellent ideas change everything", category: "funny", detailLevel: 3, pageCount: 7, tags: ["funny", "school", "animals"] },
  { title: "Grandma's Magical Fridge", premise: "Everything in grandma's fridge comes alive at night and throws parties", category: "funny", detailLevel: 3, pageCount: 6, tags: ["funny", "food", "grandparents"] },
  { title: "The Dog Who Ate Homework (For Real)", premise: "A dog really does eat homework and gains the knowledge — now he's smarter than the kids", category: "funny", detailLevel: 3, pageCount: 7, tags: ["funny", "school", "dogs"] },
  { title: "Backwards Day", premise: "A child wakes up and everything is backwards — dessert for breakfast, pajamas to school", category: "funny", detailLevel: 2, pageCount: 6, tags: ["funny", "silly", "adventure"] },
  { title: "The Sneeze That Changed the Weather", premise: "A girl's giant sneeze accidentally changes the weather every time she's about to sneeze", category: "funny", detailLevel: 3, pageCount: 6, tags: ["funny", "weather", "silly"] },
  { title: "My Dad Is a Secret Ninja", premise: "A kid discovers their clumsy dad is actually a secret ninja who protects the neighborhood", category: "funny", detailLevel: 3, pageCount: 7, tags: ["funny", "family", "dad"] },
  { title: "The Cat Who Ordered Pizza", premise: "A clever cat learns to use a phone and orders pizza for the whole neighborhood", category: "funny", detailLevel: 2, pageCount: 6, tags: ["funny", "cats", "food"] },
  { title: "Socks That Run Away", premise: "A child's socks keep escaping the laundry basket and going on tiny adventures around the house", category: "funny", detailLevel: 2, pageCount: 6, tags: ["funny", "silly", "adventure"] },
  { title: "The Burping Dragon", premise: "A dragon can't breathe fire — only burps bubbles — and saves the kingdom in an unexpected way", category: "funny", detailLevel: 3, pageCount: 7, tags: ["funny", "dragons", "being-different"] },
  { title: "Invisible for a Day", premise: "A kid turns invisible and thinks it'll be awesome, but quickly learns why being seen matters", category: "funny", detailLevel: 4, pageCount: 7, tags: ["funny", "lesson", "adventure"] },

  // === EID / RAMADAN / ISLAMIC THEMES (15) ===
  { title: "Amira's First Ramadan Fast", premise: "A young girl tries fasting for the first time during Ramadan and learns about patience and compassion", category: "learning", detailLevel: 3, pageCount: 7, tags: ["ramadan", "fasting", "family", "islamic"] },
  { title: "The Eid Surprise", premise: "Siblings plan a surprise Eid celebration for their grandparents with handmade gifts and decorations", category: "learning", detailLevel: 3, pageCount: 6, tags: ["eid", "family", "grandparents", "islamic"] },
  { title: "Yusuf's Eid Morning", premise: "A boy wakes up on Eid morning excited for new clothes, prayers, sweet treats, and visiting family", category: "learning", detailLevel: 2, pageCount: 6, tags: ["eid", "celebration", "family", "islamic"] },
  { title: "The Ramadan Moon", premise: "Children around the world look up at the same crescent moon to start Ramadan together", category: "learning", detailLevel: 2, pageCount: 6, tags: ["ramadan", "moon", "unity", "islamic"] },
  { title: "Sharing Iftar with Neighbors", premise: "A family invites their non-Muslim neighbors to iftar and shares the joy of breaking fast together", category: "learning", detailLevel: 3, pageCount: 6, tags: ["ramadan", "iftar", "friendship", "islamic", "diversity"] },
  { title: "The Giving Tree of Sadaqah", premise: "A magical tree grows bigger each time a child does a kind deed during Ramadan", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["ramadan", "charity", "kindness", "islamic"] },
  { title: "Layla's Eid Henna Party", premise: "A girl gets beautiful henna designs for Eid and each pattern tells a story of her wishes", category: "learning", detailLevel: 3, pageCount: 6, tags: ["eid", "henna", "culture", "islamic"] },
  { title: "The Dates Basket", premise: "A boy helps his grandmother prepare a basket of dates for neighbors, learning about generosity", category: "learning", detailLevel: 2, pageCount: 6, tags: ["ramadan", "generosity", "family", "islamic"] },
  { title: "Taraweeh with Baba", premise: "A child goes to the mosque with their father for nighttime prayers and feels the peace of community", category: "learning", detailLevel: 3, pageCount: 6, tags: ["ramadan", "prayer", "family", "islamic"] },
  { title: "The Boy Who Counted Blessings", premise: "During Ramadan, a boy starts counting his blessings and realizes how rich his life truly is", category: "learning", detailLevel: 3, pageCount: 7, tags: ["ramadan", "gratitude", "mindfulness", "islamic"] },
  { title: "Eid Around the World", premise: "Follow how children celebrate Eid in different countries — from Indonesia to Morocco to Canada", category: "learning", detailLevel: 4, pageCount: 8, tags: ["eid", "culture", "diversity", "islamic"] },
  { title: "Zakat's Magic Coins", premise: "A child's zakat coins magically show where they go — feeding families, building schools, planting trees", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["zakat", "charity", "islamic", "magic"] },
  { title: "The Mosque Cat", premise: "A friendly cat lives in the mosque and greets everyone who comes to pray", category: "animals", detailLevel: 2, pageCount: 6, tags: ["mosque", "cats", "community", "islamic"] },
  { title: "Suhoor with Mama", premise: "A little girl wakes up before dawn to have the pre-fast meal with her mama for the first time", category: "learning", detailLevel: 2, pageCount: 6, tags: ["ramadan", "suhoor", "family", "islamic"] },
  { title: "The Eid Gift Exchange", premise: "Cousins do a secret Eid gift exchange and learn that the best gifts come from the heart", category: "learning", detailLevel: 3, pageCount: 6, tags: ["eid", "gifts", "family", "islamic"] },

  // === LEGO / BUILDING (10) ===
  { title: "The LEGO City That Came Alive", premise: "A kid's LEGO city comes alive at night and the tiny people go on their own adventures", category: "adventure", detailLevel: 3, pageCount: 7, tags: ["lego", "building", "imagination", "adventure"] },
  { title: "Building My Dream Castle", premise: "A child builds the biggest LEGO castle ever and imagines being the brave knight who lives there", category: "adventure", detailLevel: 3, pageCount: 6, tags: ["lego", "building", "castles", "imagination"] },
  { title: "The Missing LEGO Piece", premise: "The most important piece of a LEGO spaceship goes missing and the search turns into an adventure", category: "adventure", detailLevel: 2, pageCount: 6, tags: ["lego", "mystery", "problem-solving"] },
  { title: "LEGO Robot Best Friend", premise: "A girl builds a LEGO robot that becomes her best friend and helper at school", category: "robots", detailLevel: 3, pageCount: 7, tags: ["lego", "robots", "friendship", "STEM"] },
  { title: "Block by Block", premise: "A child learns that big things are built one small block at a time — a story about patience and persistence", category: "learning", detailLevel: 2, pageCount: 6, tags: ["lego", "patience", "persistence", "lesson"] },
  { title: "The LEGO Bridge Challenge", premise: "Two friends must build a bridge strong enough to hold their toy cars — an engineering adventure", category: "learning", detailLevel: 4, pageCount: 7, tags: ["lego", "STEM", "engineering", "teamwork"] },

  // === DRAGONS (10) ===
  { title: "The Dragon Who Breathed Flowers", premise: "A dragon can't breathe fire — instead, flowers bloom wherever she breathes", category: "fantasy", detailLevel: 3, pageCount: 7, tags: ["dragons", "being-different", "nature"] },
  { title: "My Pet Dragon", premise: "A child finds a baby dragon egg and must figure out how to raise a dragon in a regular house", category: "fantasy", detailLevel: 3, pageCount: 7, tags: ["dragons", "pets", "funny", "adventure"] },
  { title: "Dragon School", premise: "Young dragons learn to fly, breathe fire, and most importantly — make friends", category: "fantasy", detailLevel: 3, pageCount: 6, tags: ["dragons", "school", "friendship"] },
  { title: "The Ice Dragon of the North", premise: "An ice dragon protects a village from a terrible snowstorm and earns the villagers' trust", category: "fantasy", detailLevel: 4, pageCount: 8, tags: ["dragons", "bravery", "trust", "winter"] },
  { title: "The Smallest Dragon", premise: "The tiniest dragon in the kingdom proves that size doesn't matter when your heart is big", category: "fantasy", detailLevel: 2, pageCount: 6, tags: ["dragons", "self-confidence", "courage"] },

  // === UNICORNS (10) ===
  { title: "The Unicorn's Rainbow Mane", premise: "A unicorn's mane changes color based on the kindness she spreads", category: "fantasy", detailLevel: 2, pageCount: 6, tags: ["unicorns", "kindness", "magic"] },
  { title: "Sparkle's First Magic Spell", premise: "A baby unicorn tries to learn her first magic spell but keeps getting it hilariously wrong", category: "fantasy", detailLevel: 2, pageCount: 6, tags: ["unicorns", "magic", "funny", "learning"] },
  { title: "The Secret Unicorn Forest", premise: "Two children discover a hidden forest where unicorns live and learn to protect nature", category: "fantasy", detailLevel: 3, pageCount: 7, tags: ["unicorns", "nature", "adventure", "environment"] },
  { title: "Unicorn and the Lost Star", premise: "A unicorn helps a fallen star find its way back to the sky", category: "fantasy", detailLevel: 2, pageCount: 6, tags: ["unicorns", "helping", "stars"] },
  { title: "The Unicorn Race", premise: "Unicorns compete in a magical race where the prize isn't speed — it's helping others along the way", category: "fantasy", detailLevel: 3, pageCount: 7, tags: ["unicorns", "sportsmanship", "kindness"] },

  // === TALKING ANIMALS (15) ===
  { title: "The Cat Who Could Talk", premise: "A cat suddenly starts talking and tells his family all the gossip from the neighborhood cats", category: "funny", detailLevel: 3, pageCount: 7, tags: ["animals", "cats", "funny", "talking-animals"] },
  { title: "Penguin's Pizza Shop", premise: "A penguin opens a pizza shop at the South Pole and all the animals want a slice", category: "funny", detailLevel: 2, pageCount: 6, tags: ["animals", "penguin", "food", "funny"] },
  { title: "The Brave Little Hamster", premise: "A tiny hamster goes on an epic journey across the house to bring medicine to a sick friend", category: "adventure", detailLevel: 3, pageCount: 7, tags: ["animals", "bravery", "friendship"] },
  { title: "Elephant Never Forgets (But Sometimes Wishes She Could)", premise: "An elephant remembers every embarrassing moment and learns that it's okay to laugh at yourself", category: "funny", detailLevel: 4, pageCount: 7, tags: ["animals", "elephant", "self-acceptance", "funny"] },
  { title: "The Bunny Who Shared Everything", premise: "A generous bunny shares so much that she has nothing left — then her friends surprise her", category: "animals", detailLevel: 2, pageCount: 6, tags: ["animals", "sharing", "kindness", "friendship"] },
  { title: "Owl's Night School", premise: "An owl teaches nocturnal animals how to read using stars as letters", category: "animals", detailLevel: 3, pageCount: 6, tags: ["animals", "reading", "learning", "nighttime"] },
  { title: "The Frog Prince of the Pond", premise: "A frog convinced he's royalty must learn to be humble when the other pond animals don't believe him", category: "funny", detailLevel: 3, pageCount: 6, tags: ["animals", "humility", "funny"] },
  { title: "Tortoise and Hare: The Rematch", premise: "Tortoise and Hare have a rematch but this time they must work together to finish the race", category: "animals", detailLevel: 3, pageCount: 7, tags: ["animals", "teamwork", "classic-tales"] },
  { title: "The Dog Who Could Paint", premise: "A golden retriever discovers he can paint with his tail and creates masterpieces", category: "funny", detailLevel: 2, pageCount: 6, tags: ["animals", "dogs", "art", "funny"] },
  { title: "Koala's Big Adventure", premise: "A koala who's afraid of heights must climb the tallest eucalyptus tree to help a friend", category: "animals", detailLevel: 3, pageCount: 6, tags: ["animals", "fears", "bravery"] },

  // === SCHOOL ANXIETY / FEARS (12) ===
  { title: "The Boy Who Was Nervous on First Day", premise: "A boy's stomach is full of butterflies on the first day of school until he meets someone just as nervous", category: "learning", detailLevel: 3, pageCount: 6, tags: ["school", "anxiety", "friendship", "first-day"] },
  { title: "Show and Tell Superpowers", premise: "A shy girl terrified of show-and-tell discovers that everyone has a special story to share", category: "learning", detailLevel: 3, pageCount: 7, tags: ["school", "shyness", "confidence"] },
  { title: "The Worry Monster", premise: "A child befriends the worry monster under the bed and teaches it to worry less", category: "fairy-tales", detailLevel: 3, pageCount: 6, tags: ["fears", "anxiety", "bedtime", "coping"] },
  { title: "New Kid in Class", premise: "A new student who doesn't speak the same language makes friends through drawing and kindness", category: "learning", detailLevel: 3, pageCount: 7, tags: ["school", "diversity", "friendship", "language"] },
  { title: "The Math Monster", premise: "A child who's afraid of math discovers it's like a puzzle game — and monsters love puzzles", category: "learning", detailLevel: 3, pageCount: 6, tags: ["school", "math", "fears", "STEM"] },
  { title: "Brave Enough to Try", premise: "A girl who's afraid of failing learns that trying is braver than being perfect", category: "learning", detailLevel: 4, pageCount: 7, tags: ["courage", "growth-mindset", "school"] },
  { title: "The Lunchbox Friend", premise: "A lonely kid at lunch discovers that an encouraging note from mom leads to making a new friend", category: "learning", detailLevel: 2, pageCount: 6, tags: ["school", "loneliness", "friendship", "family"] },
  { title: "Swimming Lesson Butterflies", premise: "A child terrified of water slowly learns to swim with a patient teacher and a rubber ducky", category: "learning", detailLevel: 2, pageCount: 6, tags: ["fears", "swimming", "patience", "sports"] },

  // === UNDERWATER (10) ===
  { title: "The Little Mermaid's Homework", premise: "A young mermaid must complete her homework about the human world by exploring the shore", category: "underwater", detailLevel: 3, pageCount: 7, tags: ["underwater", "adventure", "school", "mermaids"] },
  { title: "Submarine Sandwich Adventure", premise: "Kids ride a sandwich-shaped submarine to the ocean floor and discover amazing sea creatures", category: "underwater", detailLevel: 3, pageCount: 7, tags: ["underwater", "adventure", "funny", "science"] },
  { title: "The Seahorse Post Office", premise: "Seahorses deliver mail across the ocean, but one special letter needs to reach the deep sea", category: "underwater", detailLevel: 2, pageCount: 6, tags: ["underwater", "adventure", "seahorse"] },
  { title: "The Friendly Octopus", premise: "An octopus with 8 arms helps everyone in the coral reef at the same time", category: "underwater", detailLevel: 2, pageCount: 6, tags: ["underwater", "helping", "octopus"] },
  { title: "Coral Reef Colors", premise: "A plain gray fish discovers the colorful coral reef and learns that beauty is everywhere", category: "underwater", detailLevel: 2, pageCount: 6, tags: ["underwater", "nature", "beauty"] },

  // === PIRATES (8) ===
  { title: "The Pirate Who Said Please", premise: "A polite pirate uses manners instead of swords and becomes the most successful captain ever", category: "pirates", detailLevel: 3, pageCount: 7, tags: ["pirates", "manners", "funny"] },
  { title: "Treasure Island Daycare", premise: "A pirate captain runs a daycare on a tropical island and the kids teach him new things", category: "pirates", detailLevel: 3, pageCount: 6, tags: ["pirates", "funny", "learning"] },
  { title: "The Map to Friendship Cove", premise: "Young pirates follow a treasure map that leads not to gold but to the treasure of true friendship", category: "pirates", detailLevel: 3, pageCount: 7, tags: ["pirates", "friendship", "adventure"] },
  { title: "Pirate Parrot's Day Off", premise: "A pirate's parrot takes a vacation day and the ship falls apart without her help", category: "pirates", detailLevel: 2, pageCount: 6, tags: ["pirates", "funny", "animals"] },

  // === ROBOTS (8) ===
  { title: "The Robot Who Wanted a Heart", premise: "A helpful robot does everything perfectly but wonders what it would feel like to have feelings", category: "robots", detailLevel: 4, pageCount: 7, tags: ["robots", "emotions", "philosophy"] },
  { title: "Beep Boop's Birthday", premise: "A robot celebrates its first birthday and friends must figure out what gift a robot would like", category: "robots", detailLevel: 2, pageCount: 6, tags: ["robots", "friendship", "birthday", "funny"] },
  { title: "The Tiny Repair Robot", premise: "A small fix-it robot repairs broken toys at night when children are asleep", category: "robots", detailLevel: 2, pageCount: 6, tags: ["robots", "helping", "nighttime"] },
  { title: "Robot Goes to School", premise: "A robot student takes everything literally, causing hilarious misunderstandings at school", category: "robots", detailLevel: 3, pageCount: 7, tags: ["robots", "school", "funny"] },
  { title: "My Robot Grandma", premise: "When grandma gets a robot helper, the robot and grandma end up becoming best friends", category: "robots", detailLevel: 3, pageCount: 6, tags: ["robots", "grandparents", "friendship"] },

  // === FAIRY TALES / FANTASY (10) ===
  { title: "The Princess Who Built Bridges", premise: "Instead of waiting to be rescued, a princess builds bridges to connect her kingdom", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["princess", "STEM", "empowerment"] },
  { title: "The Boy Who Found a Magic Door", premise: "A door appears in a boy's bedroom wall, leading to a world where everything is made of music", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["magic", "music", "adventure"] },
  { title: "The Giant's Tiny Friend", premise: "A giant befriends a tiny mouse and learns that the best friendships come in all sizes", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["friendship", "size", "being-different"] },
  { title: "The Witch's Messy Kitchen", premise: "A young witch's kitchen experiments go hilariously wrong until she learns to follow the spell book", category: "fairy-tales", detailLevel: 3, pageCount: 6, tags: ["magic", "cooking", "funny", "learning"] },
  { title: "The Enchanted Library", premise: "Books in a magical library come to life at night and characters from different stories become friends", category: "fairy-tales", detailLevel: 4, pageCount: 8, tags: ["reading", "books", "magic", "adventure"] },
  { title: "The Kindness Kingdom", premise: "A kingdom where every act of kindness makes flowers grow — but unkind words make them wilt", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["kindness", "consequences", "kingdom"] },

  // === SPORTS (8) ===
  { title: "Soccer Stars", premise: "A team of misfit kids who've never won a game learn that having fun is the real victory", category: "sports", detailLevel: 3, pageCount: 7, tags: ["soccer", "teamwork", "sportsmanship"] },
  { title: "The Girl Who Could Fly (Almost)", premise: "A gymnast keeps falling but never gives up until she finally nails her routine", category: "sports", detailLevel: 3, pageCount: 7, tags: ["gymnastics", "persistence", "courage"] },
  { title: "Skateboard Park Adventure", premise: "A kid is the worst skater at the park but the best at encouraging everyone else", category: "sports", detailLevel: 3, pageCount: 6, tags: ["skateboarding", "encouragement", "friendship"] },
  { title: "The Swimming Turtle", premise: "A turtle wants to join the fish swimming team and proves slow and steady can be graceful too", category: "sports", detailLevel: 2, pageCount: 6, tags: ["swimming", "determination", "animals"] },

  // === PERSONALIZED NAME STYLE (10) ===
  { title: "Ayaan and the Flying Mango", premise: "A boy named Ayaan discovers a mango that can fly and together they deliver fruit to a hungry village", category: "adventure", detailLevel: 3, pageCount: 7, tags: ["adventure", "kindness", "food", "personalized"] },
  { title: "Luna's Magical Paintbrush", premise: "Everything Luna paints with her special brush comes to life, but she must use the power wisely", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["art", "magic", "responsibility", "personalized"] },
  { title: "Oliver's Time Machine Bike", premise: "Oliver's bicycle can travel through time and he visits dinosaurs, knights, and the future", category: "adventure", detailLevel: 4, pageCount: 8, tags: ["time-travel", "history", "adventure", "personalized"] },
  { title: "Fatima's Starlight Compass", premise: "Fatima receives a compass from her grandmother that points to wherever help is needed most", category: "adventure", detailLevel: 3, pageCount: 7, tags: ["adventure", "helping", "family", "personalized"] },
  { title: "Kai and the Talking Tree", premise: "Kai discovers the oldest tree in the park can talk, and it shares wisdom about being brave", category: "fairy-tales", detailLevel: 3, pageCount: 6, tags: ["nature", "wisdom", "courage", "personalized"] },
  { title: "Noor's Light", premise: "A girl named Noor (which means light) discovers she can glow in the dark and helps people in the night", category: "fantasy", detailLevel: 3, pageCount: 7, tags: ["magic", "helping", "being-different", "personalized"] },
  { title: "Mateo's Dinosaur Best Friend", premise: "A boy named Mateo finds a dinosaur egg at the park and raises it as his secret best friend", category: "dinosaurs", detailLevel: 3, pageCount: 7, tags: ["dinosaurs", "friendship", "pets", "personalized"] },
  { title: "Aria's Cloud Kingdom", premise: "Aria discovers she can walk on clouds and finds a whole kingdom of cloud people above her town", category: "fantasy", detailLevel: 3, pageCount: 7, tags: ["fantasy", "adventure", "discovery", "personalized"] },
  { title: "Zain's Magic Soccer Ball", premise: "Every time Zain kicks his special soccer ball, it grants a wish — but only for someone else", category: "sports", detailLevel: 3, pageCount: 6, tags: ["sports", "kindness", "magic", "personalized"] },
  { title: "Lily and the Moonlight Kitten", premise: "A girl finds a kitten that only appears during full moons and must discover its magical secret", category: "fairy-tales", detailLevel: 3, pageCount: 7, tags: ["cats", "mystery", "magic", "personalized"] },

  // === NATURE / ENVIRONMENT (8) ===
  { title: "The Seed That Could", premise: "A tiny seed planted by a child grows into a tree that becomes home to the whole neighborhood", category: "learning", detailLevel: 2, pageCount: 6, tags: ["nature", "patience", "environment", "gardening"] },
  { title: "The River's Journey", premise: "A raindrop follows a river from mountain to ocean, meeting amazing creatures along the way", category: "learning", detailLevel: 3, pageCount: 7, tags: ["nature", "science", "adventure", "water"] },
  { title: "Bee's Big Day", premise: "A bee shows a child how important every small creature is in making the world work", category: "animals", detailLevel: 2, pageCount: 6, tags: ["nature", "bees", "environment", "science"] },
  { title: "The Recycling Superheroes", premise: "Kids form a recycling squad and save their town from a garbage monster — one can at a time", category: "learning", detailLevel: 3, pageCount: 7, tags: ["environment", "recycling", "teamwork", "superheroes"] },

  // === EMOTIONS / FEELINGS (8) ===
  { title: "The Color of Feelings", premise: "A child discovers that emotions have colors and learns to paint with all of them", category: "learning", detailLevel: 2, pageCount: 6, tags: ["emotions", "art", "self-awareness"] },
  { title: "It's Okay to Cry", premise: "A boy learns that tears aren't weakness — they're how the heart talks when words aren't enough", category: "learning", detailLevel: 3, pageCount: 6, tags: ["emotions", "crying", "boys", "feelings"] },
  { title: "The Angry Volcano", premise: "A child with a big temper meets a volcano who teaches her healthy ways to let off steam", category: "learning", detailLevel: 3, pageCount: 7, tags: ["anger", "emotions", "coping", "volcano"] },
  { title: "Brave Heart Bear", premise: "A teddy bear comes alive to help a scared child face their fears one tiny step at a time", category: "fairy-tales", detailLevel: 2, pageCount: 6, tags: ["fears", "courage", "comfort", "teddy-bear"] },
  { title: "The Happiness Jar", premise: "A family fills a jar with happy moments written on paper and reads them on hard days", category: "learning", detailLevel: 3, pageCount: 6, tags: ["happiness", "family", "gratitude", "mindfulness"] },
];

export function pickRandomSeeds(count: number, alreadyUsedTitles: Set<string> = new Set()): StorySeed[] {
  const available = STORY_SEEDS.filter(s => !alreadyUsedTitles.has(s.title));
  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
