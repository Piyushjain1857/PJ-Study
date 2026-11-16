/**
 * PJ Study Student Reviews & Ratings Seeding Module
 * Seeds peer commentary, 4-5 star ratings, and helpful community votes.
 */

export async function seedReviews(prisma, notesData, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    reviews: { created: 0, existing: 0 },
    helpfulVotes: { created: 0, existing: 0 }
  };

  if (mode === 'core' || !notesData.publishedNotes || notesData.publishedNotes.length === 0) {
    return { stats, reviews: [] };
  }

  const students = userData.students.filter((s) => s.isActive);
  if (students.length === 0) return { stats, reviews: [] };

  const reviewSpecs = [
    { rating: 5, comment: 'Crystal clear explanations on matrix diagonalization and SVD. Helped me ace my mid-term exam!', daysBack: 22 },
    { rating: 5, comment: 'The clean code examples and recursion trace diagrams make complex algorithmic logic intuitive.', daysBack: 20 },
    { rating: 5, comment: 'Super helpful summary of DOM event bubbling and CSS flexbox box model. Practical and concise.', daysBack: 18 },
    { rating: 4, comment: 'Thorough coverage of BCNF and 3NF functional dependencies with worked normalization examples.', daysBack: 16 },
    { rating: 5, comment: 'Best operating systems handout on paging and address translation. Diagrams are top notch.', daysBack: 15 },
    { rating: 5, comment: 'Comprehensive DAX formulas for Power BI. Perfect for solving the end-of-semester project.', daysBack: 14 },
    { rating: 4, comment: 'Great multivariable calculus reference. The directional derivative proofs are very clear.', daysBack: 12 },
    { rating: 5, comment: 'Amortized analysis accounting method explained simply. Saved me hours before my internal test.', daysBack: 10 },
    { rating: 5, comment: 'High performance computing notes with real CUDA kernel code. Excellent graduate-level material.', daysBack: 8 },
    { rating: 4, comment: 'Very practical PHP PDO prepared statement examples. Helped me secure my backend assignment.', daysBack: 6 },
    { rating: 5, comment: 'The circuit minimization K-Map shortcuts in this sheet are lifesavers for exam prep.', daysBack: 5 },
    { rating: 5, comment: 'Concise, rigorous, and directly mapped to KRMU end-term syllabus. Highly recommended!', daysBack: 4 }
  ];

  const targetCount = mode === 'demo' ? 3 : reviewSpecs.length;
  const createdReviews = [];

  for (let i = 0; i < targetCount; i++) {
    const rev = reviewSpecs[i];
    const student = students[(i * 2 + 1) % students.length];
    const note = notesData.publishedNotes[(i * 3) % notesData.publishedNotes.length];

    const existing = await prisma.review.findFirst({
      where: { userId: student.id, noteId: note.id }
    });

    let reviewRecord;
    if (existing) {
      stats.reviews.existing++;
      reviewRecord = existing;
    } else {
      stats.reviews.created++;
      if (!dryRun) {
        reviewRecord = await prisma.review.create({
          data: {
            userId: student.id,
            noteId: note.id,
            rating: rev.rating,
            comment: rev.comment,
            status: 'VISIBLE',
            createdAt: new Date(Date.now() - rev.daysBack * 86400000)
          }
        });
      }
    }

    if (reviewRecord) {
      createdReviews.push(reviewRecord);
      if (!dryRun) {
        for (let v = 0; v < 3; v++) {
          const voter = students[(i * 3 + v + 3) % students.length];
          if (voter.id !== student.id) {
            const voteExists = await prisma.reviewHelpfulVote.findFirst({
              where: { reviewId: reviewRecord.id, userId: voter.id }
            });
            if (voteExists) {
              stats.helpfulVotes.existing++;
            } else {
              stats.helpfulVotes.created++;
              await prisma.reviewHelpfulVote.create({
                data: {
                  reviewId: reviewRecord.id,
                  userId: voter.id,
                  createdAt: new Date(Date.now() - (rev.daysBack - 1) * 86400000)
                }
              }).catch(() => {});
            }
          }
        }
      }
    }
  }

  return { stats, reviews: createdReviews };
}
