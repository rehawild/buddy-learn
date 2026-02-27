export interface Question {
  highlight: string;
  question: string;
  type: "choice" | "text";
  options?: [string, string];
  answer: string;
  reinforcement: string;
  correction: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Section {
  title: string;
  content: string;
  questions: Question[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: "STEM" | "Humanities";
  icon: string;
  sections: Section[];
}

export const lessons: Lesson[] = [
  {
    id: "photosynthesis",
    title: "Photosynthesis: How Plants Make Food",
    subject: "STEM",
    icon: "🌿",
    sections: [
      {
        title: "What is Photosynthesis?",
        content:
          "Photosynthesis is the process by which green plants convert sunlight into chemical energy. Plants absorb light using a pigment called chlorophyll, which is found in organelles called chloroplasts. The overall equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This means plants take in carbon dioxide and water, and produce glucose and oxygen.",
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
            correction: "Oxygen and glucose are the outputs, not inputs. Plants need CO₂ and water to start the process.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "The Light Reactions",
        content:
          "The light-dependent reactions occur in the thylakoid membranes of chloroplasts. When photons strike chlorophyll, electrons are excited and passed along an electron transport chain. This process splits water molecules (photolysis), releasing oxygen as a by-product. The energy captured is stored in ATP and NADPH, which power the next stage.",
        questions: [
          {
            highlight: "thylakoid membranes",
            question: "Where do light reactions take place?",
            type: "choice",
            options: ["Thylakoids", "Cell wall"],
            answer: "Thylakoids",
            reinforcement: "Thylakoids are stacked like coins inside chloroplasts — these stacks are called grana.",
            correction: "The cell wall provides structure. Light reactions happen on the thylakoid membranes inside chloroplasts.",
            difficulty: "easy",
          },
          {
            highlight: "ATP and NADPH",
            question: "Name one energy carrier produced in the light reactions.",
            type: "text",
            answer: "ATP",
            reinforcement: "ATP is like a rechargeable battery that cells use to power chemical reactions.",
            correction: "The two energy carriers are ATP and NADPH. They fuel the Calvin cycle.",
            difficulty: "hard",
          },
        ],
      },
      {
        title: "The Calvin Cycle",
        content:
          "The Calvin cycle (light-independent reactions) takes place in the stroma of chloroplasts. It uses ATP and NADPH from the light reactions to fix CO₂ into a 3-carbon molecule called G3P. Three turns of the cycle produce one molecule of G3P, which can be combined to form glucose. The enzyme RuBisCO catalyzes the first step of carbon fixation.",
        questions: [
          {
            highlight: "stroma",
            question: "The Calvin cycle occurs in the _____ of chloroplasts.",
            type: "text",
            answer: "stroma",
            reinforcement: "The stroma is the fluid-filled space surrounding the thylakoids — think of it as the chloroplast's cytoplasm.",
            correction: "The Calvin cycle runs in the stroma, not on the thylakoids. The stroma contains all the enzymes needed.",
            difficulty: "medium",
          },
          {
            highlight: "RuBisCO",
            question: "What enzyme kicks off carbon fixation?",
            type: "choice",
            options: ["RuBisCO", "Amylase"],
            answer: "RuBisCO",
            reinforcement: "RuBisCO is the most abundant protein on Earth — it's in every green leaf!",
            correction: "Amylase breaks down starch. RuBisCO is the key enzyme that fixes CO₂ in the Calvin cycle.",
            difficulty: "medium",
          },
        ],
      },
    ],
  },
  {
    id: "renaissance",
    title: "The Renaissance: A Rebirth of Ideas",
    subject: "Humanities",
    icon: "🎨",
    sections: [
      {
        title: "Origins of the Renaissance",
        content:
          "The Renaissance began in 14th-century Italy, particularly in wealthy city-states like Florence, Venice, and Rome. The word 'Renaissance' means 'rebirth' in French, referring to a renewed interest in classical Greek and Roman culture. Wealthy patrons like the Medici family funded artists, architects, and scholars, making Florence the cradle of this cultural revolution.",
        questions: [
          {
            highlight: "rebirth",
            question: "What does the word 'Renaissance' literally mean?",
            type: "choice",
            options: ["Rebirth", "Revolution"],
            answer: "Rebirth",
            reinforcement: "It refers to the 'rebirth' of classical learning and art from ancient Greece and Rome.",
            correction: "While it was revolutionary, the word Renaissance directly translates to 'rebirth' from French.",
            difficulty: "easy",
          },
          {
            highlight: "Medici family",
            question: "Which powerful family were major patrons in Florence?",
            type: "text",
            answer: "Medici",
            reinforcement: "The Medici were bankers turned rulers who sponsored Leonardo, Michelangelo, and Botticelli!",
            correction: "The Medici family bankrolled much of the Florentine Renaissance through their banking wealth.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "Art and Innovation",
        content:
          "Renaissance artists revolutionized art with techniques like linear perspective, chiaroscuro (light and shadow), and anatomical accuracy. Leonardo da Vinci's Mona Lisa and The Last Supper exemplify the era's mastery. Michelangelo's Sistine Chapel ceiling took four years to complete. These artists were also scientists and engineers — Leonardo designed flying machines and studied human anatomy through dissection.",
        questions: [
          {
            highlight: "linear perspective",
            question: "Which technique gave Renaissance paintings a sense of depth?",
            type: "choice",
            options: ["Linear perspective", "Pointillism"],
            answer: "Linear perspective",
            reinforcement: "Brunelleschi demonstrated perspective around 1415, and it transformed how artists depicted space.",
            correction: "Pointillism came much later (1880s). Renaissance artists used linear perspective for realistic depth.",
            difficulty: "easy",
          },
          {
            highlight: "Sistine Chapel ceiling",
            question: "How many years did it take Michelangelo to paint the Sistine Chapel ceiling?",
            type: "choice",
            options: ["4 years", "10 years"],
            answer: "4 years",
            reinforcement: "Michelangelo painted it mostly lying on scaffolding — and he considered himself a sculptor, not a painter!",
            correction: "It took about 4 years (1508–1512). Michelangelo worked on it almost single-handedly.",
            difficulty: "medium",
          },
        ],
      },
      {
        title: "Legacy and Spread",
        content:
          "The Renaissance spread from Italy to Northern Europe through trade, diplomacy, and the printing press invented by Johannes Gutenberg around 1440. The printing press made books affordable and accelerated the spread of ideas. Humanism — the belief in human potential and the study of classical texts — became the intellectual foundation of the era, influencing education, politics, and religion for centuries.",
        questions: [
          {
            highlight: "printing press",
            question: "Who invented the printing press that spread Renaissance ideas?",
            type: "text",
            answer: "Gutenberg",
            reinforcement: "Gutenberg's press could produce 3,600 pages per day — hand copying managed about 2,000 words!",
            correction: "Johannes Gutenberg invented the movable-type printing press around 1440 in Mainz, Germany.",
            difficulty: "medium",
          },
          {
            highlight: "Humanism",
            question: "What intellectual movement focused on human potential and classical texts?",
            type: "choice",
            options: ["Humanism", "Feudalism"],
            answer: "Humanism",
            reinforcement: "Humanists like Petrarch studied ancient texts to understand what it meant to live a good life.",
            correction: "Feudalism was the medieval political system. Humanism was the Renaissance's core philosophy.",
            difficulty: "easy",
          },
        ],
      },
    ],
  },
];
