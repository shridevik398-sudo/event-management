/**
 * bulkUploadWorker.js — Web Worker for chunked CSV/Excel parsing.
 * Runs off the main thread so the UI never freezes on large files.
 * Communicates via postMessage with the main thread.
 */

// We use Papa (loaded from main thread's import) and XLSX dynamically.
// For the worker, we import them via importScripts-style dynamic imports.

const CHUNK_SIZE = 500; // rows per chunk

self.onmessage = async function (e) {
  const { type, payload } = e.data;

  if (type === 'PARSE_AND_VALIDATE') {
    const { rows, columns, fieldMapping, requiredFields } = payload;

    const results = [];
    const errors = [];
    const emailsSeen = new Set();

    const total = rows.length;
    let processed = 0;

    // Process in chunks
    for (let chunkStart = 0; chunkStart < total; chunkStart += CHUNK_SIZE) {
      const chunk = rows.slice(chunkStart, chunkStart + CHUNK_SIZE);

      chunk.forEach((rawRow, chunkIdx) => {
        const rowNum = chunkStart + chunkIdx + 1;
        const mapped = {};

        // Apply field mapping (user-chosen column → field name)
        for (const [field, sourceCol] of Object.entries(fieldMapping)) {
          mapped[field] = rawRow[sourceCol]?.toString().trim() ?? '';
        }

        const rowErrors = [];

        // Validate required fields
        for (const field of requiredFields) {
          if (!mapped[field]) rowErrors.push(`Missing required field: ${field}`);
        }

        // Email validation
        if (mapped.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(mapped.email)) {
            rowErrors.push(`Invalid email: ${mapped.email}`);
          } else if (emailsSeen.has(mapped.email.toLowerCase())) {
            rowErrors.push(`Duplicate email in file: ${mapped.email}`);
          } else {
            emailsSeen.add(mapped.email.toLowerCase());
          }
        } else if (requiredFields.includes('email')) {
          rowErrors.push('Email is required');
        }

        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, reasons: rowErrors, data: rawRow });
        } else {
          results.push(mapped);
        }
      });

      processed += chunk.length;

      // Report progress after each chunk
      self.postMessage({
        type: 'PROGRESS',
        payload: {
          processed,
          total,
          percent: Math.round((processed / total) * 100),
          validSoFar: results.length,
          errorsSoFar: errors.length,
        },
      });

      // Yield to the event loop between chunks
      await new Promise((r) => setTimeout(r, 0));
    }

    self.postMessage({
      type: 'DONE',
      payload: { results, errors, total, valid: results.length },
    });
  }
};
