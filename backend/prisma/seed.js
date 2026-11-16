import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Seed Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@portal.com' },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@portal.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Seed Admin (formerly Academic Moderator)
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@portal.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'Academic Admin',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Academic Admin',
      email: 'moderator@portal.com',
      passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Also seed admin@portal.com for direct Admin login
  await prisma.user.upsert({
    where: { email: 'admin@portal.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'Platform Admin',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Platform Admin',
      email: 'admin@portal.com',
      passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Seed standard student scholar
  const student = await prisma.user.upsert({
    where: { email: 'student@portal.com' },
    update: {
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Scholar Student',
      email: 'student@portal.com',
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Seed Default University: K.R. Mangalam University (KRMU)
  const krmu = await prisma.university.upsert({
    where: { slug: 'krmu' },
    update: {
      name: 'K.R. Mangalam University',
      shortName: 'KRMU',
      code: 'KRMU',
      website: 'https://www.krmangalam.edu.in',
      description:
        'K.R. Mangalam University — Premier higher education campus with world-class academic curriculum and research programs in Gurugram, India.',
      isActive: true
    },
    create: {
      name: 'K.R. Mangalam University',
      slug: 'krmu',
      shortName: 'KRMU',
      code: 'KRMU',
      website: 'https://www.krmangalam.edu.in',
      description:
        'K.R. Mangalam University — Premier higher education campus with world-class academic curriculum and research programs in Gurugram, India.',
      isActive: true
    }
  });

  // Seed Constituent Schools of K.R. Mangalam University
  const schoolsData = [
    {
      name: 'School of Engineering & Technology',
      code: 'SOET',
      slug: 'soet',
      description:
        'Undergraduate and postgraduate engineering, CSE, AI/ML, and computational technology.'
    },
    {
      name: 'School of Management & Commerce',
      code: 'SOMC',
      slug: 'somc',
      description: 'Business administration, commerce, corporate finance, and executive leadership.'
    },
    {
      name: 'School of Basic & Applied Sciences',
      code: 'SBAS',
      slug: 'sbas',
      description: 'Foundational sciences, applied mathematics, forensic science, and physics.'
    },
    {
      name: 'Zenith School of AI',
      code: 'ZSAI',
      slug: 'zenith-ai',
      description: 'Artificial Intelligence, machine learning applications, and advanced computing.'
    },
    {
      name: 'School of Medical & Allied Sciences',
      code: 'SMAS',
      slug: 'smas',
      description: 'Pharmaceutical sciences, allied health disciplines, and medical technology.'
    },
    {
      name: 'School of Legal Studies',
      code: 'SOLS',
      slug: 'sols',
      description: 'Integrated B.A. LL.B., B.B.A. LL.B., jurisprudence, and corporate law.'
    },
    {
      name: 'School of Architecture & Design',
      code: 'SOAD',
      slug: 'soad',
      description: 'COA-approved architecture, interior architecture, and industrial design.'
    },
    {
      name: 'School of Liberal Arts',
      code: 'SOLA',
      slug: 'sola',
      description: 'Humanities, economics, psychology, literature, and social sciences.'
    },
    {
      name: 'School of Emerging Media & Creator Economy',
      code: 'SEMCE',
      slug: 'semce',
      description: 'Journalism, digital media creation, animation, and audiovisual arts.'
    },
    {
      name: 'School of Agricultural Sciences',
      code: 'SOAS',
      slug: 'soas',
      description: 'Agronomy, sustainable farming, agricultural economics, and biotechnology.'
    },
    {
      name: 'School of Education',
      code: 'SOE',
      slug: 'soe',
      description: 'Pedagogy, educational leadership, and curriculum research.'
    }
  ];

  const seededSchools = {};
  for (const s of schoolsData) {
    const schoolRecord = await prisma.school.upsert({
      where: {
        university_school_slug_unique: {
          universityId: krmu.id,
          slug: s.slug
        }
      },
      update: {
        name: s.name,
        code: s.code,
        description: s.description,
        isActive: true
      },
      create: {
        universityId: krmu.id,
        name: s.name,
        slug: s.slug,
        code: s.code,
        description: s.description,
        isActive: true
      }
    });
    seededSchools[s.code] = schoolRecord;
  }

  // Seed Categories
  const categories = [
    {
      name: 'Lecture Notes',
      slug: 'lecture-notes',
      description: 'Comprehensive lecture transcripts and instructor slides.'
    },
    {
      name: 'Exam Prep & Solutions',
      slug: 'exam-prep',
      description: 'Past year papers, model solutions, and exam preparation kits.'
    },
    {
      name: 'Lab Manuals',
      slug: 'lab-manuals',
      description: 'Practical guides, experimental observations, and lab code.'
    },
    {
      name: 'Cheat Sheets & Summaries',
      slug: 'cheat-sheets',
      description: 'Quick reference formulas, key concepts, and exam revision sheets.'
    },
    {
      name: 'Assignments & Projects',
      slug: 'assignments',
      description: 'Academic problem sets, project documentation, and case studies.'
    }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat
    });
  }

  // Clean up legacy test courses if present
  const legacySlugs = [
    'dash-cs-course',
    'rec-course-cs',
    'profile-test-course',
    'rec-course-ee',
    'rev-test-course'
  ];
  const legacyCourses = await prisma.course.findMany({
    where: { slug: { in: legacySlugs } }
  });
  for (const lc of legacyCourses) {
    await prisma.subject.deleteMany({ where: { courseId: lc.id } });
    await prisma.course.delete({ where: { id: lc.id } });
  }

  // Seed Academic Programs: B.Tech, BCA, B.Sc., MCA, M.Tech
  const academicPrograms = [
    {
      name: 'B.Tech',
      slug: 'b-tech',
      description:
        'Bachelor of Technology - Undergraduate 4-year engineering and technology curriculum.',
      subjects: [
        {
          name: 'Probability, Statistics & Linear Algebra',
          slug: 'probability-statistics-linear-algebra',
          semester: 1,
          description: 'Probability, Statistics, Matrices, Linear Algebra, and Data Analysis.'
        },
        {
          name: 'Programming for Problem Solving Using Python',
          slug: 'programming-python',
          semester: 1,
          description:
            'Python Basics, Variables, Data Types, Loops, Functions, OOP, and Problem Solving.'
        },
        {
          name: 'Web Dev I (HTML, CSS, JS Basics)',
          slug: 'web-development-1',
          semester: 1,
          description:
            'HTML, CSS, JavaScript Basics, Responsive Web Design, and Web Development Fundamentals.'
        },
        {
          name: 'Basics of Electronics & Digital Logic Design',
          slug: 'electronics-digital-logic',
          semester: 1,
          description:
            'Electronic Components, Number Systems, Logic Gates, Boolean Algebra, K-Maps, and Digital Circuits.'
        },
        {
          name: 'CS Fundamentals & Career Pathways',
          slug: 'cs-fundamentals-career-pathways',
          semester: 1,
          description:
            'Computer Science Fundamentals, Computing Technologies, Programming Concepts, and Career Opportunities.'
        },
        {
          name: 'Maker Lab: Tinkering with Technology',
          slug: 'maker-lab',
          semester: 1,
          description:
            'Hands-on Prototyping, Electronics, Arduino, Sensors, Tinkering, and Technology Projects.'
        }
      ]
    },
    {
      name: 'BCA',
      slug: 'bca',
      description:
        'Bachelor of Computer Applications - Undergraduate 3-year computational applications curriculum.',
      subjects: [
        {
          name: 'Probability, Statistics & Linear Algebra',
          slug: 'probability-statistics-linear-algebra',
          semester: 1,
          description: 'Probability, Statistics, Matrices, Linear Algebra, and Data Analysis.'
        },
        {
          name: 'Programming for Problem Solving Using Python',
          slug: 'programming-python',
          semester: 1,
          description:
            'Python Basics, Variables, Data Types, Loops, Functions, OOP, and Problem Solving.'
        },
        {
          name: 'Web Dev I (HTML, CSS, JS Basics)',
          slug: 'web-development-1',
          semester: 1,
          description:
            'HTML, CSS, JavaScript Basics, Responsive Web Design, and Web Development Fundamentals.'
        },
        {
          name: 'Basics of Electronics & Digital Logic Design',
          slug: 'electronics-digital-logic',
          semester: 1,
          description:
            'Electronic Components, Number Systems, Logic Gates, Boolean Algebra, K-Maps, and Digital Circuits.'
        },
        {
          name: 'CS Fundamentals & Career Pathways',
          slug: 'cs-fundamentals-career-pathways',
          semester: 1,
          description:
            'Computer Science Fundamentals, Computing Technologies, Programming Concepts, and Career Opportunities.'
        },
        {
          name: 'Maker Lab: Tinkering with Technology',
          slug: 'maker-lab',
          semester: 1,
          description:
            'Hands-on Prototyping, Electronics, Arduino, Sensors, Tinkering, and Technology Projects.'
        }
      ]
    },
    {
      name: 'B.Sc.',
      slug: 'b-sc',
      description:
        'Bachelor of Science - Undergraduate 3-year foundational and applied scientific curriculum.',
      subjects: [
        // { name: 'Calculus & Analytical Geometry', slug: 'bsc-calculus', semester: 1, description: 'Limits, continuity, differentiation, 2D/3D coordinate systems.' },
        // { name: 'Mechanics & General Physics', slug: 'bsc-mechanics', semester: 1, description: 'Newtonian dynamics, rotational motion, conservation laws.' },
        // { name: 'Differential Equations & Vector Calculus', slug: 'bsc-diff-equations', semester: 2, description: 'First/second order ODEs, gradient, divergence, curl theorems.' },
        // { name: 'Thermal Physics & Electricity', slug: 'bsc-thermal-physics', semester: 2, description: 'Laws of thermodynamics, kinetic theory, electrostatics, Gauss theorem.' },
        // { name: 'Probability & Applied Statistics', slug: 'bsc-probability-stats', semester: 3, description: 'Random variables, distributions, hypothesis testing, regression.' },
        // { name: 'Computational Physics & Modeling', slug: 'bsc-computational-physics', semester: 3, description: 'Simulations, numerical integration, Monte Carlo algorithms.' },
        // { name: 'Linear Algebra & Discrete Structures', slug: 'bsc-linear-algebra', semester: 4, description: 'Vector spaces, eigenvalues, eigenvectors, matrix decompositions.' },
        // { name: 'Optics & Electromagnetic Waves', slug: 'bsc-optics', semester: 4, description: 'Interference, diffraction, polarization, Maxwell equations.' },
        // { name: 'Scientific Data Analysis & Python', slug: 'bsc-data-analysis', semester: 5, description: 'SciPy, Matplotlib, curve fitting, statistical inference.' },
        // { name: 'Quantum Mechanics & Modern Physics', slug: 'bsc-quantum-mechanics', semester: 5, description: 'Wave-particle duality, Schrodinger equation, quantum states.' },
        // { name: 'Numerical Analysis & Scientific Computing', slug: 'bsc-numerical-methods', semester: 6, description: 'Root finding, interpolation, finite differences, ODE solvers.' },
        // { name: 'Research Project & Advanced Seminar', slug: 'bsc-research-project', semester: 6, description: 'Capstone scientific research manuscript, experiment, defense.' }
      ]
    },
    {
      name: 'MCA',
      slug: 'mca',
      description:
        'Master of Computer Applications - Postgraduate 2-year advanced enterprise computing curriculum.',
      subjects: [
        // { name: 'Advanced Data Structures & Analysis', slug: 'mca-adv-dsa', semester: 1, description: 'Amortized analysis, B-trees, binomial heaps, randomized algorithms.' },
        // { name: 'Mathematical Foundations of Computer Science', slug: 'mca-math-foundations', semester: 1, description: 'Combinatorics, graph algorithms, algebraic structures.' },
        // { name: 'Advanced Database Systems & NoSQL', slug: 'mca-adv-databases', semester: 1, description: 'Query optimization, indexing, distributed transactions, MongoDB.' },
        // { name: 'Full-Stack Web Engineering', slug: 'mca-full-stack', semester: 2, description: 'REST APIs, GraphQL, React, state management, secure auth.' },
        // { name: 'Cloud Computing & Microservices Architecture', slug: 'mca-cloud-microservices', semester: 2, description: 'Containerization, Docker, API gateways, serverless computing.' },
        // { name: 'Object-Oriented Software Engineering', slug: 'mca-oose', semester: 2, description: 'Clean architecture, SOLID principles, domain-driven design.' },
        // { name: 'Machine Learning & Deep Learning', slug: 'mca-ml-deep-learning', semester: 3, description: 'Gradient descent, CNNs, RNNs, transformers, PyTorch.' },
        // { name: 'Information Security & Blockchain Technologies', slug: 'mca-security-blockchain', semester: 3, description: 'Public key infrastructure, smart contracts, threat modeling.' },
        // { name: 'Mobile Application Architecture & Design', slug: 'mca-mobile-architecture', semester: 3, description: 'Cross-platform app development, offline persistence, native APIs.' },
        // { name: 'Enterprise Systems & Research Capstone', slug: 'mca-capstone-project', semester: 4, description: 'Full enterprise software delivery, deployment, and evaluation.' }
      ]
    },
    {
      name: 'M.Tech',
      slug: 'm-tech',
      description:
        'Master of Technology - Postgraduate 2-year advanced technology research and engineering curriculum.',
      subjects: [
        // { name: 'Advanced Computer Architecture', slug: 'mtech-adv-arch', semester: 1, description: 'Superscalar pipelines, branch prediction, multicore and GPU architectures.' },
        // { name: 'Mathematical Foundations for Computing', slug: 'mtech-math-computing', semester: 1, description: 'Stochastic processes, convex optimization, linear algebra for ML.' },
        // { name: 'Advanced Algorithm Design & Complexity', slug: 'mtech-adv-algorithms', semester: 2, description: 'Approximation algorithms, NP-completeness, streaming algorithms.' },
        // { name: 'High-Performance & Distributed Computing', slug: 'mtech-hpc', semester: 2, description: 'MPI, OpenMP, CUDA programming, distributed consensus.' },
        // { name: 'Deep Learning & Neural Network Architectures', slug: 'mtech-deep-learning', semester: 3, description: 'Generative models, attention mechanisms, transfer learning, LLMs.' },
        // { name: 'Research Methodology, IPR & Technical Writing', slug: 'mtech-research-methodology', semester: 3, description: 'Research design, literature reviews, patent law, IEEE manuscript writing.' },
        // { name: 'Master’s Thesis & Dissertation', slug: 'mtech-masters-thesis', semester: 4, description: 'Original research investigation, experimental verification, thesis defense.' }
      ]
    }
  ];

  let totalSubjectsSeeded = 0;

  for (const prog of academicPrograms) {
    const schoolCode = prog.name === 'B.Sc.' ? 'SBAS' : 'SOET';
    const schoolId = seededSchools[schoolCode]?.id || null;

    const courseRecord = await prisma.course.upsert({
      where: { slug: prog.slug },
      update: {
        name: prog.name,
        description: prog.description,
        universityId: krmu.id,
        schoolId
      },
      create: {
        name: prog.name,
        slug: prog.slug,
        description: prog.description,
        universityId: krmu.id,
        schoolId
      }
    });

    for (const subj of prog.subjects) {
      await prisma.subject.upsert({
        where: {
          course_subject_slug_unique: {
            courseId: courseRecord.id,
            slug: subj.slug
          }
        },
        update: {
          name: subj.name,
          semester: subj.semester,
          description: subj.description
        },
        create: {
          courseId: courseRecord.id,
          name: subj.name,
          slug: subj.slug,
          semester: subj.semester,
          description: subj.description
        }
      });
      totalSubjectsSeeded++;
    }
  }

  // Set default university for users if unassigned
  await prisma.user.updateMany({
    where: { university: null },
    data: { university: 'K.R. Mangalam University', universityId: krmu.id }
  });

  // eslint-disable-next-line no-console
  console.log('✓ Seeding complete:');
  // eslint-disable-next-line no-console
  console.log(`  Default University: ${krmu.name} (${krmu.code})`);
  // eslint-disable-next-line no-console
  console.log(
    `  Schools:     ${schoolsData.length} seeded (${schoolsData.map((s) => s.code).join(', ')})`
  );
  // eslint-disable-next-line no-console
  console.log(`  Super Admin: ${superadmin.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Moderator:   ${moderator.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Student:     ${student.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Categories:  ${categories.length} seeded`);
  // eslint-disable-next-line no-console
  console.log(
    `  Courses:     ${academicPrograms.length} seeded (${academicPrograms.map((p) => p.name).join(', ')})`
  );
  // eslint-disable-next-line no-console
  console.log(`  Subjects:    ${totalSubjectsSeeded} seeded across all semesters`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
