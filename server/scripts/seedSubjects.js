import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/models/Subject.js';
import Chapter from '../src/models/Chapter.js';
import { connectDB, closeDB } from '../src/config/db.js';

dotenv.config();

export const seedSubjectsAndChapters = async () => {
  const subjectsData = [
    {
      name: 'Quantitative Aptitude',
      slug: 'quantitative-aptitude',
      color: 'indigo',
      displayOrder: 1,
      chapters: [
        'Percentage',
        'Profit, Loss and Discount',
        'Ratio and Proportion',
        'Average',
        'Simple and Compound Interest',
        'Mixture and Alligation',
        'Time and Work',
        'Time, Speed and Distance',
        'Number System',
        'Surds and Indices',
        'Set Theory',
        'Permutation and Combination',
        'Probability',
        'Data Interpretation',
      ],
    },
    {
      name: 'Logical Reasoning',
      slug: 'logical-reasonering',
      color: 'violet',
      displayOrder: 2,
      chapters: [
        'Seating Arrangement',
        'Puzzles',
        'Blood Relations',
        'Direction Sense',
        'Coding-Decoding',
        'Syllogisms',
        'Series',
        'Ranking and Order',
        'Venn Diagrams',
        'Statement and Conclusion',
      ],
    },
    {
      name: 'English Language',
      slug: 'english-language',
      color: 'teal',
      displayOrder: 3,
      chapters: [
        'Reading Comprehension',
        'Vocabulary',
        'Synonyms and Antonyms',
        'Grammar',
        'Sentence Correction',
        'Para Jumbles',
        'Fill in the Blanks',
      ],
    },
    {
      name: 'Computer Science',
      slug: 'computer-science',
      color: 'blue',
      displayOrder: 4,
      chapters: [
        'Programming Fundamentals',
        'Data Structures and Algorithms',
        'DBMS',
        'Operating Systems',
        'Computer Networks',
        'Object-Oriented Programming',
        'Computer Architecture',
        'Software Engineering',
      ],
    },
  ];

  console.log('Seeding subjects and chapters...');
  for (const s of subjectsData) {
    let subject = await Subject.findOne({ slug: s.slug });
    if (!subject) {
      subject = await Subject.create({
        name: s.name,
        slug: s.slug,
        color: s.color,
        displayOrder: s.displayOrder,
        isActive: true,
      });
      console.log(` Created subject: ${s.name}`);
    }

    for (let i = 0; i < s.chapters.length; i++) {
      const cName = s.chapters[i];
      const cSlug = cName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingChap = await Chapter.findOne({ subjectId: subject._id, slug: cSlug });
      if (!existingChap) {
        await Chapter.create({
          subjectId: subject._id,
          name: cName,
          slug: cSlug,
          displayOrder: i + 1,
          isActive: true,
        });
      }
    }
    console.log(` Seeded ${s.chapters.length} chapters for ${s.name}`);
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seedSubjects.js')) {
  (async () => {
    await connectDB();
    await seedSubjectsAndChapters();
    console.log('Finished seeding subjects and chapters.');
    await closeDB();
    process.exit(0);
  })();
}
