-- Clearer, exam-focused package copy for the catalog (packages + registration pages).

UPDATE packages
SET
  description =
    'One month of profession-matched mock exams—best when you want a short, intensive block before your test date.',
  features =
    '["Revision-style mock exams aligned to your profession","Daily multiple-choice limit you control on your profile (up to 100 per day when enabled)"]'::jsonb
WHERE name = 'Basic Monthly';

UPDATE packages
SET
  description =
    'Three months of access with clinical scenario–based questions, a higher daily practice limit, and time to work weak areas.',
  features =
    '["Clinical scenario–based questions (vignettes and management decisions)","Past examination themes and data where we publish them","Daily multiple-choice limit you control on your profile (up to 150 per day when enabled)"]'::jsonb
WHERE name = 'Acing the Exam (3 Months)';

UPDATE packages
SET
  description =
    'Twelve months of full access—including clinical scenario practice and the highest daily limit for candidates who want year-round preparation.',
  features =
    '["Clinical scenario–based questions across the syllabus","Past examination themes and data where we publish them","Daily multiple-choice limit you control on your profile (up to 300 per day when enabled)"]'::jsonb
WHERE name = 'Mastering the Exam Annual (12 Months)';
