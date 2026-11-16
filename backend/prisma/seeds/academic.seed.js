/**
 * PJ Study Academic Catalog Seeding Module
 * Seeds University, Schools, Programs, Accredited Subjects (with Credits), and Categories.
 */

export const ACADEMIC_PROGRAMS = [
  {
    name: 'B.Tech',
    slug: 'b-tech',
    description: 'Bachelor of Technology in Computer Science & Engineering — 4-year premier technical curriculum.',
    schoolCode: 'SOET',
    degreeLevel: 'Undergraduate',
    semestersCount: 8,
    subjects: [
      // Semester 1 (Exact accredited syllabus)
      {
        name: 'Probability, Statistics & Linear Algebra',
        slug: 'probability-statistics-linear-algebra',
        code: 'ENG-MATH101',
        semester: 1,
        credits: 4,
        description: 'Probability, Statistics, Matrices, Linear Algebra, and Data Analysis.'
      },
      {
        name: 'Programming for Problem Solving Using Python',
        slug: 'programming-python',
        code: 'CSE-PY101',
        semester: 1,
        credits: 4,
        description: 'Python Basics, Variables, Data Types, Loops, Functions, OOP, and Problem Solving.'
      },
      {
        name: 'Web Dev I (HTML, CSS, JS Basics)',
        slug: 'web-development-1',
        code: 'CSE-WEB101',
        semester: 1,
        credits: 3,
        description: 'HTML, CSS, JavaScript Basics, Responsive Web Design, and Web Development Fundamentals.'
      },
      {
        name: 'Basics of Electronics & Digital Logic Design',
        slug: 'electronics-digital-logic',
        code: 'ECE-DLD101',
        semester: 1,
        credits: 3,
        description: 'Electronic Components, Number Systems, Logic Gates, Boolean Algebra, K-Maps, and Digital Circuits.'
      },
      {
        name: 'CS Fundamentals & Career Pathways',
        slug: 'cs-fundamentals-career-pathways',
        code: 'CSE-FND101',
        semester: 1,
        credits: 2,
        description: 'Computer Science Fundamentals, Computing Technologies, Programming Concepts, and Career Opportunities.'
      },
      {
        name: 'Maker Lab: Tinkering with Technology',
        slug: 'maker-lab',
        code: 'CSE-MKL101',
        semester: 1,
        credits: 2,
        description: 'Hands-on Prototyping, Electronics, Arduino, Sensors, Tinkering, and Technology Projects.'
      }
      /* Commented out - Semesters 2 to 8
      // Semester 2
      {
        name: 'Engineering Mathematics II',
        slug: 'engineering-math-2',
        code: 'ENG-MATH102',
        semester: 2,
        credits: 4,
        description: 'Calculus, Ordinary Differential Equations, Vector Calculus, and Transforms.'
      },
      {
        name: 'Digital Logic & Circuit Design',
        slug: 'digital-logic-design',
        code: 'ECE-DLD102',
        semester: 2,
        credits: 3,
        description: 'Combinational and sequential circuits, flip-flops, counters, and registers.'
      },
      // Semester 3
      {
        name: 'Object-Oriented Programming with Java',
        slug: 'oop-java',
        code: 'CSE-JAVA201',
        semester: 3,
        credits: 4,
        description: 'Classes, Inheritance, Polymorphism, Exception Handling, Interfaces & Collections.'
      },
      {
        name: 'Computer Organization & Architecture',
        slug: 'computer-organization-arch',
        code: 'CSE-COA201',
        semester: 3,
        credits: 4,
        description: 'CPU Architecture, Memory Hierarchy, I/O Interfacing, and Pipelining.'
      },
      // Semester 4
      {
        name: 'Database Management Systems',
        slug: 'database-management-systems',
        code: 'CSE-DBMS202',
        semester: 4,
        credits: 4,
        description: 'Relational Model, SQL, Normalization, Transactions, Concurrency, and Indexing.'
      },
      {
        name: 'Operating Systems',
        slug: 'operating-systems',
        code: 'CSE-OS202',
        semester: 4,
        credits: 4,
        description: 'Processes, Threads, CPU Scheduling, Deadlocks, Memory Management, and File Systems.'
      },
      // Semester 5
      {
        name: 'Computer Networks',
        slug: 'computer-networks',
        code: 'CSE-CN301',
        semester: 5,
        credits: 4,
        description: 'OSI and TCP/IP Models, Routing Algorithms, Transport Layer, and Network Security.'
      },
      {
        name: 'Theory of Computation',
        slug: 'theory-of-computation',
        code: 'CSE-TOC301',
        semester: 5,
        credits: 3,
        description: 'Automata Theory, Regular Languages, Context-Free Grammars, and Turing Machines.'
      },
      // Semester 6
      {
        name: 'Compiler Design',
        slug: 'compiler-design',
        code: 'CSE-CD302',
        semester: 6,
        credits: 4,
        description: 'Lexical Analysis, Parsing Techniques, Syntax-Directed Translation, and Code Generation.'
      },
      {
        name: 'Software Engineering & Agile Methodologies',
        slug: 'software-engineering-agile',
        code: 'CSE-SE302',
        semester: 6,
        credits: 3,
        description: 'SDLC Models, Agile, Scrum, Software Testing, and Design Patterns.'
      },
      // Semester 7
      {
        name: 'Artificial Intelligence & Machine Learning',
        slug: 'ai-and-machine-learning',
        code: 'CSE-AIML401',
        semester: 7,
        credits: 4,
        description: 'Search Algorithms, Knowledge Representation, Supervised & Unsupervised Learning.'
      },
      // Semester 8
      {
        name: 'Cloud Computing & Distributed Systems',
        slug: 'cloud-computing-distributed-systems',
        code: 'CSE-CCDS402',
        semester: 8,
        credits: 3,
        description: 'Virtualization, Cloud Architectures, Distributed Algorithms, and Microservices.'
      }
      */
    ]
  },
  {
    name: 'BCA',
    slug: 'bca',
    description: 'Bachelor of Computer Applications — Undergraduate 3-year computational applications curriculum.',
    schoolCode: 'SOET',
    degreeLevel: 'Undergraduate',
    semestersCount: 6,
    subjects: [
      // Semester 1 (Exact accredited syllabus with labs pruned)
      {
        name: 'Web Designing Using HTML, CSS, JavaScript & PHP',
        slug: 'web-designing-html-css-js-php',
        code: 'BCA-WEB101',
        semester: 1,
        credits: 4,
        description: 'HTML, CSS, JavaScript, PHP, Web Design, and Frontend Development.'
      },
      {
        name: 'Basics of Mathematics',
        slug: 'basics-of-mathematics',
        code: 'BCA-MATH101',
        semester: 1,
        credits: 4,
        description: 'Fundamental Mathematics, Algebra, Calculus, Equations, and Mathematical Problem Solving.'
      },
      {
        name: 'Clean Coding with Python',
        slug: 'clean-coding-python',
        code: 'BCA-PY101',
        semester: 1,
        credits: 4,
        description: 'Python Programming, Clean Code Principles, Functions, Data Structures, and Coding Best Practices.'
      },
      {
        name: 'Essentials of Software Engineering',
        slug: 'essentials-software-engineering',
        code: 'BCA-SE101',
        semester: 1,
        credits: 3,
        description: 'Software Development Life Cycle, Software Design, Testing, Maintenance, and Engineering Principles.'
      },
      {
        name: 'Environmental Studies & Disaster Management',
        slug: 'environmental-studies-disaster-management',
        code: 'BCA-ENV101',
        semester: 1,
        credits: 2,
        description: 'Environmental Science, Sustainability, Pollution, Natural Disasters, and Disaster Management.'
      },
      {
        name: 'Data Visualization using Power BI',
        slug: 'data-visualization-power-bi',
        code: 'BCA-BI101',
        semester: 1,
        credits: 3,
        description: 'Power BI, Data Visualization, Interactive Dashboards, Data Analysis, and Business Intelligence.'
      }
      /* Commented out - Semesters 2 to 6
      // Semester 2
      {
        name: 'Data Structures using C',
        slug: 'bca-data-structures',
        code: 'BCA-DS102',
        semester: 2,
        credits: 4,
        description: 'Arrays, Stacks, Queues, Trees, and Sorting Algorithms in C.'
      },
      {
        name: 'Object-Oriented Programming with C++',
        slug: 'bca-oop-cpp',
        code: 'BCA-CPP102',
        semester: 2,
        credits: 4,
        description: 'Classes, Objects, Inheritance, Polymorphism, and Templates in C++.'
      },
      // Semester 3
      {
        name: 'Computer System Architecture',
        slug: 'bca-csa',
        code: 'BCA-CSA201',
        semester: 3,
        credits: 3,
        description: 'Digital logic, CPU organization, register transfer, and memory hierarchy.'
      },
      {
        name: 'Relational Database Management Systems',
        slug: 'bca-rdbms',
        code: 'BCA-RDBMS201',
        semester: 3,
        credits: 4,
        description: 'SQL, normalization, relational algebra, and transaction processing.'
      },
      // Semester 4
      {
        name: 'Java Programming & Application Development',
        slug: 'bca-java',
        code: 'BCA-JAVA202',
        semester: 4,
        credits: 4,
        description: 'Core Java, Collections, Multithreading, GUI, and JDBC connectivity.'
      },
      {
        name: 'Operating System Principles',
        slug: 'bca-os',
        code: 'BCA-OS202',
        semester: 4,
        credits: 3,
        description: 'Process management, memory paging, file systems, and scheduling.'
      },
      // Semester 5
      {
        name: 'Software Engineering Practices',
        slug: 'bca-software-eng',
        code: 'BCA-SE301',
        semester: 5,
        credits: 3,
        description: 'SDLC, Agile methodology, unit testing, and design patterns.'
      },
      {
        name: 'Web Technologies & Frameworks',
        slug: 'bca-web-tech',
        code: 'BCA-WT301',
        semester: 5,
        credits: 4,
        description: 'Full-stack development, RESTful APIs, Node.js, and modern frontend frameworks.'
      },
      // Semester 6
      {
        name: 'Network Security & Cyber Forensics',
        slug: 'bca-cyber-security',
        code: 'BCA-SEC302',
        semester: 6,
        credits: 3,
        description: 'Cryptography, cyber security fundamentals, authentication, and digital forensics.'
      }
      */
    ]
  },
  {
    name: 'B.Sc.',
    slug: 'b-sc',
    description: 'Bachelor of Science — Undergraduate 3-year foundational and applied scientific curriculum.',
    schoolCode: 'SBAS',
    degreeLevel: 'Undergraduate',
    semestersCount: 6,
    subjects: [
      /* Commented out - B.Sc. Subjects
      {
        name: 'Calculus & Analytical Geometry',
        slug: 'bsc-calculus',
        code: 'BSC-MATH101',
        semester: 1,
        credits: 4,
        description: 'Differentiation, integration, conic sections, and vector calculus.'
      },
      {
        name: 'Mechanics & Oscillations',
        slug: 'bsc-mechanics',
        code: 'BSC-PHY101',
        semester: 1,
        credits: 4,
        description: 'Newtonian mechanics, harmonic oscillators, waves, and gravitation.'
      },
      {
        name: 'Differential Equations',
        slug: 'bsc-diff-equations',
        code: 'BSC-MATH102',
        semester: 2,
        credits: 4,
        description: 'First and second order ODEs, Laplace transforms, and boundary value problems.'
      },
      {
        name: 'Electricity & Magnetism',
        slug: 'bsc-em',
        code: 'BSC-PHY102',
        semester: 2,
        credits: 4,
        description: 'Electrostatics, Gauss law, Maxwell equations, and electromagnetic induction.'
      },
      {
        name: 'Real Analysis',
        slug: 'bsc-real-analysis',
        code: 'BSC-MATH201',
        semester: 3,
        credits: 4,
        description: 'Sequences, series convergence, metric spaces, and Riemann integration.'
      },
      {
        name: 'Thermal & Statistical Physics',
        slug: 'bsc-thermal-physics',
        code: 'BSC-PHY201',
        semester: 3,
        credits: 3,
        description: 'Laws of thermodynamics, entropy, Maxwell-Boltzmann, and Fermi-Dirac statistics.'
      },
      {
        name: 'Computational Physics & Modeling',
        slug: 'bsc-computational-physics',
        code: 'BSC-CPM201',
        semester: 3,
        credits: 3,
        description: 'Numerical simulation of physical systems, Monte Carlo methods, and phase transitions.'
      },
      {
        name: 'Probability & Applied Statistics',
        slug: 'bsc-probability-stats',
        code: 'BSC-STAT201',
        semester: 3,
        credits: 3,
        description: 'Probability distributions, central limit theorem, hypothesis testing, and regression.'
      },
      {
        name: 'Abstract Algebra',
        slug: 'bsc-abstract-algebra',
        code: 'BSC-MATH202',
        semester: 4,
        credits: 4,
        description: 'Groups, subgroups, homomorphisms, rings, and ideals.'
      },
      {
        name: 'Quantum Mechanics',
        slug: 'bsc-quantum-mechanics',
        code: 'BSC-PHY202',
        semester: 4,
        credits: 4,
        description: 'Wave-particle duality, Schrodinger equation, operators, and particle in a box.'
      },
      {
        name: 'Linear Algebra & Discrete Structures',
        slug: 'bsc-linear-algebra',
        code: 'BSC-LADS202',
        semester: 4,
        credits: 3,
        description: 'Vector spaces, linear maps, eigenvalues, graph theory, and combinatorics.'
      },
      {
        name: 'Optics & Electromagnetic Waves',
        slug: 'bsc-optics',
        code: 'BSC-OPT202',
        semester: 4,
        credits: 3,
        description: 'Wave optics, interference, diffraction, polarization, and lasers.'
      },
      {
        name: 'Complex Analysis',
        slug: 'bsc-complex-analysis',
        code: 'BSC-MATH301',
        semester: 5,
        credits: 4,
        description: 'Analytic functions, Cauchy-Riemann equations, contour integration, and residues.'
      },
      {
        name: 'Solid State Physics',
        slug: 'bsc-solid-state',
        code: 'BSC-PHY301',
        semester: 5,
        credits: 3,
        description: 'Crystal structures, X-ray diffraction, band theory, and semiconductors.'
      },
      {
        name: 'Scientific Data Analysis & Python',
        slug: 'bsc-data-analysis',
        code: 'BSC-SDA301',
        semester: 5,
        credits: 3,
        description: 'Scientific computing with NumPy, SciPy, Matplotlib, and curve fitting algorithms.'
      },
      {
        name: 'Numerical Analysis & Scientific Computing',
        slug: 'bsc-numerical-analysis',
        code: 'BSC-MATH302',
        semester: 6,
        credits: 4,
        description: 'Root finding, interpolation, numerical integration, and ODE solvers.'
      },
      {
        name: 'Nuclear & Particle Physics',
        slug: 'bsc-nuclear-physics',
        code: 'BSC-PHY302',
        semester: 6,
        credits: 3,
        description: 'Nuclear models, radioactivity, decay kinetics, and elementary particles.'
      },
      {
        name: 'Research Project & Advanced Seminar',
        slug: 'bsc-research-project',
        code: 'BSC-PROJ302',
        semester: 6,
        credits: 4,
        description: 'Independent scientific research project, literature review, and formal symposium defense.'
      }
      */
    ]
  },
  {
    name: 'MCA',
    slug: 'mca',
    description: 'Master of Computer Applications — Postgraduate 2-year enterprise software engineering curriculum.',
    schoolCode: 'SOET',
    degreeLevel: 'Postgraduate',
    semestersCount: 4,
    subjects: [
      /* Commented out - MCA Subjects
      {
        name: 'Advanced Data Structures & Analysis',
        slug: 'mca-adv-dsa',
        code: 'MCA-DSA101',
        semester: 1,
        credits: 4,
        description: 'Red-Black trees, amortized analysis, dynamic programming, and graph algorithms.'
      },
      {
        name: 'Advanced Database Systems & NoSQL',
        slug: 'mca-adv-db',
        code: 'MCA-DBMS101',
        semester: 1,
        credits: 4,
        description: 'Distributed DBMS, NoSQL architectures, query optimization, and transaction recovery.'
      },
      {
        name: 'Modern Web Architecture & Cloud Native Apps',
        slug: 'mca-cloud-native',
        code: 'MCA-CLOUD101',
        semester: 1,
        credits: 3,
        description: 'Microservices, Docker, Kubernetes, and RESTful GraphQL API design.'
      },
      {
        name: 'Mathematical Foundations of Computer Science',
        slug: 'mca-math-foundations',
        code: 'MCA-MATH101',
        semester: 1,
        credits: 4,
        description: 'Discrete mathematics, graph theory, probability, formal logic, and proof techniques.'
      },
      {
        name: 'Machine Learning & Predictive Modeling',
        slug: 'mca-ml',
        code: 'MCA-ML102',
        semester: 2,
        credits: 4,
        description: 'Supervised learning, deep learning, NLP, and model evaluation metrics.'
      },
      {
        name: 'Enterprise Software Architecture',
        slug: 'mca-software-arch',
        code: 'MCA-ARCH102',
        semester: 2,
        credits: 4,
        description: 'Design patterns, domain-driven design, event-driven architectures, and CI/CD.'
      },
      {
        name: 'Full-Stack Web Engineering',
        slug: 'mca-full-stack',
        code: 'MCA-FSE102',
        semester: 2,
        credits: 4,
        description: 'Advanced React, state management, Node.js server architectures, and API gateways.'
      },
      {
        name: 'Cloud Computing & Microservices Architecture',
        slug: 'mca-cloud-microservices',
        code: 'MCA-CCM102',
        semester: 2,
        credits: 4,
        description: 'Distributed systems, service mesh, container orchestration, and serverless computing.'
      },
      {
        name: 'Object-Oriented Software Engineering',
        slug: 'mca-oose',
        code: 'MCA-OOSE102',
        semester: 2,
        credits: 3,
        description: 'UML modeling, design patterns, refactoring, unit testing, and software quality assurance.'
      },
      {
        name: 'Full Stack Frameworks & DevOps',
        slug: 'mca-fullstack-devops',
        code: 'MCA-DOPS201',
        semester: 3,
        credits: 4,
        description: 'Automated CI/CD pipelines, container orchestration, Prometheus telemetry, and infrastructure as code.'
      },
      {
        name: 'Information Security & Cryptography',
        slug: 'mca-info-security',
        code: 'MCA-SEC201',
        semester: 3,
        credits: 3,
        description: 'Public key infrastructure, AES, RSA, zero-trust security, and penetration testing.'
      },
      {
        name: 'Mobile Application Architecture & Design',
        slug: 'mca-mobile-architecture',
        code: 'MCA-MOB201',
        semester: 3,
        credits: 3,
        description: 'Native and hybrid mobile architectures, state management, background sync, and offline persistence.'
      },
      {
        name: 'Machine Learning & Deep Learning',
        slug: 'mca-ml-deep-learning',
        code: 'MCA-DL201',
        semester: 3,
        credits: 4,
        description: 'Convolutional neural networks, recurrent networks, attention mechanisms, and transfer learning.'
      },
      {
        name: 'Big Data Analytics & Stream Processing',
        slug: 'mca-big-data',
        code: 'MCA-BD202',
        semester: 4,
        credits: 4,
        description: 'Hadoop, Spark, Kafka, distributed streaming, and real-time dashboards.'
      },
      {
        name: 'Enterprise Systems & Research Capstone',
        slug: 'mca-capstone-project',
        code: 'MCA-CAP202',
        semester: 4,
        credits: 8,
        description: 'End-to-end enterprise platform development, production deployment, and technical dissertation.'
      }
      */
    ]
  },
  {
    name: 'M.Tech',
    slug: 'm-tech',
    description: 'Master of Technology in Computer Science — Postgraduate research and high-performance computing curriculum.',
    schoolCode: 'SOET',
    degreeLevel: 'Postgraduate',
    semestersCount: 4,
    subjects: [
      /* Commented out - M.Tech Subjects
      {
        name: 'Advanced Algorithms & Computational Complexity',
        slug: 'mtech-adv-algo',
        code: 'MTECH-ALGO101',
        semester: 1,
        credits: 4,
        description: 'Approximation algorithms, NP-completeness, randomized algorithms, and streaming data.'
      },
      {
        name: 'Deep Learning & Neural Architectures',
        slug: 'mtech-deep-learning',
        code: 'MTECH-DL101',
        semester: 1,
        credits: 4,
        description: 'CNNs, Transformers, attention mechanisms, diffusion models, and optimization.'
      },
      {
        name: 'Advanced Computer Architecture',
        slug: 'mtech-adv-arch',
        code: 'MTECH-ARCH101',
        semester: 1,
        credits: 4,
        description: 'Superscalar processors, branch prediction, cache coherence protocols, and memory hierarchies.'
      },
      {
        name: 'Mathematical Foundations for Computing',
        slug: 'mtech-math-computing',
        code: 'MTECH-MATH101',
        semester: 1,
        credits: 4,
        description: 'Applied linear algebra, probability theory, stochastic processes, and convex optimization.'
      },
      {
        name: 'High-Performance & Distributed Computing',
        slug: 'mtech-hpc',
        code: 'MTECH-HPC102',
        semester: 2,
        credits: 4,
        description: 'GPU programming with CUDA, MPI, OpenMP, and distributed consensus.'
      },
      {
        name: 'Advanced Cryptography & Blockchain Protocols',
        slug: 'mtech-crypto-blockchain',
        code: 'MTECH-CRYPTO102',
        semester: 2,
        credits: 3,
        description: 'Zero-knowledge proofs, elliptic curves, consensus protocols, and smart contracts.'
      },
      {
        name: 'Advanced Algorithm Design & Complexity',
        slug: 'mtech-adv-algorithms',
        code: 'MTECH-ALG202',
        semester: 2,
        credits: 4,
        description: 'Linear programming duality, primal-dual schemes, computational geometry, and hardness of approximation.'
      },
      {
        name: 'Quantum Computing Fundamentals',
        slug: 'mtech-quantum-computing',
        code: 'MTECH-QC201',
        semester: 3,
        credits: 4,
        description: 'Qubits, quantum circuits, Shor and Grover algorithms, and quantum error correction.'
      },
      {
        name: 'Research Methodology & Ethics',
        slug: 'mtech-research-methodology',
        code: 'MTECH-RES201',
        semester: 3,
        credits: 3,
        description: 'Literature review, empirical study design, peer review, and academic publication standards.'
      },
      {
        name: 'Master Thesis & Capstone Defense',
        slug: 'mtech-thesis',
        code: 'MTECH-THS202',
        semester: 4,
        credits: 12,
        description: 'Original academic research manuscript, experimental validation, and formal defense.'
      }
      */
    ]
  }
];

