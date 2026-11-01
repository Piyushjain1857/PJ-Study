import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPaginationParams, buildPaginatedResponse } from '../src/utils/pagination.js';
import { slugify } from '../src/modules/courses/course.service.js';
import { userService } from '../src/modules/users/user.service.js';
import { subjectService } from '../src/modules/subjects/subject.service.js';
import { noteService } from '../src/modules/notes/note.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Database Architecture & Domain Invariants Test Suite', async (t) => {
  // -------------------------------------------------------------------------
  // 1. Pagination Utility Tests
  // -------------------------------------------------------------------------
  await t.test('Pagination utility should handle normal and edge case query inputs', () => {
    // Default fallback
    const defaults = getPaginationParams({});
    assert.equal(defaults.page, 1);
    assert.equal(defaults.limit, 10);
    assert.equal(defaults.skip, 0);
    assert.equal(defaults.take, 10);

    // Custom valid params
    const custom = getPaginationParams({ page: '3', limit: '25' });
    assert.equal(custom.page, 3);
    assert.equal(custom.limit, 25);
    assert.equal(custom.skip, 50);
    assert.equal(custom.take, 25);

    // Enforce max limit cap (100)
    const capped = getPaginationParams({ page: '1', limit: '500' });
    assert.equal(capped.limit, 100);

    // Handle invalid/negative values gracefully
    const invalid = getPaginationParams({ page: '-5', limit: 'abc' });
    assert.equal(invalid.page, 1);
    assert.equal(invalid.limit, 10);

    // Build paginated response envelope
    const envelope = buildPaginatedResponse(['note1', 'note2'], 25, { page: 2, limit: 10 });
    assert.equal(envelope.items.length, 2);
    assert.equal(envelope.meta.page, 2);
    assert.equal(envelope.meta.limit, 10);
    assert.equal(envelope.meta.totalItems, 25);
    assert.equal(envelope.meta.totalPages, 3);
    assert.equal(envelope.meta.hasNextPage, true);
    assert.equal(envelope.meta.hasPrevPage, true);
  });

  // -------------------------------------------------------------------------
  // 2. Slugify Invariant Tests
  // -------------------------------------------------------------------------
  await t.test('slugify should normalize titles into URL-friendly keys', () => {
    assert.equal(slugify('B.Tech Computer Science!'), 'b-tech-computer-science');
    assert.equal(slugify('Data Structures & Algorithms (2026)'), 'data-structures-algorithms-2026');
    assert.equal(slugify('   Multiple   Spaces---Here   '), 'multiple-spaces-here');
  });

  // -------------------------------------------------------------------------
  // 3. User Invariant Validation Tests
  // -------------------------------------------------------------------------
  await t.test('User service should enforce name, email format, and role enum', async () => {
    // Missing name
    await assert.rejects(
      userService.createUser({ name: '', email: 'test@pjstudy.com', passwordHash: 'hash' }),
      { statusCode: 400, message: 'User name is required.' }
    );

    // Invalid email
    await assert.rejects(
      userService.createUser({ name: 'Alex', email: 'not-an-email', passwordHash: 'hash' }),
      { statusCode: 400, message: 'A valid email address is required.' }
    );

    // Missing passwordHash
    await assert.rejects(
      userService.createUser({ name: 'Alex', email: 'alex@pjstudy.com', passwordHash: '' }),
      { statusCode: 400, message: 'Password hash is required for account creation.' }
    );

    // Invalid role
    await assert.rejects(
      userService.createUser({
        name: 'Alex',
        email: 'alex@pjstudy.com',
        passwordHash: 'hash',
        role: 'SUPER_USER'
      }),
      { statusCode: 400 }
    );
  });

  // -------------------------------------------------------------------------
  // 4. Subject Invariant Validation Tests
  // -------------------------------------------------------------------------
  await t.test('Subject service should enforce semester integer bounds (1 to 12)', async () => {
    // Semester below 1
    await assert.rejects(
      subjectService.createSubject({
        courseId: 'c1',
        name: 'Calculus',
        semester: 0
      }),
      { statusCode: 400, message: 'Semester must be an integer between 1 and 12.' }
    );

    // Semester above 12
    await assert.rejects(
      subjectService.createSubject({
        courseId: 'c1',
        name: 'Calculus',
        semester: 13
      }),
      { statusCode: 400, message: 'Semester must be an integer between 1 and 12.' }
    );
  });

  // -------------------------------------------------------------------------
  // 5. Note Review Rating Bounds Tests (1 to 5)
  // -------------------------------------------------------------------------
  await t.test('Note review invariant should strictly enforce 1 to 5 integer rating', async () => {
    // Rating = 0 (below 1)
    await assert.rejects(noteService.reviewNote('user-1', 'note-1', 0, 'Too low'), {
      statusCode: 400,
      message: 'Rating must be an integer between 1 and 5.'
    });

    // Rating = 6 (above 5)
    await assert.rejects(noteService.reviewNote('user-1', 'note-1', 6, 'Too high'), {
      statusCode: 400,
      message: 'Rating must be an integer between 1 and 5.'
    });

    // Non-numeric rating
    await assert.rejects(noteService.reviewNote('user-1', 'note-1', 'five', 'String rating'), {
      statusCode: 400,
      message: 'Rating must be an integer between 1 and 5.'
    });
  });

  // -------------------------------------------------------------------------
  // 6. Note Creation Invariants (file size, non-empty title)
  // -------------------------------------------------------------------------
  await t.test('Note creation should reject empty title and zero byte files', async () => {
    await assert.rejects(
      noteService.createNote({
        title: '',
        fileName: 'lecture.pdf',
        storageKey: 'notes/123.pdf',
        fileSize: 1024,
        courseId: 'c1',
        subjectId: 's1',
        uploadedById: 'u1'
      }),
      { statusCode: 400, message: 'Note title is required.' }
    );

    await assert.rejects(
      noteService.createNote({
        title: 'Quantum Mechanics',
        fileName: 'lecture.pdf',
        storageKey: 'notes/123.pdf',
        fileSize: 0,
        courseId: 'c1',
        subjectId: 's1',
        uploadedById: 'u1'
      }),
      { statusCode: 400, message: 'File size must be greater than zero bytes.' }
    );
  });

  // -------------------------------------------------------------------------
  // 7. Prisma Schema & Migration SQL Verification
  // -------------------------------------------------------------------------
  await t.test(
    'Generated Migration SQL should contain all 9 core tables, foreign keys, and indexes',
    () => {
      const migrationPath = path.resolve(
        __dirname,
        '../prisma/migrations/20261101000000_init_core_schema/migration.sql'
      );
      assert.ok(fs.existsSync(migrationPath), 'Migration SQL file must exist on disk.');

      const sqlContent = fs.readFileSync(migrationPath, 'utf8');

      // Table creation checks
      const expectedTables = [
        'CREATE TABLE `users`',
        'CREATE TABLE `courses`',
        'CREATE TABLE `subjects`',
        'CREATE TABLE `topics`',
        'CREATE TABLE `notes`',
        'CREATE TABLE `bookmarks`',
        'CREATE TABLE `reviews`',
        'CREATE TABLE `reports`',
        'CREATE TABLE `audit_logs`'
      ];

      for (const tableSql of expectedTables) {
        assert.ok(sqlContent.includes(tableSql), `Migration must contain DDL for: ${tableSql}`);
      }

      // Unique Composite Constraint checks
      assert.ok(sqlContent.includes('UNIQUE INDEX `subjects_course_id_slug_key`'));
      assert.ok(sqlContent.includes('UNIQUE INDEX `topics_subject_id_slug_key`'));
      assert.ok(sqlContent.includes('UNIQUE INDEX `bookmarks_user_id_note_id_key`'));
      assert.ok(sqlContent.includes('UNIQUE INDEX `reviews_user_id_note_id_key`'));

      // Critical Deletion Cascades & Restraints checks
      assert.ok(sqlContent.includes('ON DELETE RESTRICT')); // Protect academic taxonomy from cascading deletion
      assert.ok(sqlContent.includes('ON DELETE CASCADE')); // Clean up user bookmarks and reviews when note deleted
      assert.ok(sqlContent.includes('ON DELETE SET NULL')); // Retain audit logs and moderation records when user deleted
    }
  );
});
