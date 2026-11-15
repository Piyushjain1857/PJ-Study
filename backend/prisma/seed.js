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
  const legacySlugs = ['dash-cs-course', 'rec-course-cs', 'profile-test-course', 'rec-course-ee', 'rev-test-course'];
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
      description: 'Bachelor of Technology - Undergraduate 4-year engineering and technology curriculum.',
      subjects: [
        { name: 'Engineering Mathematics I', slug: 'engineering-math-1', semester: 1, description: 'Calculus, Matrices, and Differential Equations.' },
        { name: 'Computer Programming & Problem Solving', slug: 'computer-programming-c', semester: 1, description: 'Procedural problem solving, C language, algorithms.' },
        { name: 'Engineering Mathematics II', slug: 'engineering-math-2', semester: 2, description: 'Advanced calculus, Fourier series, and Laplace transforms.' },
        { name: 'Digital Logic & Circuit Design', slug: 'digital-logic-design', semester: 2, description: 'Boolean algebra, combinational circuits, and sequential logic.' },
        { name: 'Data Structures & Algorithms', slug: 'data-structures-and-algorithms', semester: 3, description: 'Arrays, Trees, Graphs, Sorting, and Dynamic Programming.' },
        { name: 'Computer Organization & Architecture', slug: 'computer-organization-arch', semester: 3, description: 'CPU design, instruction sets, pipelining, memory hierarchy.' },
        { name: 'Database Management Systems', slug: 'database-management-systems', semester: 4, description: 'Relational algebra, SQL, Normalization, and Transactions.' },
        { name: 'Operating Systems', slug: 'operating-systems', semester: 4, description: 'Concurrency, Memory Management, CPU Scheduling, and File Systems.' },
        { name: 'Computer Networks', slug: 'computer-networks', semester: 5, description: 'TCP/IP stack, routing protocols, and network security.' },
        { name: 'Theory of Computation', slug: 'theory-of-computation', semester: 5, description: 'Automata theory, formal languages, Turing machines, and decidability.' },
        { name: 'Software Engineering & Agile Methodologies', slug: 'software-engineering-agile', semester: 6, description: 'SDLC, Agile Scrum, design patterns, testing, CI/CD.' },
        { name: 'Compiler Design', slug: 'compiler-design', semester: 6, description: 'Lexical analysis, parsing, semantic analysis, code generation.' },
        { name: 'Artificial Intelligence & Machine Learning', slug: 'ai-and-machine-learning', semester: 7, description: 'Heuristic search, neural networks, supervised and unsupervised learning.' },
        { name: 'Cloud Computing & Distributed Systems', slug: 'cloud-computing-distributed-systems', semester: 8, description: 'Virtualization, microservices, consensus protocols, Kubernetes.' }
      ]
    },
    {
      name: 'BCA',
      slug: 'bca',
      description: 'Bachelor of Computer Applications - Undergraduate 3-year computational applications curriculum.',
      subjects: [
        { name: 'Fundamentals of Information Technology', slug: 'bca-fit', semester: 1, description: 'Hardware, software, numbering systems, office tools.' },
        { name: 'Programming in C', slug: 'bca-programming-c', semester: 1, description: 'Syntax, loops, pointers, structures, file handling in C.' },
        { name: 'Data Structures using C', slug: 'bca-data-structures', semester: 2, description: 'Stacks, queues, linked lists, trees, and searching algorithms.' },
        { name: 'Object-Oriented Programming with C++', slug: 'bca-oop-cpp', semester: 2, description: 'Classes, objects, inheritance, polymorphism, templates.' },
        { name: 'Relational Database Management Systems', slug: 'bca-rdbms', semester: 3, description: 'ER modeling, relational schemas, SQL queries, normalization.' },
        { name: 'Computer System Architecture', slug: 'bca-csa', semester: 3, description: 'Registers, ALU, microoperations, I/O organization.' },
        { name: 'Java Programming & Application Development', slug: 'bca-java', semester: 4, description: 'Core Java, OOP, exception handling, multithreading, Swing.' },
        { name: 'Operating System Principles', slug: 'bca-os', semester: 4, description: 'Process management, memory paging, file systems, Linux commands.' },
        { name: 'Web Technologies & Frameworks', slug: 'bca-web-tech', semester: 5, description: 'HTML5, CSS3, JavaScript, Node.js, and modern frontend design.' },
        { name: 'Software Engineering Practices', slug: 'bca-software-eng', semester: 5, description: 'Software design life cycles, UML modeling, testing strategies.' },
        { name: 'Python & Data Analytics', slug: 'bca-python-analytics', semester: 6, description: 'Python syntax, NumPy, Pandas, visualization, exploratory analysis.' },
        { name: 'Network Security & Cyber Forensics', slug: 'bca-cyber-security', semester: 6, description: 'Cryptography, firewall concepts, authentication, cyber hygiene.' }
      ]
    },
    {
      name: 'B.Sc.',
      slug: 'b-sc',
      description: 'Bachelor of Science - Undergraduate 3-year foundational and applied scientific curriculum.',
      subjects: [
        { name: 'Calculus & Analytical Geometry', slug: 'bsc-calculus', semester: 1, description: 'Limits, continuity, differentiation, 2D/3D coordinate systems.' },
        { name: 'Mechanics & General Physics', slug: 'bsc-mechanics', semester: 1, description: 'Newtonian dynamics, rotational motion, conservation laws.' },
        { name: 'Differential Equations & Vector Calculus', slug: 'bsc-diff-equations', semester: 2, description: 'First/second order ODEs, gradient, divergence, curl theorems.' },
        { name: 'Thermal Physics & Electricity', slug: 'bsc-thermal-physics', semester: 2, description: 'Laws of thermodynamics, kinetic theory, electrostatics, Gauss theorem.' },
        { name: 'Probability & Applied Statistics', slug: 'bsc-probability-stats', semester: 3, description: 'Random variables, distributions, hypothesis testing, regression.' },
        { name: 'Computational Physics & Modeling', slug: 'bsc-computational-physics', semester: 3, description: 'Simulations, numerical integration, Monte Carlo algorithms.' },
        { name: 'Linear Algebra & Discrete Structures', slug: 'bsc-linear-algebra', semester: 4, description: 'Vector spaces, eigenvalues, eigenvectors, matrix decompositions.' },
        { name: 'Optics & Electromagnetic Waves', slug: 'bsc-optics', semester: 4, description: 'Interference, diffraction, polarization, Maxwell equations.' },
        { name: 'Scientific Data Analysis & Python', slug: 'bsc-data-analysis', semester: 5, description: 'SciPy, Matplotlib, curve fitting, statistical inference.' },
        { name: 'Quantum Mechanics & Modern Physics', slug: 'bsc-quantum-mechanics', semester: 5, description: 'Wave-particle duality, Schrodinger equation, quantum states.' },
        { name: 'Numerical Analysis & Scientific Computing', slug: 'bsc-numerical-methods', semester: 6, description: 'Root finding, interpolation, finite differences, ODE solvers.' },
        { name: 'Research Project & Advanced Seminar', slug: 'bsc-research-project', semester: 6, description: 'Capstone scientific research manuscript, experiment, defense.' }
      ]
    },
    {
      name: 'MCA',
      slug: 'mca',
      description: 'Master of Computer Applications - Postgraduate 2-year advanced enterprise computing curriculum.',
      subjects: [
        { name: 'Advanced Data Structures & Analysis', slug: 'mca-adv-dsa', semester: 1, description: 'Amortized analysis, B-trees, binomial heaps, randomized algorithms.' },
        { name: 'Mathematical Foundations of Computer Science', slug: 'mca-math-foundations', semester: 1, description: 'Combinatorics, graph algorithms, algebraic structures.' },
        { name: 'Advanced Database Systems & NoSQL', slug: 'mca-adv-databases', semester: 1, description: 'Query optimization, indexing, distributed transactions, MongoDB.' },
        { name: 'Full-Stack Web Engineering', slug: 'mca-full-stack', semester: 2, description: 'REST APIs, GraphQL, React, state management, secure auth.' },
        { name: 'Cloud Computing & Microservices Architecture', slug: 'mca-cloud-microservices', semester: 2, description: 'Containerization, Docker, API gateways, serverless computing.' },
        { name: 'Object-Oriented Software Engineering', slug: 'mca-oose', semester: 2, description: 'Clean architecture, SOLID principles, domain-driven design.' },
        { name: 'Machine Learning & Deep Learning', slug: 'mca-ml-deep-learning', semester: 3, description: 'Gradient descent, CNNs, RNNs, transformers, PyTorch.' },
        { name: 'Information Security & Blockchain Technologies', slug: 'mca-security-blockchain', semester: 3, description: 'Public key infrastructure, smart contracts, threat modeling.' },
        { name: 'Mobile Application Architecture & Design', slug: 'mca-mobile-architecture', semester: 3, description: 'Cross-platform app development, offline persistence, native APIs.' },
        { name: 'Enterprise Systems & Research Capstone', slug: 'mca-capstone-project', semester: 4, description: 'Full enterprise software delivery, deployment, and evaluation.' }
      ]
    },
    {
      name: 'M.Tech',
      slug: 'm-tech',
      description: 'Master of Technology - Postgraduate 2-year advanced technology research and engineering curriculum.',
      subjects: [
        { name: 'Advanced Computer Architecture', slug: 'mtech-adv-arch', semester: 1, description: 'Superscalar pipelines, branch prediction, multicore and GPU architectures.' },
        { name: 'Mathematical Foundations for Computing', slug: 'mtech-math-computing', semester: 1, description: 'Stochastic processes, convex optimization, linear algebra for ML.' },
        { name: 'Advanced Algorithm Design & Complexity', slug: 'mtech-adv-algorithms', semester: 2, description: 'Approximation algorithms, NP-completeness, streaming algorithms.' },
        { name: 'High-Performance & Distributed Computing', slug: 'mtech-hpc', semester: 2, description: 'MPI, OpenMP, CUDA programming, distributed consensus.' },
        { name: 'Deep Learning & Neural Network Architectures', slug: 'mtech-deep-learning', semester: 3, description: 'Generative models, attention mechanisms, transfer learning, LLMs.' },
        { name: 'Research Methodology, IPR & Technical Writing', slug: 'mtech-research-methodology', semester: 3, description: 'Research design, literature reviews, patent law, IEEE manuscript writing.' },
        { name: 'Master’s Thesis & Dissertation', slug: 'mtech-masters-thesis', semester: 4, description: 'Original research investigation, experimental verification, thesis defense.' }
      ]
    }
  ];

  let totalSubjectsSeeded = 0;

  for (const prog of academicPrograms) {
    const courseRecord = await prisma.course.upsert({
      where: { slug: prog.slug },
      update: {
        name: prog.name,
        description: prog.description
      },
      create: {
        name: prog.name,
        slug: prog.slug,
        description: prog.description
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

  // eslint-disable-next-line no-console
  console.log('✓ Seeding complete:');
  // eslint-disable-next-line no-console
  console.log(`  Super Admin: ${superadmin.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Moderator:   ${moderator.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Student:     ${student.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Categories:  ${categories.length} seeded`);
  // eslint-disable-next-line no-console
  console.log(`  Courses:     ${academicPrograms.length} seeded (${academicPrograms.map((p) => p.name).join(', ')})`);
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
