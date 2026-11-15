import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('Notes Ratings, Reviews & Quality Feedback Suite', async (t) => {
  let server;
  let baseUrl;

  let authorUser;
  let studentA;
  let studentB;
  let studentC;
  let moderatorUser;

  let tokenAuthor;
  let tokenA;
  let tokenB;
  let tokenC;
  let tokenMod;

  let testCourse;
  let testSubject;
  let testCategory;
  let approvedNote;
  let pendingNote;
  let rejectedNote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Setup users
    authorUser = await prisma.user.upsert({
      where: { email: 'rev_author@pjstudy.com' },
      update: {},
      create: {
        name: 'Author Scholar',
        email: 'rev_author@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForReviews',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    studentA = await prisma.user.upsert({
      where: { email: 'rev_student_a@pjstudy.com' },
      update: {},
      create: {
        name: 'Reviewer Alice',
        email: 'rev_student_a@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForReviews',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    studentB = await prisma.user.upsert({
      where: { email: 'rev_student_b@pjstudy.com' },
      update: {},
      create: {
        name: 'Reviewer Bob',
        email: 'rev_student_b@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForReviews',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    studentC = await prisma.user.upsert({
      where: { email: 'rev_student_c@pjstudy.com' },
      update: {},
      create: {
        name: 'Reviewer Charlie',
        email: 'rev_student_c@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForReviews',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    moderatorUser = await prisma.user.upsert({
      where: { email: 'rev_mod@pjstudy.com' },
      update: {},
      create: {
        name: 'Review Moderator',
        email: 'rev_mod@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForReviews',
        role: 'MODERATOR',
        isEmailVerified: true,
        isActive: true
      }
    });

    tokenAuthor = generateAccessToken(authorUser);
    tokenA = generateAccessToken(studentA);
    tokenB = generateAccessToken(studentB);
    tokenC = generateAccessToken(studentC);
    tokenMod = generateAccessToken(moderatorUser);

    // 2. Setup Course, Subject, Category
    testCourse = await prisma.course.upsert({
      where: { slug: 'rev-test-course' },
      update: {},
      create: {
        name: 'Review Testing Course',
        slug: 'rev-test-course',
        description: 'Course for testing ratings & reviews'
      }
    });

    testSubject = await prisma.subject.upsert({
      where: { course_subject_slug_unique: { courseId: testCourse.id, slug: 'rev-test-subject' } },
      update: {},
      create: {
        courseId: testCourse.id,
        name: 'Discrete Mathematics',
        slug: 'rev-test-subject',
        semester: 2
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'rev-test-category' },
      update: {},
      create: {
        name: 'Review Testing Category',
        slug: 'rev-test-category'
      }
    });

    // 3. Clean up stale test reviews and reports
    await prisma.reviewHelpfulVote.deleteMany({
      where: {
        userId: { in: [authorUser.id, studentA.id, studentB.id, studentC.id, moderatorUser.id] }
      }
    });
    await prisma.reviewReport.deleteMany({
      where: {
        reporterId: { in: [authorUser.id, studentA.id, studentB.id, studentC.id, moderatorUser.id] }
      }
    });
    await prisma.review.deleteMany({
      where: {
        userId: { in: [authorUser.id, studentA.id, studentB.id, studentC.id, moderatorUser.id] }
      }
    });
    await prisma.note.deleteMany({
      where: {
        slug: {
          in: [
            'rev-approved-discrete-math',
            'rev-pending-discrete-math',
            'rev-rejected-discrete-math'
          ]
        }
      }
    });

    // 4. Create notes
    approvedNote = await prisma.note.create({
      data: {
        title: 'Set Theory and Propositional Logic',
        slug: 'rev-approved-discrete-math',
        description: 'Complete guide to sets, relations, and truth tables',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: authorUser.id,
        semester: 2,
        status: 'APPROVED',
        viewCount: 150,
        downloadCount: 40
      }
    });

    pendingNote = await prisma.note.create({
      data: {
        title: 'Graph Theory (Under Review)',
        slug: 'rev-pending-discrete-math',
        description: 'Pending manuscript for graphs',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: authorUser.id,
        semester: 2,
        status: 'PENDING_REVIEW'
      }
    });

    rejectedNote = await prisma.note.create({
      data: {
        title: 'Incomplete Recurrence Relations',
        slug: 'rev-rejected-discrete-math',
        description: 'Rejected manuscript',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: authorUser.id,
        semester: 2,
        status: 'REJECTED'
      }
    });
  });

  t.after(async () => {
    // Cleanup test data
    await prisma.reviewHelpfulVote.deleteMany({
      where: {
        userId: { in: [authorUser.id, studentA.id, studentB.id, studentC.id, moderatorUser.id] }
      }
    });
    await prisma.reviewReport.deleteMany({
      where: {
        reporterId: { in: [authorUser.id, studentA.id, studentB.id, studentC.id, moderatorUser.id] }
      }
    });
    await prisma.review.deleteMany({
      where: {
        userId: { in: [authorUser.id, studentA.id, studentB.id, studentC.id, moderatorUser.id] }
      }
    });
    await prisma.note.deleteMany({
      where: {
        slug: {
          in: [
            'rev-approved-discrete-math',
            'rev-pending-discrete-math',
            'rev-rejected-discrete-math'
          ]
        }
      }
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  let reviewAId;
  let reviewBId;

  await t.test('1. Valid Rating Submission: Student A submits 5-star review', async () => {
    const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Outstanding proofs and intuitive explanations!'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.rating, 5);
    assert.strictEqual(body.data.comment, 'Outstanding proofs and intuitive explanations!');
    assert.strictEqual(body.data.status, 'VISIBLE');
    reviewAId = body.data.id;
  });

  await t.test('2. Reject Invalid Rating: 0, 6, floating point, non-numeric', async () => {
    // 0 stars
    const resZero = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ rating: 0 })
    });
    assert.strictEqual(resZero.status, 422);

    // 6 stars
    const resSix = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ rating: 6 })
    });
    assert.strictEqual(resSix.status, 422);

    // Float 4.5
    const resFloat = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ rating: 4.5 })
    });
    assert.strictEqual(resFloat.status, 422);
  });

  await t.test(
    '3. Prevent Duplicate Review: Submitting again updates existing review',
    async () => {
      const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          rating: 4,
          comment: 'Updated review: Very good notes overall!'
        })
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.data.id, reviewAId);
      assert.strictEqual(body.data.rating, 4);
      assert.strictEqual(body.data.comment, 'Updated review: Very good notes overall!');
    }
  );

  await t.test(
    '4. Prevent Self-Review: Author reviewing own uploaded note returns 403',
    async () => {
      const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAuthor}`
        },
        body: JSON.stringify({ rating: 5, comment: 'I love my own notes' })
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.message.includes('own uploaded notes'));
    }
  );

  await t.test(
    '5. Non-Approved Notes Invariant: Cannot review pending or rejected notes',
    async () => {
      const resPending = await fetch(`${baseUrl}/notes/${pendingNote.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({ rating: 5 })
      });
      assert.strictEqual(resPending.status, 400);

      const resRejected = await fetch(`${baseUrl}/notes/${rejectedNote.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({ rating: 5 })
      });
      assert.strictEqual(resRejected.status, 400);
    }
  );

  await t.test(
    '6. Student B submits 3-star review and student C submits 5-star review',
    async () => {
      const resB = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({ rating: 3, comment: 'Average clarity in section 3' })
      });
      assert.strictEqual(resB.status, 201);
      const bodyB = await resB.json();
      reviewBId = bodyB.data.id;

      const resC = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenC}`
        },
        body: JSON.stringify({ rating: 5, comment: 'Masterpiece on truth tables!' })
      });
      assert.strictEqual(resC.status, 201);
    }
  );

  await t.test(
    '7. Rating Aggregates & Distribution: 4 stars, 3 stars, 5 stars -> avg 4.0',
    async () => {
      const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/rating-summary`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.totalRatings, 3);
      assert.strictEqual(body.data.averageRating, 4.0);
      assert.strictEqual(body.data.distribution['3'], 1);
      assert.strictEqual(body.data.distribution['4'], 1);
      assert.strictEqual(body.data.distribution['5'], 1);
      assert.strictEqual(body.data.distribution['1'], 0);
    }
  );

  await t.test('8. Edit Owned Review via PATCH /notes/:noteId/reviews/:reviewId', async () => {
    const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews/${reviewAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ rating: 5, comment: 'Revised to 5 stars after reading chapter 4!' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.rating, 5);
  });

  await t.test(
    '9. Block Editing Foreign Review: Student B cannot edit Student A review',
    async () => {
      const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews/${reviewAId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({ rating: 1 })
      });

      assert.strictEqual(res.status, 403);
    }
  );

  await t.test('10. Helpful Voting: Student B marks Student A review as helpful', async () => {
    const res = await fetch(`${baseUrl}/reviews/${reviewAId}/helpful`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.helpfulCount, 1);
  });

  await t.test(
    '11. Prevent Self-Voting: Student A voting own review as helpful returns 400',
    async () => {
      const res = await fetch(`${baseUrl}/reviews/${reviewAId}/helpful`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` }
      });

      assert.strictEqual(res.status, 400);
    }
  );

  await t.test('12. Remove Helpful Vote: Student B un-votes review A', async () => {
    const res = await fetch(`${baseUrl}/reviews/${reviewAId}/helpful`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.helpfulCount, 0);
  });

  let reportId;
  await t.test('13. Report Inappropriate Review: Student C reports Review B', async () => {
    const res = await fetch(`${baseUrl}/reviews/${reviewBId}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`
      },
      body: JSON.stringify({
        reason: 'OFFENSIVE',
        description: 'Contains unnecessary rude remarks'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.reason, 'OFFENSIVE');
    assert.strictEqual(body.data.status, 'OPEN');
    reportId = body.data.id;
  });

  await t.test(
    '14. Prevent Report Spam: Duplicate active report from Student C returns 409',
    async () => {
      const res = await fetch(`${baseUrl}/reviews/${reviewBId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenC}`
        },
        body: JSON.stringify({
          reason: 'OFFENSIVE'
        })
      });

      assert.strictEqual(res.status, 409);
    }
  );

  await t.test(
    '15. Moderator Inspection: GET /admin/reviews/reports lists open reports',
    async () => {
      const res = await fetch(`${baseUrl}/admin/reviews/reports`, {
        headers: { Authorization: `Bearer ${tokenMod}` }
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.items.length > 0);
      const foundReport = body.data.items.find((r) => r.id === reportId);
      assert.ok(foundReport, 'Submitted report must be in moderation list');
    }
  );

  await t.test('16. Unauthorized Moderation Rejected: Student A cannot hide review', async () => {
    const res = await fetch(`${baseUrl}/admin/reviews/${reviewBId}/hide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ reason: 'Student trying to hide review' })
    });

    assert.strictEqual(res.status, 403);
  });

  await t.test(
    '17. Moderator Hides Review: Review B is hidden and excluded from rating stats',
    async () => {
      const res = await fetch(`${baseUrl}/admin/reviews/${reviewBId}/hide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMod}`
        },
        body: JSON.stringify({ reason: 'Violates respect guidelines' })
      });

      assert.strictEqual(res.status, 200);

      // Verify rating summary excludes hidden review B (was 3 stars)
      // Only Review A (5) and Review C (5) remain visible -> average 5.0, total 2
      const summaryRes = await fetch(`${baseUrl}/notes/${approvedNote.id}/rating-summary`);
      const summaryBody = await summaryRes.json();
      assert.strictEqual(summaryBody.data.totalRatings, 2);
      assert.strictEqual(summaryBody.data.averageRating, 5.0);
      assert.strictEqual(summaryBody.data.distribution['3'], 0);
    }
  );

  await t.test(
    '18. Moderator Restores Review: Review B is visible again and included in stats',
    async () => {
      const res = await fetch(`${baseUrl}/admin/reviews/${reviewBId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenMod}`
        }
      });

      assert.strictEqual(res.status, 200);

      const summaryRes = await fetch(`${baseUrl}/notes/${approvedNote.id}/rating-summary`);
      const summaryBody = await summaryRes.json();
      assert.strictEqual(summaryBody.data.totalRatings, 3);
    }
  );

  await t.test('19. Moderator Dismisses Report: Report status changes to DISMISSED', async () => {
    const res = await fetch(`${baseUrl}/admin/review-reports/${reportId}/dismiss`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenMod}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'DISMISSED');
  });

  await t.test('20. Delete Owned Review: Student A deletes own review', async () => {
    const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/reviews/${reviewAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(res.status, 200);

    // Verify rating summary excludes deleted review A
    const summaryRes = await fetch(`${baseUrl}/notes/${approvedNote.id}/rating-summary`);
    const summaryBody = await summaryRes.json();
    assert.strictEqual(summaryBody.data.totalRatings, 2);
  });

  await t.test('21. Reviews Pagination and Sorting', async () => {
    const res = await fetch(
      `${baseUrl}/notes/${approvedNote.id}/reviews?page=1&limit=5&sort=newest`
    );
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.items));
    assert.strictEqual(body.data.pagination.page, 1);
  });

  t.after(async () => {
    await prisma.reviewReport.deleteMany({
      where: { reporter: { email: { contains: 'review-' } } }
    });
    await prisma.reviewHelpfulVote.deleteMany({
      where: { user: { email: { contains: 'review-' } } }
    });
    await prisma.review.deleteMany({
      where: { user: { email: { contains: 'review-' } } }
    });
    await prisma.note.deleteMany({
      where: { uploadedBy: { email: { contains: 'review-' } } }
    });
    await prisma.subject.deleteMany({
      where: { slug: 'rev-test-subject' }
    });
    await prisma.course.deleteMany({
      where: { slug: 'rev-test-course' }
    });
    await prisma.category.deleteMany({
      where: { slug: 'rev-test-category' }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'review-' } }
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
