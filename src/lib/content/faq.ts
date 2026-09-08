export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Does it melt like regular ice cream?",
    answer:
      "It softens like any real ice cream, but the higher protein content means it holds its structure a bit longer once scooped. Keep it frozen and give it 3-5 minutes on the counter before serving for the best texture.",
  },
  {
    question: "Where does the protein come from?",
    answer:
      "Whey protein isolate. It's what gives Nano its smooth, scoopable texture -- so it's dairy-based, not vegan.",
  },
  {
    question: "What's used to sweeten it?",
    answer:
      "A light blend of allulose and monk fruit. No added sugar, and no aftertaste from artificial sweeteners.",
  },
  {
    question: "Are there common allergens?",
    answer:
      "All flavors contain dairy from the whey protein base. Nano Banana also contains almonds (tree nuts). Check the label on your tub for the full allergen statement.",
  },
  {
    question: "Do you offer a subscription?",
    answer:
      "Subscribe & Save is coming soon -- for now every order ships one-time.",
  },
  {
    question: "How should I store it, and how long does it last?",
    answer:
      "Keep it frozen at 0°F / -18°C. Best enjoyed within 3 months of the print date on the lid.",
  },
];