export const SCHOOLS_DATA = [
  { name: 'School of Engineering & Technology', code: 'SOET', slug: 'soet', description: 'Undergraduate and postgraduate engineering, CSE, AI/ML, and computational technology.' },
  { name: 'School of Management & Commerce', code: 'SOMC', slug: 'somc', description: 'Business administration, commerce, corporate finance, and executive leadership.' },
  { name: 'School of Basic & Applied Sciences', code: 'SBAS', slug: 'sbas', description: 'Foundational sciences, applied mathematics, forensic science, and physics.' },
  { name: 'Zenith School of AI', code: 'ZSAI', slug: 'zenith-ai', description: 'Artificial Intelligence, machine learning applications, and advanced computing.' },
  { name: 'School of Medical & Allied Sciences', code: 'SMAS', slug: 'smas', description: 'Pharmaceutical sciences, allied health disciplines, and medical technology.' },
  { name: 'School of Legal Studies', code: 'SOLS', slug: 'sols', description: 'Integrated B.A. LL.B., B.B.A. LL.B., jurisprudence, and corporate law.' },
  { name: 'School of Architecture & Design', code: 'SOAD', slug: 'soad', description: 'COA-approved architecture, interior architecture, and industrial design.' },
  { name: 'School of Liberal Arts', code: 'SOLA', slug: 'sola', description: 'Humanities, economics, psychology, literature, and social sciences.' },
  { name: 'School of Emerging Media & Creator Economy', code: 'SEMCE', slug: 'semce', description: 'Journalism, digital media creation, animation, and audiovisual arts.' },
  { name: 'School of Agricultural Sciences', code: 'SOAS', slug: 'soas', description: 'Agronomy, sustainable farming, agricultural economics, and biotechnology.' },
  { name: 'School of Education', code: 'SOE', slug: 'soe', description: 'Pedagogy, educational leadership, and curriculum research.' }
];

