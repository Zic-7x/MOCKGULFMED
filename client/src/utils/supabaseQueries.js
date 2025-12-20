import { supabase } from '../lib/supabase';

const adminUsersApiUrl = import.meta.env.VITE_ADMIN_USERS_API_URL || '/api/admin-users';

const getSessionToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('You must be signed in to perform this action');
  }
  return token;
};

const callAdminUsersApi = async (method, payload) => {
  const token = await getSessionToken();
  const response = await fetch(adminUsersApiUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    // ignore JSON parse failures so we can throw below
  }

  if (!response.ok) {
    throw new Error(result?.error || 'Request failed');
  }

  return result?.data;
};

// User Management (Admin only)
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      profession:professions(*),
      health_authority:health_authorities(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createUserProfile = async (userData) => {
  const payload = {
    email: userData.email,
    password: userData.password,
    fullName: userData.fullName,
    professionId: userData.professionId || null,
    healthAuthorityId: userData.healthAuthorityId || null,
    dailyMcqLimit: typeof userData.dailyMcqLimit === 'number' ? userData.dailyMcqLimit : userData.dailyMcqLimit || null,
    isActive: userData.isActive !== false,
  };

  if (payload.dailyMcqLimit !== null) {
    payload.dailyMcqLimit = Number(payload.dailyMcqLimit);
  }

  return callAdminUsersApi('POST', payload);
};

export const updateUserProfile = async (userId, userData) => {
  const payload = {
    id: userId,
    fullName: userData.fullName,
    professionId: userData.professionId || null,
    healthAuthorityId: userData.healthAuthorityId || null,
    dailyMcqLimit: typeof userData.dailyMcqLimit === 'number' ? userData.dailyMcqLimit : userData.dailyMcqLimit || null,
    isActive: userData.isActive,
    password: userData.password,
  };

  if (payload.dailyMcqLimit !== null) {
    payload.dailyMcqLimit = Number(payload.dailyMcqLimit);
  }

  return callAdminUsersApi('PUT', payload);
};

export const deleteUserProfile = async (userId) => {
  await callAdminUsersApi('DELETE', { id: userId });
};

// Professions
export const getProfessions = async () => {
  const { data, error } = await supabase
    .from('professions')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const createProfession = async (professionData) => {
  const { data, error } = await supabase
    .from('professions')
    .insert(professionData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProfession = async (id, professionData) => {
  const { data, error } = await supabase
    .from('professions')
    .update(professionData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProfession = async (id) => {
  const { error } = await supabase.from('professions').delete().eq('id', id);
  if (error) throw error;
};

// Health Authorities
export const getHealthAuthorities = async () => {
  const { data, error } = await supabase
    .from('health_authorities')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const createHealthAuthority = async (haData) => {
  const { data, error } = await supabase
    .from('health_authorities')
    .insert(haData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateHealthAuthority = async (id, haData) => {
  const { data, error } = await supabase
    .from('health_authorities')
    .update(haData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteHealthAuthority = async (id) => {
  const { error } = await supabase.from('health_authorities').delete().eq('id', id);
  if (error) throw error;
};

// Exams
export const getExams = async () => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions(count),
      _count:questions(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAvailableExams = async (userId) => {
  // Get user profile first
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profession_id, health_authority_id, role')
    .eq('id', userId)
    .single();

  if (!profile) return [];

  // If admin, return all active exams
  if (profile.role === 'ADMIN') {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions(id)
      `)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  // Get accessible exam IDs from exam_access
  const { data: accessData, error: accessError } = await supabase
    .from('exam_access')
    .select('exam_id')
    .or(
      `user_id.eq.${userId},profession_id.eq.${profile.profession_id || 'null'},health_authority_id.eq.${profile.health_authority_id || 'null'}`
    );

  if (accessError) throw accessError;

  const examIds = [...new Set(accessData.map((a) => a.exam_id))];

  if (examIds.length === 0) return [];

  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions(id)
    `)
    .in('id', examIds)
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

export const getExam = async (examId, userId) => {
  // Check access first
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profession_id, health_authority_id, role, daily_mcq_limit')
    .eq('id', userId)
    .single();

  if (!profile) throw new Error('User not found');

  // Check if user has access
  if (profile.role !== 'ADMIN') {
    const { data: accessData } = await supabase
      .from('exam_access')
      .select('id')
      .eq('exam_id', examId)
      .or(
        `user_id.eq.${userId},profession_id.eq.${profile.profession_id || 'null'},health_authority_id.eq.${profile.health_authority_id || 'null'}`
      )
      .limit(1)
      .single();

    if (!accessData) {
      throw new Error('You have no access to this exam. Please contact your representative.');
    }
  }

  // Get exam with questions (include correct answers/explanations for inline feedback)
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions(
        id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
      )
    `)
    .eq('id', examId)
    .eq('is_active', true)
    .single();

  if (error) throw error;

  // Check if exam exists and has questions
  if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('You have no access to this exam. Please contact your representative.');
  }

  // Get user's previous attempts for this exam to filter out already-submitted questions
  // This ensures questions don't repeat across different days/sessions
  const { data: previousAttempts, error: attemptsError } = await supabase
    .from('exam_attempts')
    .select('answers')
    .eq('user_id', userId)
    .eq('exam_id', examId);

  if (attemptsError) {
    console.error('Error fetching previous attempts:', attemptsError);
    // Continue without filtering if there's an error, but log it
  }

  // Extract all question IDs that were already answered in previous attempts
  // Normalize all IDs to strings for consistent comparison (UUIDs can be strings or UUID objects)
  // Only include questions that were actually answered (not null/undefined)
  const answeredQuestionIds = new Set();
  if (previousAttempts && previousAttempts.length > 0) {
    previousAttempts.forEach((attempt) => {
      if (attempt.answers && typeof attempt.answers === 'object') {
        Object.keys(attempt.answers).forEach((questionId) => {
          // Only include questions that were actually answered (not null/undefined)
          const answerValue = attempt.answers[questionId];
          if (answerValue !== null && answerValue !== undefined) {
            // Normalize to string and trim whitespace for consistent comparison
            const normalizedId = String(questionId).trim();
            if (normalizedId) {
              answeredQuestionIds.add(normalizedId);
            }
          }
        });
      }
    });
  }

  // Filter out questions that were already submitted in ANY previous attempt
  // This prevents questions from repeating across different days
  let availableQuestions = data.questions.filter((question) => {
    // Normalize question ID to string for comparison
    const normalizedQuestionId = String(question.id).trim();
    return !answeredQuestionIds.has(normalizedQuestionId);
  });

  // If all questions were already answered, show a message or return empty
  if (availableQuestions.length === 0) {
    throw new Error('You have already completed all available questions for this exam.');
  }

  // Randomize the order of questions using Fisher-Yates shuffle
  for (let i = availableQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
  }

  // Randomize options for each question
  const questionsWithRandomizedOptions = availableQuestions.map((question) => {
    // Validate that all options exist (check for null/undefined specifically, not empty strings)
    if (question.option_a == null || question.option_b == null || question.option_c == null || question.option_d == null) {
      throw new Error(`Question "${question.id}" is missing one or more options. Please contact support.`);
    }

    // Create array of options with their original labels
    // Ensure all option texts are strings (handle null/undefined by converting to empty string)
    const optionA = { label: 'A', text: String(question.option_a || '') };
    const optionB = { label: 'B', text: String(question.option_b || '') };
    const optionC = { label: 'C', text: String(question.option_c || '') };
    const optionD = { label: 'D', text: String(question.option_d || '') };
    
    const options = [optionA, optionB, optionC, optionD];

    // Ensure we have exactly 4 valid options
    if (options.length !== 4) {
      throw new Error(`Question "${question.id}" must have exactly 4 options. Found ${options.length}. Please contact support.`);
    }
    
    // Validate each option object is valid
    options.forEach((opt, idx) => {
      if (!opt || typeof opt !== 'object' || !opt.hasOwnProperty('text') || !opt.hasOwnProperty('label')) {
        throw new Error(`Question "${question.id}" has invalid option at index ${idx}. Please contact support.`);
      }
    });

    // Shuffle the options array
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Validate that all options still exist after shuffling
    if (options.length !== 4 || !options[0] || !options[1] || !options[2] || !options[3]) {
      throw new Error(`Question "${question.id}" has invalid options after processing. Please contact support.`);
    }

    // Validate that all options have text property (check for existence, not truthiness - empty strings are valid)
    if (!options[0].hasOwnProperty('text') || !options[1].hasOwnProperty('text') || 
        !options[2].hasOwnProperty('text') || !options[3].hasOwnProperty('text')) {
      throw new Error(`Question "${question.id}" is missing option text property. Please contact support.`);
    }

    // Create mapping: randomized position -> original option label
    // e.g., {0: 'C', 1: 'A', 2: 'D', 3: 'B'} means position 0 shows original option C
    const optionMapping = {};
    const reverseMapping = {}; // original option -> randomized position
    options.forEach((opt, index) => {
      if (opt && opt.label) {
        optionMapping[index] = opt.label;
        reverseMapping[opt.label] = index;
      }
    });

    // Safely extract text from options (with additional safety checks)
    const getOptionText = (opt, index) => {
      if (!opt || typeof opt !== 'object' || !opt.hasOwnProperty('text')) {
        throw new Error(`Question "${question.id}" has invalid option at index ${index}. Please contact support.`);
      }
      return opt.text || '';
    };

    // Update the question with randomized options and mappings
    return {
      ...question,
      option_a: getOptionText(options[0], 0),
      option_b: getOptionText(options[1], 1),
      option_c: getOptionText(options[2], 2),
      option_d: getOptionText(options[3], 3),
      optionMapping, // Maps randomized position (0-3) to original option (A-D)
      reverseMapping, // Maps original option (A-D) to randomized position (0-3)
      // Store the randomized correct answer position for easy checking
      randomizedCorrectAnswer: reverseMapping[question.correct_answer],
    };
  });

  // Update the exam data with randomized and filtered questions
  const examDataWithRandomQuestions = {
    ...data,
    questions: questionsWithRandomizedOptions,
  };

  // Check daily limit
  let usageRecord = null;
  if (profile.daily_mcq_limit !== null) {
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('daily_mcq_usage')
      .select('mcq_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    usageRecord = usage;
    const used = usageRecord?.mcq_count || 0;
    const remaining = profile.daily_mcq_limit - used;

    // Only throw error if user has no MCQs remaining
    if (remaining <= 0) {
      throw new Error(
        `Daily MCQ limit reached. You have used all ${profile.daily_mcq_limit} MCQs for today.`
      );
    }

    // Limit questions to remaining daily limit if exam has more questions
    if (remaining < examDataWithRandomQuestions.questions.length) {
      examDataWithRandomQuestions.questions = examDataWithRandomQuestions.questions.slice(0, remaining);
    }
  }

  return {
    exam: examDataWithRandomQuestions,
    dailyUsage: {
      mcqCount: usageRecord?.mcq_count || 0,
      limit: profile.daily_mcq_limit,
      remaining:
        profile.daily_mcq_limit !== null
          ? profile.daily_mcq_limit - (usageRecord?.mcq_count || 0)
          : null,
    },
  };
};

export const createExam = async (examData) => {
  const { questions, ...examInfo } = examData;

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .insert(examInfo)
    .select()
    .single();

  if (examError) throw examError;

  if (questions && questions.length > 0) {
    const questionsData = questions.map((q) => ({
      ...q,
      exam_id: exam.id,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctAnswer,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData);

    if (questionsError) throw questionsError;
  }

  return exam;
};

export const updateExam = async (id, examData) => {
  const { data, error } = await supabase
    .from('exams')
    .update(examData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteExam = async (id) => {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
};

// Questions
export const addQuestion = async (examId, questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      exam_id: examId,
      question: questionData.question,
      option_a: questionData.optionA,
      option_b: questionData.optionB,
      option_c: questionData.optionC,
      option_d: questionData.optionD,
      correct_answer: questionData.correctAnswer,
      explanation: questionData.explanation || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const bulkAddQuestions = async (examId, questions) => {
  if (!questions || questions.length === 0) {
    throw new Error('No questions provided for bulk upload');
  }

  const payload = questions.map((q) => ({
    exam_id: examId,
    question: q.question,
    option_a: q.optionA,
    option_b: q.optionB,
    option_c: q.optionC,
    option_d: q.optionD,
    correct_answer: q.correctAnswer,
    explanation: q.explanation || null,
  }));

  const { error } = await supabase.from('questions').insert(payload);

  if (error) throw error;
};

export const updateQuestion = async (id, questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .update({
      question: questionData.question,
      option_a: questionData.optionA,
      option_b: questionData.optionB,
      option_c: questionData.optionC,
      option_d: questionData.optionD,
      correct_answer: questionData.correctAnswer,
      explanation: questionData.explanation || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteQuestion = async (id) => {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
};

// Exam Access
export const getExamAccess = async () => {
  const { data, error } = await supabase
    .from('exam_access')
    .select(`
      *,
      exam:exams(*),
      profession:professions(*),
      health_authority:health_authorities(*),
      user:user_profiles(id, email, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createExamAccess = async (accessData) => {
  const { data, error } = await supabase
    .from('exam_access')
    .insert({
      exam_id: accessData.examId,
      profession_id: accessData.professionId || null,
      health_authority_id: accessData.healthAuthorityId || null,
      user_id: accessData.userId || null,
    })
    .select(`
      *,
      exam:exams(*),
      profession:professions(*),
      health_authority:health_authorities(*),
      user:user_profiles(id, email, full_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteExamAccess = async (id) => {
  const { error } = await supabase.from('exam_access').delete().eq('id', id);
  if (error) throw error;
};

// Exam Attempts
export const submitExam = async (examId, userId, answers, timeSpent) => {
  // Get exam with correct answers
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select(`
      *,
      questions(*)
    `)
    .eq('id', examId)
    .single();

  if (examError) throw examError;

  // Calculate score
  let correctAnswers = 0;
  const totalQuestions = exam.questions.length;
  const answeredCount = exam.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null).length;

  exam.questions.forEach((question) => {
    if (answers[question.id] === question.correct_answer) {
      correctAnswers++;
    }
  });

  const score = (correctAnswers / totalQuestions) * 100;

  // Get user daily limit for later calculations
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit')
    .eq('id', userId)
    .single();
  const dailyLimit = profile?.daily_mcq_limit ?? null;

  // Create attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: userId,
      exam_id: examId,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      time_spent: timeSpent,
      answers,
    })
    .select(`
      *,
      exam:exams(title, exam_type)
    `)
    .single();

  if (attemptError) throw attemptError;

  // Update daily MCQ usage
  const today = new Date().toISOString().split('T')[0];
  const { data: existingUsage } = await supabase
    .from('daily_mcq_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (existingUsage) {
    await supabase
      .from('daily_mcq_usage')
      .update({ mcq_count: existingUsage.mcq_count + answeredCount })
      .eq('id', existingUsage.id);
  } else {
    await supabase.from('daily_mcq_usage').insert({
      user_id: userId,
      date: today,
      mcq_count: answeredCount,
    });
  }

  // Prepare results
  const results = exam.questions.map((question) => ({
    questionId: question.id,
    question: question.question,
    userAnswer: answers[question.id] || null,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    isCorrect: answers[question.id] === question.correct_answer,
  }));

  const totalExamQuestions = totalQuestions;
  const overallPercentage = totalExamQuestions > 0 ? (correctAnswers / totalExamQuestions) * 100 : 0;
  const batchInfo = dailyLimit
    ? {
        dailyLimit,
        answeredCount,
        correctCount: correctAnswers,
        percentage: Math.min((correctAnswers / dailyLimit) * 100, 100),
      }
    : null;

  return {
    attempt,
    results,
    score,
    correctAnswers,
    totalQuestions,
    totalExamQuestions,
    answeredCount,
    dailyLimit,
    batchInfo,
    overallPercentage,
  };
};

// Normalize numeric fields from Supabase (returns decimals as strings) and attach derived usage
const normalizeAttempt = (attempt, dailyLimit = null) => {
  const normalized = {
    ...attempt,
    score: typeof attempt.score === 'number' ? attempt.score : Number(attempt.score) || 0,
    total_questions:
      typeof attempt.total_questions === 'number'
        ? attempt.total_questions
        : Number(attempt.total_questions) || 0,
    correct_answers:
      typeof attempt.correct_answers === 'number'
        ? attempt.correct_answers
        : Number(attempt.correct_answers) || 0,
    time_spent:
      typeof attempt.time_spent === 'number' ? attempt.time_spent : Number(attempt.time_spent) || 0,
  };

  const answeredCount = attempt?.answers
    ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
    : normalized.total_questions;
  const correctCount = normalized.correct_answers;

  const dailyLimitPercentage =
    dailyLimit && dailyLimit > 0 ? Math.min((correctCount / dailyLimit) * 100, 100) : null;

  return {
    ...normalized,
    answeredCount,
    dailyLimit,
    correctCount,
    dailyLimitPercentage,
  };
};

export const getUserAttempts = async (userId, examId = null) => {
  // Fetch user profile once so we can compute daily-limit-based percentages
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit')
    .eq('id', userId)
    .maybeSingle();
  const dailyLimit = profile?.daily_mcq_limit ?? null;

  let query = supabase
    .from('exam_attempts')
    .select(`
      *,
      exam:exams(title, exam_type, duration)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (examId) {
    query = query.eq('exam_id', examId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map((attempt) => normalizeAttempt(attempt, dailyLimit));
};

// Dashboard
export const getUserDashboard = async (userId) => {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      *,
      profession:professions(*),
      health_authority:health_authorities(*)
    `)
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('daily_mcq_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exam:exams(title, exam_type)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(10);

  return {
    user: {
      ...profile,
      profession: profile.profession,
      healthAuthority: profile.health_authority,
      dailyMcqLimit: profile.daily_mcq_limit,
      fullName: profile.full_name,
    },
    recentAttempts: (attempts || []).map((attempt) => normalizeAttempt(attempt, profile.daily_mcq_limit)),
    dailyUsage: {
      used: usage?.mcq_count || 0,
      limit: profile.daily_mcq_limit,
      remaining:
        profile.daily_mcq_limit !== null
          ? profile.daily_mcq_limit - (usage?.mcq_count || 0)
          : null,
    },
  };
};

// Admin Stats
export const getAdminStats = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Basic counts
    const [usersResult, examsResult, attemptsResult, professionsResult, healthAuthoritiesResult] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('exam_attempts').select('id', { count: 'exact', head: true }),
      supabase.from('professions').select('id', { count: 'exact', head: true }),
      supabase.from('health_authorities').select('id', { count: 'exact', head: true }),
    ]);

    // Get all attempts for analytics
    const { data: allAttempts, error: attemptsError } = await supabase
      .from('exam_attempts')
      .select('score, completed_at, user_id, exam_id')
      .order('completed_at', { ascending: false });

    // Get recent attempts (last 10) with user daily limit
    const { data: recentAttempts } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(title, exam_type),
        user:user_profiles(full_name, email, daily_mcq_limit)
      `)
      .order('completed_at', { ascending: false })
      .limit(10);

    // Get new users (last 7 days)
    const { data: newUsers } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, created_at')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Get active users (users who attempted exams in last 7 days)
    const { data: activeUsersData } = await supabase
      .from('exam_attempts')
      .select('user_id')
      .gte('completed_at', weekAgo.toISOString());

    const uniqueActiveUsers = new Set(activeUsersData?.map(a => a.user_id) || []);

    // Calculate time-based statistics
    const attemptsToday = allAttempts?.filter(a => new Date(a.completed_at) >= today).length || 0;
    const attemptsThisWeek = allAttempts?.filter(a => new Date(a.completed_at) >= weekAgo).length || 0;
    const attemptsThisMonth = allAttempts?.filter(a => new Date(a.completed_at) >= monthAgo).length || 0;

    // Calculate average score
    const scores = allAttempts?.map(a => parseFloat(a.score) || 0).filter(s => s > 0) || [];
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    // Calculate pass rate (assuming 70% is passing)
    const passingScore = 70;
    const passingAttempts = scores.filter(s => s >= passingScore).length;
    const passRate = scores.length > 0 ? (passingAttempts / scores.length) * 100 : 0;

    // Get exam popularity (top 5 most attempted exams)
    const examAttemptCounts = {};
    allAttempts?.forEach(attempt => {
      examAttemptCounts[attempt.exam_id] = (examAttemptCounts[attempt.exam_id] || 0) + 1;
    });
    const topExamIds = Object.entries(examAttemptCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const { data: topExams } = topExamIds.length > 0
      ? await supabase
          .from('exams')
          .select('id, title, exam_type')
          .in('id', topExamIds)
      : { data: [] };

    const topExamsWithCounts = topExams?.map(exam => ({
      ...exam,
      attemptCount: examAttemptCounts[exam.id] || 0
    })).sort((a, b) => b.attemptCount - a.attemptCount) || [];

    // Get daily activity for last 7 days (for chart)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      const count = allAttempts?.filter(a => {
        const attemptDate = new Date(a.completed_at);
        return attemptDate >= date && attemptDate < nextDate;
      }).length || 0;
      
      dailyActivity.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    // Check for errors
    const errors = [
      usersResult.error,
      examsResult.error,
      attemptsResult.error,
      professionsResult.error,
      healthAuthoritiesResult.error,
      attemptsError,
    ].filter(Boolean);

    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join('; ');
      throw new Error(`Failed to load statistics: ${errorMessages}`);
    }

    return {
      // Basic counts
      totalUsers: usersResult.count || 0,
      totalExams: examsResult.count || 0,
      totalAttempts: attemptsResult.count || 0,
      totalProfessions: professionsResult.count || 0,
      totalHealthAuthorities: healthAuthoritiesResult.count || 0,
      
      // Performance metrics
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      
      // Time-based stats
      attemptsToday,
      attemptsThisWeek,
      attemptsThisMonth,
      activeUsers: uniqueActiveUsers.size,
      newUsersThisWeek: newUsers?.length || 0,
      
      // Recent activity
      recentAttempts: recentAttempts?.map(attempt => {
        const correctAnswers = typeof attempt.correct_answers === 'number' 
          ? attempt.correct_answers 
          : Number(attempt.correct_answers) || 0;
        const totalQuestions = typeof attempt.total_questions === 'number'
          ? attempt.total_questions
          : Number(attempt.total_questions) || 0;
        const dailyLimit = attempt.user?.daily_mcq_limit ?? null;
        
        // Calculate answered count from answers JSONB
        const answeredCount = attempt?.answers
          ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
          : totalQuestions;
        
        // Calculate percentages
        const totalPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const dailyLimitPercentage = dailyLimit && dailyLimit > 0 
          ? Math.min((correctAnswers / dailyLimit) * 100, 100) 
          : null;
        
        return {
          ...attempt,
          score: parseFloat(attempt.score) || 0,
          completed_at: attempt.completed_at,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
          answeredCount,
          dailyLimit,
          totalPercentage: Math.round(totalPercentage * 10) / 10,
          dailyLimitPercentage: dailyLimitPercentage !== null ? Math.round(dailyLimitPercentage * 10) / 10 : null
        };
      }) || [],
      newUsers: newUsers || [],
      
      // Top exams
      topExams: topExamsWithCounts,
      
      // Chart data
      dailyActivity,
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    throw error;
  }
};
