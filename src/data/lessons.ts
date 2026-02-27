import type { SlideTheme } from "@/components/SlideRenderer";

export interface Question {
  highlight: string;
  question: string;
  type: "choice" | "text";
  options?: [string, string];
  answer: string;
  reinforcement: string;
  correction: string;
  difficulty: "easy" | "medium" | "hard";
  topic?: string;
  source?: "slides" | "transcript";
}

export interface Section {
  title: string;
  content: string;
  layout: "title" | "content" | "two-column" | "quote";
  bullets?: string[];
  speakerNotes?: string;
  image?: string;
  questions: Question[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: "STEM" | "Humanities";
  icon: string;
  theme?: SlideTheme;
  sections: Section[];
}

export const lessons: Lesson[] = [
  {
    id: "photosynthesis",
    title: "Photosynthesis: How Plants Make Food",
    subject: "STEM",
    icon: "🌿",
    theme: "ocean",
    sections: [
      {
        title: "Photosynthesis: How Plants Make Food",
        layout: "title",
        content: "Understanding how green plants convert sunlight into chemical energy — the foundation of life on Earth.",
        speakerNotes: "Welcome everyone. Today we'll explore one of the most important biochemical processes on the planet.",
        questions: [],
      },
      {
        title: "What is Photosynthesis?",
        layout: "content",
        content: "Photosynthesis is the process by which green plants convert sunlight into chemical energy. Plants absorb light using a pigment called chlorophyll, which is found in organelles called chloroplasts.",
        bullets: [
          "Overall equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
          "Inputs: Carbon dioxide + Water + Light energy",
          "Outputs: Glucose + Oxygen",
          "Occurs in chloroplasts containing chlorophyll",
        ],
        speakerNotes: "Emphasize the equation — students should memorize it. Highlight that oxygen is a byproduct, not the main goal.",
        questions: [
          {
            highlight: "chlorophyll",
            question: "What pigment do plants use to absorb light?",
            type: "choice",
            options: ["Chlorophyll", "Melanin"],
            answer: "Chlorophyll",
            reinforcement: "Chlorophyll absorbs mainly blue and red light, reflecting green — that's why leaves look green!",
            correction: "Melanin is found in human skin. Plants use chlorophyll to capture light energy.",
            difficulty: "easy",
          },
          {
            highlight: "carbon dioxide and water",
            question: "What are the two raw inputs of photosynthesis?",
            type: "choice",
            options: ["CO₂ & H₂O", "O₂ & Glucose"],
            answer: "CO₂ & H₂O",
            reinforcement: "Carbon dioxide enters through tiny leaf pores called stomata, while water is absorbed by roots.",
            correction: "Oxygen and glucose are the outputs, not inputs.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "The Light Reactions",
        layout: "two-column",
        content: "The light-dependent reactions occur in the thylakoid membranes of chloroplasts. When photons strike chlorophyll, electrons are excited and passed along an electron transport chain.",
        bullets: [
          "Location: Thylakoid membranes",
          "Process: Photolysis splits water → releases O₂",
          "Energy carriers produced: ATP & NADPH",
          "Requires direct sunlight",
        ],
        speakerNotes: "Use the two-column layout to contrast location vs. process.",
        questions: [
          {
            highlight: "thylakoid membranes",
            question: "Where do light reactions take place?",
            type: "choice",
            options: ["Thylakoids", "Cell wall"],
            answer: "Thylakoids",
            reinforcement: "Thylakoids are stacked like coins inside chloroplasts — these stacks are called grana.",
            correction: "The cell wall provides structure. Light reactions happen on the thylakoid membranes.",
            difficulty: "easy",
          },
          {
            highlight: "ATP and NADPH",
            question: "Name one energy carrier produced in the light reactions.",
            type: "text",
            answer: "ATP",
            reinforcement: "ATP is like a rechargeable battery that cells use to power chemical reactions.",
            correction: "The two energy carriers are ATP and NADPH.",
            difficulty: "hard",
          },
        ],
      },
      {
        title: "The Calvin Cycle",
        layout: "content",
        content: "The Calvin cycle (light-independent reactions) takes place in the stroma of chloroplasts. It uses ATP and NADPH from the light reactions to fix CO₂ into a 3-carbon molecule called G3P.",
        bullets: [
          "Location: Stroma of chloroplasts",
          "Uses ATP + NADPH from light reactions",
          "Fixes CO₂ into G3P (3-carbon molecule)",
          "3 turns → 1 G3P molecule → combined into glucose",
          "Key enzyme: RuBisCO (most abundant protein on Earth)",
        ],
        speakerNotes: "Stress that 'light-independent' doesn't mean it happens in the dark — it just doesn't directly need photons.",
        questions: [
          {
            highlight: "stroma",
            question: "The Calvin cycle occurs in the _____ of chloroplasts.",
            type: "text",
            answer: "stroma",
            reinforcement: "The stroma is the fluid-filled space surrounding the thylakoids.",
            correction: "The Calvin cycle runs in the stroma, not on the thylakoids.",
            difficulty: "medium",
          },
          {
            highlight: "RuBisCO",
            question: "What enzyme kicks off carbon fixation?",
            type: "choice",
            options: ["RuBisCO", "Amylase"],
            answer: "RuBisCO",
            reinforcement: "RuBisCO is the most abundant protein on Earth!",
            correction: "Amylase breaks down starch. RuBisCO fixes CO₂ in the Calvin cycle.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "Factors Affecting Photosynthesis",
        layout: "two-column",
        content: "The rate of photosynthesis depends on several environmental factors. Understanding these helps explain why plants grow differently in different conditions.",
        bullets: [
          "Light intensity → more photons = faster rate (to a point)",
          "CO₂ concentration → more carbon = more fixation",
          "Temperature → enzymes work best at 25-35°C",
          "Water availability → needed for photolysis",
          "Too much heat denatures enzymes",
          "Limiting factor principle applies",
        ],
        speakerNotes: "Great opportunity to discuss real-world applications: greenhouses control these factors to maximize growth.",
        questions: [
          {
            highlight: "limiting factor",
            question: "What principle determines the overall rate when multiple factors are involved?",
            type: "choice",
            options: ["Limiting factor", "Maximum yield"],
            answer: "Limiting factor",
            reinforcement: "The slowest factor 'limits' the overall rate — like a chain being only as strong as its weakest link.",
            correction: "The limiting factor principle says the scarcest resource determines the rate.",
            difficulty: "hard",
          },
        ],
      },
      {
        title: "Key Takeaways",
        layout: "quote",
        content: "Photosynthesis is the foundation of nearly all food chains on Earth. Without it, there would be no oxygen for us to breathe and no food for us to eat.",
        bullets: [
          "Light reactions: thylakoids → O₂ + ATP + NADPH",
          "Calvin cycle: stroma → glucose",
          "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
          "Environmental factors regulate the rate",
        ],
        speakerNotes: "Summarize and invite questions. Remind students of the exam format.",
        questions: [],
      },
    ],
  },
  {
    id: "renaissance",
    title: "The Renaissance: A Rebirth of Ideas",
    subject: "Humanities",
    icon: "🎨",
    theme: "warm",
    sections: [
      {
        title: "The Renaissance: A Rebirth of Ideas",
        layout: "title",
        content: "Exploring the cultural revolution that transformed Europe — from art and science to philosophy and politics.",
        speakerNotes: "Set the stage: the Renaissance wasn't just about pretty paintings.",
        questions: [],
      },
      {
        title: "Origins of the Renaissance",
        layout: "content",
        content: "The Renaissance began in 14th-century Italy, particularly in wealthy city-states like Florence, Venice, and Rome. The word 'Renaissance' means 'rebirth' in French.",
        bullets: [
          "Started in 14th-century Italy (Florence, Venice, Rome)",
          "'Renaissance' = 'Rebirth' (French)",
          "Revival of classical Greek & Roman culture",
          "Funded by wealthy patrons like the Medici family",
          "Florence = cradle of the cultural revolution",
        ],
        speakerNotes: "Mention that Florence's wealth came from banking and trade.",
        questions: [
          {
            highlight: "rebirth",
            question: "What does the word 'Renaissance' literally mean?",
            type: "choice",
            options: ["Rebirth", "Revolution"],
            answer: "Rebirth",
            reinforcement: "It refers to the 'rebirth' of classical learning from ancient Greece and Rome.",
            correction: "While it was revolutionary, the word directly translates to 'rebirth' from French.",
            difficulty: "easy",
          },
          {
            highlight: "Medici family",
            question: "Which powerful family were major patrons in Florence?",
            type: "text",
            answer: "Medici",
            reinforcement: "The Medici sponsored Leonardo, Michelangelo, and Botticelli!",
            correction: "The Medici family bankrolled much of the Florentine Renaissance.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "Art and Innovation",
        layout: "two-column",
        content: "Renaissance artists revolutionized art with techniques like linear perspective, chiaroscuro (light and shadow), and anatomical accuracy.",
        bullets: [
          "Linear perspective → depth & realism",
          "Chiaroscuro → dramatic light & shadow",
          "Leonardo da Vinci: Mona Lisa, The Last Supper",
          "Michelangelo: Sistine Chapel ceiling (4 years)",
          "Artists doubled as scientists & engineers",
        ],
        speakerNotes: "Leonardo's flying machines show the Renaissance ideal of the 'universal man.'",
        questions: [
          {
            highlight: "linear perspective",
            question: "Which technique gave Renaissance paintings a sense of depth?",
            type: "choice",
            options: ["Linear perspective", "Pointillism"],
            answer: "Linear perspective",
            reinforcement: "Brunelleschi demonstrated perspective around 1415.",
            correction: "Pointillism came much later (1880s).",
            difficulty: "easy",
          },
          {
            highlight: "Sistine Chapel ceiling",
            question: "How many years did it take Michelangelo to paint the Sistine Chapel ceiling?",
            type: "choice",
            options: ["4 years", "10 years"],
            answer: "4 years",
            reinforcement: "Michelangelo painted it mostly lying on scaffolding!",
            correction: "It took about 4 years (1508–1512).",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "The Spread of Ideas",
        layout: "content",
        content: "The Renaissance didn't stay in Italy. Through trade routes, diplomacy, and new technology, these ideas spread across all of Europe.",
        bullets: [
          "Northern Renaissance: Van Eyck, Dürer, Erasmus",
          "England: Shakespeare, Francis Bacon",
          "France: Rabelais, Montaigne",
          "Spain: Cervantes (Don Quixote)",
          "Each region adapted Renaissance ideals to local culture",
        ],
        speakerNotes: "Compare how different regions adapted the ideas — it wasn't a copy-paste.",
        questions: [
          {
            highlight: "Northern Renaissance",
            question: "Which artist pioneered oil painting techniques in the Northern Renaissance?",
            type: "choice",
            options: ["Van Eyck", "Raphael"],
            answer: "Van Eyck",
            reinforcement: "Jan van Eyck perfected oil paint techniques that allowed incredible detail and luminosity.",
            correction: "Raphael was Italian. Van Eyck was the Northern master of oil painting.",
            difficulty: "hard",
          },
        ],
      },
      {
        title: "Legacy and Spread",
        layout: "quote",
        content: "The printing press invented by Johannes Gutenberg around 1440 became the ultimate multiplier of Renaissance ideas. Humanism — the belief in human potential — became the intellectual foundation of the era.",
        bullets: [
          "Gutenberg's printing press (c. 1440) → affordable books",
          "Ideas spread via trade routes & diplomacy",
          "Humanism: focus on human potential & classical texts",
          "Influenced education, politics, and religion for centuries",
        ],
        speakerNotes: "End with the printing press as a technology multiplier — compare to the internet.",
        questions: [
          {
            highlight: "printing press",
            question: "Who invented the printing press that spread Renaissance ideas?",
            type: "text",
            answer: "Gutenberg",
            reinforcement: "Gutenberg's press could produce 3,600 pages per day!",
            correction: "Johannes Gutenberg invented the movable-type printing press around 1440.",
            difficulty: "medium",
          },
          {
            highlight: "Humanism",
            question: "What intellectual movement focused on human potential and classical texts?",
            type: "choice",
            options: ["Humanism", "Feudalism"],
            answer: "Humanism",
            reinforcement: "Humanists like Petrarch studied ancient texts to understand the good life.",
            correction: "Feudalism was the medieval political system. Humanism was the core philosophy.",
            difficulty: "easy",
          },
        ],
      },
      {
        title: "Renaissance Timeline",
        layout: "two-column",
        content: "The Renaissance spanned roughly 300 years, evolving through distinct phases that each built upon the last.",
        bullets: [
          "Proto-Renaissance: 1300s — Giotto, Petrarch",
          "Early Renaissance: 1400s — Brunelleschi, Donatello",
          "High Renaissance: 1490-1527 — Leonardo, Michelangelo, Raphael",
          "Late Renaissance: 1527-1600 — Mannerism emerges",
          "Northern Renaissance: 1450-1600 — parallel development",
          "End: 1600s — Baroque period begins",
        ],
        speakerNotes: "This timeline helps students see the progression. The High Renaissance is the 'golden age' they should know best.",
        questions: [
          {
            highlight: "High Renaissance",
            question: "During which period did Leonardo, Michelangelo, and Raphael all work?",
            type: "choice",
            options: ["High Renaissance", "Early Renaissance"],
            answer: "High Renaissance",
            reinforcement: "The High Renaissance (1490-1527) is considered the peak of artistic achievement.",
            correction: "The Early Renaissance laid the groundwork, but the three masters worked during the High Renaissance.",
            difficulty: "medium",
          },
        ],
      },
    ],
  },
  {
    id: "gravity",
    title: "Gravity & Motion: Newton's Laws",
    subject: "STEM",
    icon: "🍎",
    theme: "dark",
    sections: [
      {
        title: "Gravity & Motion: Newton's Laws",
        layout: "title",
        content: "From falling apples to orbiting planets — understanding the fundamental forces that govern all motion in the universe.",
        speakerNotes: "Open with the famous apple story — even if it's partially myth, it hooks students.",
        questions: [],
      },
      {
        title: "Newton's First Law: Inertia",
        layout: "content",
        content: "An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force.",
        bullets: [
          "Also called the Law of Inertia",
          "Objects resist changes to their state of motion",
          "Mass = measure of inertia (more mass = harder to move/stop)",
          "Example: seatbelts — your body keeps moving when the car stops",
          "Galileo first proposed it; Newton formalized it",
        ],
        speakerNotes: "Use everyday examples: sliding on ice, objects flying off a spinning merry-go-round.",
        questions: [
          {
            highlight: "inertia",
            question: "What property of matter resists changes in motion?",
            type: "choice",
            options: ["Inertia", "Gravity"],
            answer: "Inertia",
            reinforcement: "Inertia is why you lurch forward when a bus brakes — your body wants to keep moving!",
            correction: "Gravity pulls things down. Inertia is the resistance to any change in motion.",
            difficulty: "easy",
          },
        ],
      },
      {
        title: "Newton's Second Law: F = ma",
        layout: "two-column",
        content: "Force equals mass times acceleration. This simple equation describes how the motion of an object changes when a force is applied.",
        bullets: [
          "F = ma (Force = mass × acceleration)",
          "Unit of force: Newton (N) = kg·m/s²",
          "More force → more acceleration",
          "More mass → less acceleration (for same force)",
          "Acceleration is in the direction of the net force",
          "Weight = mass × gravitational acceleration (W = mg)",
        ],
        speakerNotes: "This is the most important equation in the unit. Work through numerical examples.",
        questions: [
          {
            highlight: "F = ma",
            question: "If you double the mass but keep the force the same, what happens to acceleration?",
            type: "choice",
            options: ["It halves", "It doubles"],
            answer: "It halves",
            reinforcement: "F = ma → a = F/m. Double m means half a. That's why trucks accelerate slower than sports cars!",
            correction: "From F = ma, acceleration = F/m. Doubling mass halves the acceleration.",
            difficulty: "medium",
          },
          {
            highlight: "Newton",
            question: "What is the SI unit of force?",
            type: "text",
            answer: "Newton",
            reinforcement: "1 Newton is the force needed to accelerate 1 kg at 1 m/s². About the weight of a small apple!",
            correction: "The unit of force is the Newton (N), named after Sir Isaac Newton.",
            difficulty: "easy",
          },
        ],
      },
      {
        title: "Newton's Third Law: Action-Reaction",
        layout: "content",
        content: "For every action, there is an equal and opposite reaction. When you push on something, it pushes back on you with the same force.",
        bullets: [
          "Forces always come in pairs",
          "Action and reaction act on different objects",
          "Example: rocket exhaust pushes down, rocket goes up",
          "Example: you push wall, wall pushes you back",
          "The pairs are equal in magnitude, opposite in direction",
        ],
        speakerNotes: "Common misconception: students think the forces cancel out. Emphasize they act on DIFFERENT objects.",
        questions: [
          {
            highlight: "equal and opposite reaction",
            question: "If you push a wall with 50N of force, how much force does the wall exert on you?",
            type: "choice",
            options: ["50N", "0N"],
            answer: "50N",
            reinforcement: "The wall pushes back with exactly 50N — that's why your hand doesn't go through it!",
            correction: "Newton's Third Law: the reaction force is always equal in magnitude. The wall pushes back with 50N.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "Universal Gravitation",
        layout: "quote",
        content: "Every particle in the universe attracts every other particle with a force proportional to the product of their masses and inversely proportional to the square of the distance between them.",
        bullets: [
          "F = G(m₁m₂)/r² — the universal law of gravitation",
          "G = 6.674 × 10⁻¹¹ N·m²/kg²",
          "Gravity gets weaker with distance (inverse square law)",
          "Explains planetary orbits, tides, and falling objects",
        ],
        speakerNotes: "This unifies 'falling apples' and 'orbiting planets' into one law. Newton's great insight.",
        questions: [
          {
            highlight: "inverse square",
            question: "If you double the distance between two objects, gravity becomes…",
            type: "choice",
            options: ["1/4 as strong", "1/2 as strong"],
            answer: "1/4 as strong",
            reinforcement: "Inverse square: double distance → force drops to 1/2² = 1/4. Triple → 1/9!",
            correction: "Inverse SQUARE law: 2× distance = (1/2)² = 1/4 the force.",
            difficulty: "hard",
          },
        ],
      },
      {
        title: "Newton's Laws in Action",
        layout: "two-column",
        content: "Newton's laws explain everything from car crashes to space travel. Here's how the three laws work together in real scenarios.",
        bullets: [
          "Car crash: 1st law (inertia throws you forward)",
          "Seatbelt: applies force to decelerate you (2nd law)",
          "Airbag: extends impact time, reducing force",
          "Rocket launch: 3rd law (exhaust down, rocket up)",
          "Orbits: gravity provides centripetal force (2nd law)",
          "Moon: perpetually falling around Earth (1st + gravitation)",
        ],
        speakerNotes: "Great way to review all three laws together. Ask students to identify which law applies.",
        questions: [
          {
            highlight: "centripetal force",
            question: "What force keeps the Moon in orbit around Earth?",
            type: "choice",
            options: ["Gravity", "Magnetism"],
            answer: "Gravity",
            reinforcement: "Gravity acts as the centripetal force — it constantly pulls the Moon toward Earth, curving its path into an orbit.",
            correction: "Earth's magnetic field doesn't affect the Moon's orbit. Gravity provides the centripetal force.",
            difficulty: "medium",
          },
        ],
      },
    ],
  },
  {
    id: "french-revolution",
    title: "The French Revolution",
    subject: "Humanities",
    icon: "⚔️",
    theme: "gradient",
    sections: [
      {
        title: "The French Revolution",
        layout: "title",
        content: "Liberty, Equality, Fraternity — how a bankrupt monarchy ignited one of history's most transformative uprisings.",
        speakerNotes: "Frame this as a story of cause and effect. The Revolution didn't happen overnight.",
        questions: [],
      },
      {
        title: "Causes of the Revolution",
        layout: "content",
        content: "By 1789, France was deeply divided. The monarchy was bankrupt, the people were starving, and Enlightenment ideas had spread the notion that government should serve the people.",
        bullets: [
          "Financial crisis: debt from wars (including American Revolution)",
          "Social inequality: Three Estates system",
          "1st Estate: Clergy (0.5% of pop, owned 10% of land, paid no taxes)",
          "2nd Estate: Nobility (1.5% of pop, paid few taxes)",
          "3rd Estate: Everyone else (98%, bore the tax burden)",
          "Bread prices doubled in 1788-89 due to poor harvests",
        ],
        speakerNotes: "The Three Estates system is key context. Make sure students understand the tax imbalance.",
        questions: [
          {
            highlight: "Three Estates",
            question: "Which Estate made up 98% of the population but paid the most taxes?",
            type: "choice",
            options: ["Third Estate", "First Estate"],
            answer: "Third Estate",
            reinforcement: "The Third Estate included peasants, workers, and the bourgeoisie — all carrying the tax burden.",
            correction: "The First Estate was the clergy. The Third Estate (98% of people) bore the heaviest taxes.",
            difficulty: "easy",
          },
        ],
      },
      {
        title: "Key Events: 1789",
        layout: "two-column",
        content: "1789 was the year everything changed. A series of dramatic events toppled the old order in just a few months.",
        bullets: [
          "May: Estates-General convened at Versailles",
          "June: Third Estate forms National Assembly",
          "June 20: Tennis Court Oath — vow to write constitution",
          "July 14: Storming of the Bastille 🏰",
          "August: Declaration of Rights of Man and Citizen",
          "October: Women's March on Versailles — King forced to Paris",
        ],
        speakerNotes: "July 14 is still France's national holiday. The Bastille was a symbol of royal tyranny.",
        questions: [
          {
            highlight: "Storming of the Bastille",
            question: "What was the Bastille?",
            type: "choice",
            options: ["A royal prison/fortress", "A church"],
            answer: "A royal prison/fortress",
            reinforcement: "The Bastille held only 7 prisoners that day, but it symbolized royal oppression. Its fall marked the people's power.",
            correction: "The Bastille was a prison and fortress. Its storming on July 14, 1789 became the Revolution's defining moment.",
            difficulty: "easy",
          },
          {
            highlight: "Declaration of Rights",
            question: "What document declared that 'men are born and remain free and equal in rights'?",
            type: "text",
            answer: "Declaration of the Rights of Man",
            reinforcement: "Inspired by the American Declaration of Independence, it became a cornerstone of French law.",
            correction: "The Declaration of the Rights of Man and of the Citizen, adopted August 26, 1789.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "The Reign of Terror",
        layout: "quote",
        content: "Terror is nothing more than speedy, severe, and inflexible justice — it is thus an emanation of virtue. — Maximilien Robespierre, 1794",
        bullets: [
          "1793-1794: Committee of Public Safety rules France",
          "Led by Maximilien Robespierre",
          "~17,000 officially executed by guillotine",
          "Goal: eliminate enemies of the Revolution",
          "Robespierre himself guillotined July 28, 1794",
        ],
        speakerNotes: "This is the darkest chapter. Discuss how revolutions can consume their own creators.",
        questions: [
          {
            highlight: "Robespierre",
            question: "Who led the Committee of Public Safety during the Reign of Terror?",
            type: "choice",
            options: ["Robespierre", "Napoleon"],
            answer: "Robespierre",
            reinforcement: "Robespierre's downfall came when even his allies feared they'd be next for the guillotine.",
            correction: "Napoleon came later. Robespierre led the Terror from 1793-94.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "Rise of Napoleon",
        layout: "content",
        content: "From the chaos of the Revolution emerged Napoleon Bonaparte — a military genius who would reshape Europe's map and legal systems.",
        bullets: [
          "1799: Napoleon seizes power in a coup (18 Brumaire)",
          "1804: Crowns himself Emperor",
          "Napoleonic Code: modern civil law system",
          "Conquered most of Europe by 1812",
          "Final defeat at Waterloo (1815)",
          "Legacy: spread revolutionary ideals across Europe",
        ],
        speakerNotes: "Napoleon is both a product and a betrayer of the Revolution. He kept some ideals (meritocracy, legal reform) but abandoned democracy.",
        questions: [
          {
            highlight: "Napoleonic Code",
            question: "What legal system created by Napoleon is still the basis of law in many countries?",
            type: "text",
            answer: "Napoleonic Code",
            reinforcement: "The Napoleonic Code established equality before the law, secular authority, and property rights. It influences 40+ countries today!",
            correction: "The Napoleonic Code (1804) — also called the Civil Code — modernized French law and spread across Europe.",
            difficulty: "hard",
          },
        ],
      },
      {
        title: "Legacy of the Revolution",
        layout: "two-column",
        content: "The French Revolution's impact extended far beyond France. It fundamentally changed how the world thinks about government, rights, and citizenship.",
        bullets: [
          "End of absolute monarchy in France",
          "Inspired revolutions in Haiti, Latin America",
          "Universal ideas: liberty, equality, popular sovereignty",
          "Modern nationalism emerged from revolutionary identity",
          "Separation of church and state",
          "Template for future revolutions (1848, 1917, etc.)",
        ],
        speakerNotes: "Connect to modern democracy. Many ideas we take for granted originated here.",
        questions: [
          {
            highlight: "Haiti",
            question: "Which colony had a successful revolution directly inspired by France's?",
            type: "choice",
            options: ["Haiti", "India"],
            answer: "Haiti",
            reinforcement: "The Haitian Revolution (1791-1804) was the only successful slave revolt in history, directly inspired by French revolutionary ideals.",
            correction: "Haiti's revolution began in 1791, directly inspired by France. India's independence came much later (1947).",
            difficulty: "hard",
          },
        ],
      },
    ],
  },
];