export const CATEGORIES_DATA = [
  { name: 'Lecture Notes', slug: 'lecture-notes', description: 'Comprehensive lecture transcripts and instructor slides.' },
  { name: 'Exam Prep & Solutions', slug: 'exam-prep', description: 'Past year papers, model solutions, and exam preparation kits.' },
  { name: 'Lab Manuals', slug: 'lab-manuals', description: 'Practical guides, experimental observations, and lab code.' },
  { name: 'Cheat Sheets & Summaries', slug: 'cheat-sheets', description: 'Quick reference formulas, key concepts, and exam revision sheets.' },
  { name: 'Assignments & Projects', slug: 'assignments', description: 'Academic problem sets, project documentation, and case studies.' }
];

export const FORBIDDEN_SUBJECT_NAMES = [
  'Clean Coding with Python Lab',
  'Essentials of Software Engineering Lab',
  'Web Design Lab',
  'Direct Publishing Subject',
  'Data Structures & Algorithms'
];

export const FORBIDDEN_CODES = ['PUB-SUB101', 'LIB-DSA301'];
export const FORBIDDEN_SLUGS = ['clean-coding-python-lab', 'software-engineering-lab', 'web-design-lab', 'pub-sub101', 'lib-dsa'];

export async function seedAcademicCatalog(prisma, options = {}) {
  const { dryRun = false } = options;
  const stats = {
    universities: { created: 0, existing: 0 },
    schools: { created: 0, existing: 0 },
    courses: { created: 0, existing: 0 },
    subjects: { created: 0, existing: 0 },
    categories: { created: 0, existing: 0 }
  };

  // 1. Purge forbidden subjects and test artifacts
  if (!dryRun) {
    const forbidden = await prisma.subject.findMany({
      where: {
        OR: [
          { name: { in: FORBIDDEN_SUBJECT_NAMES } },
          { code: { in: FORBIDDEN_CODES } },
          { slug: { in: FORBIDDEN_SLUGS } }
        ]
      }
    });

    for (const f of forbidden) {
      await prisma.bookmark.deleteMany({ where: { note: { subjectId: f.id } } });
      await prisma.downloadHistory.deleteMany({ where: { note: { subjectId: f.id } } });
      await prisma.noteViewHistory.deleteMany({ where: { note: { subjectId: f.id } } });
      await prisma.studyCollectionItem.deleteMany({ where: { note: { subjectId: f.id } } });
      await prisma.reviewHelpfulVote.deleteMany({ where: { review: { note: { subjectId: f.id } } } });
      await prisma.reviewReport.deleteMany({ where: { review: { note: { subjectId: f.id } } } });
      await prisma.review.deleteMany({ where: { note: { subjectId: f.id } } });
      await prisma.report.deleteMany({ where: { note: { subjectId: f.id } } });
      await prisma.note.deleteMany({ where: { subjectId: f.id } });
      await prisma.topic.deleteMany({ where: { subjectId: f.id } });
      await prisma.subject.delete({ where: { id: f.id } });
    }
  }

  // 2. University
  let krmu = await prisma.university.findUnique({ where: { slug: 'krmu' } });
  if (krmu) {
    stats.universities.existing++;
    if (!dryRun) {
      krmu = await prisma.university.update({
        where: { id: krmu.id },
        data: {
          name: 'K.R. Mangalam University',
          shortName: 'KRMU',
          code: 'KRMU',
          website: 'https://www.krmangalam.edu.in',
          description: 'K.R. Mangalam University — Premier higher education campus with world-class academic curriculum and research programs in Gurugram, India.',
          isActive: true
        }
      });
    }
  } else {
    stats.universities.created++;
    if (!dryRun) {
      krmu = await prisma.university.create({
        data: {
          name: 'K.R. Mangalam University',
          slug: 'krmu',
          shortName: 'KRMU',
          code: 'KRMU',
          website: 'https://www.krmangalam.edu.in',
          description: 'K.R. Mangalam University — Premier higher education campus with world-class academic curriculum and research programs in Gurugram, India.',
          isActive: true
        }
      });
    }
  }

  // 3. Schools
  const seededSchools = {};
  for (const s of SCHOOLS_DATA) {
    const existing = await prisma.school.findFirst({
      where: { universityId: krmu?.id || '', slug: s.slug }
    });
    if (existing) {
      stats.schools.existing++;
      if (!dryRun) {
        seededSchools[s.code] = await prisma.school.update({
          where: { id: existing.id },
          data: { name: s.name, code: s.code, description: s.description, isActive: true }
        });
      } else {
        seededSchools[s.code] = existing;
      }
    } else {
      stats.schools.created++;
      if (!dryRun) {
        seededSchools[s.code] = await prisma.school.create({
          data: {
            universityId: krmu.id,
            name: s.name,
            slug: s.slug,
            code: s.code,
            description: s.description,
            isActive: true
          }
        });
      } else {
        seededSchools[s.code] = { id: `dry-${s.code}`, ...s };
      }
    }
  }

  // 4. Categories
  const seededCategories = {};
  for (const cat of CATEGORIES_DATA) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      stats.categories.existing++;
      if (!dryRun) {
        seededCategories[cat.slug] = await prisma.category.update({
          where: { id: existing.id },
          data: { name: cat.name, description: cat.description, isActive: true }
        });
      } else {
        seededCategories[cat.slug] = existing;
      }
    } else {
      stats.categories.created++;
      if (!dryRun) {
        seededCategories[cat.slug] = await prisma.category.create({
          data: { ...cat, isActive: true }
        });
      } else {
        seededCategories[cat.slug] = { id: `dry-${cat.slug}`, ...cat };
      }
    }
  }

  // Prune un-whitelisted test categories
  if (!dryRun) {
    const validCatSlugs = CATEGORIES_DATA.map((c) => c.slug);
    const strayCategories = await prisma.category.findMany({
      where: { slug: { notIn: validCatSlugs } }
    });
    const defaultCat = seededCategories['lecture-notes'] || (await prisma.category.findFirst({ where: { slug: 'lecture-notes' } }));
    for (const sc of strayCategories) {
      if (defaultCat) {
        await prisma.note.updateMany({
          where: { categoryId: sc.id },
          data: { categoryId: defaultCat.id }
        });
      }
      await prisma.category.delete({ where: { id: sc.id } }).catch(() => {});
    }
  }

  // 5. Courses & Subjects
  const seededCourses = {};
  const seededSubjects = {};

  for (const prog of ACADEMIC_PROGRAMS) {
    const school = seededSchools[prog.schoolCode] || seededSchools.SOET;
    const existingCourse = await prisma.course.findUnique({ where: { slug: prog.slug } });

    let courseRecord;
    if (existingCourse) {
      stats.courses.existing++;
      if (!dryRun) {
        courseRecord = await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            name: prog.name,
            description: prog.description,
            degreeLevel: prog.degreeLevel,
            semestersCount: prog.semestersCount,
            schoolId: school.id,
            universityId: krmu.id,
            isActive: true
          }
        });
      } else {
        courseRecord = existingCourse;
      }
    } else {
      stats.courses.created++;
      if (!dryRun) {
        courseRecord = await prisma.course.create({
          data: {
            name: prog.name,
            slug: prog.slug,
            description: prog.description,
            degreeLevel: prog.degreeLevel,
            semestersCount: prog.semestersCount,
            schoolId: school.id,
            universityId: krmu.id,
            isActive: true
          }
        });
      } else {
        courseRecord = { id: `dry-${prog.slug}`, ...prog, schoolId: school.id, universityId: krmu?.id };
      }
    }
    seededCourses[prog.slug] = courseRecord;

    for (const subj of prog.subjects) {
      const existingSubj = await prisma.subject.findFirst({
        where: { courseId: courseRecord.id, slug: subj.slug }
      });

      let subjectRecord;
      if (existingSubj) {
        stats.subjects.existing++;
        if (!dryRun) {
          subjectRecord = await prisma.subject.update({
            where: { id: existingSubj.id },
            data: {
              name: subj.name,
              code: subj.code,
              semester: subj.semester,
              credits: subj.credits,
              description: subj.description,
              isActive: true
            }
          });
        } else {
          subjectRecord = existingSubj;
        }
      } else {
        stats.subjects.created++;
        if (!dryRun) {
          subjectRecord = await prisma.subject.create({
            data: {
              courseId: courseRecord.id,
              name: subj.name,
              slug: subj.slug,
              code: subj.code,
              semester: subj.semester,
              credits: subj.credits,
              description: subj.description,
              isActive: true
            }
          });
        } else {
          subjectRecord = { id: `dry-${subj.slug}`, ...subj, courseId: courseRecord.id };
        }
      }
      seededSubjects[`${prog.slug}:${subj.slug}`] = subjectRecord;
    }
  }

  // 6. Clean up obsolete subjects that aren't in ACADEMIC_PROGRAMS
  if (!dryRun) {
    const allowedSubjectSlugs = ACADEMIC_PROGRAMS.flatMap((p) => p.subjects.map((s) => s.slug));
    const straySubjects = await prisma.subject.findMany({
      where: { slug: { notIn: allowedSubjectSlugs } }
    });
    const fallbackSubject = await prisma.subject.findFirst({
      where: { slug: 'probability-statistics-linear-algebra' }
    });

    for (const oldSubj of straySubjects) {
      if (fallbackSubject) {
        await prisma.note.updateMany({
          where: { subjectId: oldSubj.id },
          data: {
            subjectId: fallbackSubject.id,
            courseId: fallbackSubject.courseId,
            semester: fallbackSubject.semester
          }
        });
      }
      await prisma.topic.deleteMany({ where: { subjectId: oldSubj.id } });
      await prisma.subject.delete({ where: { id: oldSubj.id } }).catch(() => {});
    }
  }

  return {
    stats,
    krmu,
    schools: seededSchools,
    categories: seededCategories,
    courses: seededCourses,
    subjects: seededSubjects
  };
}
