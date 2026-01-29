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

  let exams = [];

  // If admin, return all active exams
  if (profile.role === 'ADMIN') {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    exams = data || [];
  } else {
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
      .select('*')
      .in('id', examIds)
      .eq('is_active', true);

    if (error) throw error;
    exams = data || [];
  }

  // Get actual question counts for each exam from the database
  const examsWithCounts = await Promise.all(
    exams.map(async (exam) => {
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', exam.id);

      if (countError) {
        console.error(`Error getting question count for exam ${exam.id}:`, countError);
        return { ...exam, questions: [] };
      }

      return {
        ...exam,
        questions: Array(count || 0).fill(null).map((_, i) => ({ id: i })), // Create array for compatibility
        _questionCount: count || 0, // Store actual count
      };
    })
  );

  return examsWithCounts;
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

  // First, get the actual total count of questions in the database for this exam
  const { count: totalQuestionsInDatabase, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);

  if (countError) {
    console.error('Error getting question count:', countError);
  }

  // Get ALL question IDs from the database (not just paginated results)
  // This ensures we check all questions, not just the first 1000
  // Use pagination to get all IDs if there are more than 1000
  let allQuestionIdsData = [];
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;
  
  while (hasMore) {
    const { data: pageData, error: allIdsError } = await supabase
      .from('questions')
      .select('id')
      .eq('exam_id', examId)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (allIdsError) {
      console.error('Error getting all question IDs:', allIdsError);
      break;
    }
    
    if (pageData && pageData.length > 0) {
      allQuestionIdsData = allQuestionIdsData.concat(pageData);
      hasMore = pageData.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  // Get exam with questions (include correct answers/explanations for inline feedback)
  // Note: Supabase may limit results, so we get questions but also have the count above
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

  // Use the actual database count, or fall back to returned questions length
  // Safely determine the actual total questions in the database:
  // - Prefer a positive DB count
  // - If DB count is 0 or null but we have allQuestionIdsData or questions array, fall back to those
  const dbTotalQuestions =
    typeof totalQuestionsInDatabase === 'number' && totalQuestionsInDatabase > 0
      ? totalQuestionsInDatabase
      : null;
  const actualTotalQuestions =
    dbTotalQuestions ??
    (allQuestionIdsData && allQuestionIdsData.length > 0
      ? allQuestionIdsData.length
      : data.questions?.length || 0);

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
            // Handle UUID objects by converting to string first
            let normalizedId = questionId;
            if (typeof questionId !== 'string') {
              normalizedId = String(questionId);
            }
            normalizedId = normalizedId.trim().toLowerCase();
            if (normalizedId) {
              answeredQuestionIds.add(normalizedId);
            }
          }
        });
      }
    });
  }

  // Get all question IDs from database (normalized) for comparison
  // Also keep a map of normalized -> original ID for querying
  const allQuestionIdsInDatabase = new Set();
  const normalizedToOriginalIdMap = new Map();
  
  if (allQuestionIdsData && allQuestionIdsData.length > 0) {
    allQuestionIdsData.forEach((q) => {
      let originalId = q.id;
      let id = originalId;
      if (typeof id !== 'string') id = String(id);
      const normalized = id.trim().toLowerCase();
      allQuestionIdsInDatabase.add(normalized);
      normalizedToOriginalIdMap.set(normalized, originalId);
    });
  } else {
    // Fallback: use questions from the exam query
    data.questions.forEach((q) => {
      let originalId = q.id;
      let id = originalId;
      if (typeof id !== 'string') id = String(id);
      const normalized = id.trim().toLowerCase();
      allQuestionIdsInDatabase.add(normalized);
      normalizedToOriginalIdMap.set(normalized, originalId);
    });
  }

  // Filter out questions that were already submitted in ANY previous attempt
  // This prevents questions from repeating across different days
  // Only include questions that exist in the database and haven't been answered
  let availableQuestions = data.questions.filter((question) => {
    // Normalize question ID to string for comparison
    // Handle UUID objects by converting to string first
    let normalizedQuestionId = question.id;
    if (typeof normalizedQuestionId !== 'string') {
      normalizedQuestionId = String(normalizedQuestionId);
    }
    normalizedQuestionId = normalizedQuestionId.trim().toLowerCase();
    // Check if this question hasn't been answered
    return !answeredQuestionIds.has(normalizedQuestionId);
  });

  // Check if user has answered all questions in the database
  // Compare against actual database count, not just returned questions
  const remainingQuestionsCount = actualTotalQuestions - answeredQuestionIds.size;
  
  // IMPORTANT: Only throw error if user has truly answered ALL questions in the database
  // Check remainingQuestionsCount first to avoid false positives
  if (remainingQuestionsCount <= 0) {
    // User has answered all questions - this is the only case where we should throw
    // Add debug info to help diagnose the issue
    const allQuestionIds = data.questions.map(q => {
      let id = q.id;
      if (typeof id !== 'string') id = String(id);
      return id.trim().toLowerCase();
    });
    const answeredIds = Array.from(answeredQuestionIds);
    
    console.error('No available questions after filtering:', {
      totalQuestionsInDatabase: actualTotalQuestions,
      questionsReturnedInQuery: data.questions.length,
      answeredQuestionIdsCount: answeredQuestionIds.size,
      remainingQuestionsCount: remainingQuestionsCount,
      answeredQuestionIds: answeredIds.slice(0, 10), // First 10 for debugging
      allQuestionIds: allQuestionIds.slice(0, 10), // First 10 for debugging
      previousAttemptsCount: previousAttempts?.length || 0,
    });
    
    throw new Error(
      `You have already completed all available questions for this exam. ` +
      `(Total questions in database: ${actualTotalQuestions}, Questions answered: ${answeredQuestionIds.size})`
    );
  }
  
  // If no questions in returned set but there are still questions in database,
  // it means Supabase pagination limited the results - we need to fetch more
  if (availableQuestions.length === 0 && remainingQuestionsCount > 0) {
    console.warn('No questions in returned query, but database has more questions. Fetching all questions and filtering client-side...', {
      totalQuestionsInDatabase: actualTotalQuestions,
      questionsReturnedInQuery: data.questions.length,
      answeredQuestionIdsCount: answeredQuestionIds.size,
      remainingQuestionsCount: remainingQuestionsCount,
    });
    
    // Use a simpler, more reliable approach: fetch all questions in batches and filter client-side
    // This avoids issues with .in() clause limits
    let allQuestionsFromDB = [];
    let hasMoreQuestions = true;
    let questionPage = 0;
    const questionPageSize = 1000;
    
    while (hasMoreQuestions && allQuestionsFromDB.length < actualTotalQuestions) {
      const { data: pageQuestions, error: pageError } = await supabase
        .from('questions')
        .select('id, question, option_a, option_b, option_c, option_d, correct_answer, explanation')
        .eq('exam_id', examId)
        .range(questionPage * questionPageSize, (questionPage + 1) * questionPageSize - 1);
      
      if (pageError) {
        console.error(`Error fetching questions page ${questionPage}:`, pageError);
        break;
      }
      
      if (pageQuestions && pageQuestions.length > 0) {
        allQuestionsFromDB = allQuestionsFromDB.concat(pageQuestions);
        hasMoreQuestions = pageQuestions.length === questionPageSize;
        questionPage++;
      } else {
        hasMoreQuestions = false;
      }
    }
    
    if (allQuestionsFromDB.length > 0) {
      // Filter client-side to get unanswered questions
      const unansweredQuestions = allQuestionsFromDB.filter((question) => {
        let normalizedQuestionId = question.id;
        if (typeof normalizedQuestionId !== 'string') {
          normalizedQuestionId = String(normalizedQuestionId);
        }
        normalizedQuestionId = normalizedQuestionId.trim().toLowerCase();
        return !answeredQuestionIds.has(normalizedQuestionId);
      });
      
      if (unansweredQuestions.length > 0) {
        availableQuestions = unansweredQuestions;
        console.log(`Successfully fetched ${unansweredQuestions.length} unanswered questions out of ${allQuestionsFromDB.length} total questions`);
      } else {
        // This shouldn't happen if remainingQuestionsCount > 0, but handle it anyway
        console.error('Filtered all questions but found none unanswered. This indicates a data mismatch.', {
          totalFetched: allQuestionsFromDB.length,
          answeredCount: answeredQuestionIds.size,
          remainingExpected: remainingQuestionsCount,
        });
        throw new Error(
          `Unable to load available questions. ` +
          `(Total questions in database: ${actualTotalQuestions}, Questions answered: ${answeredQuestionIds.size}, ` +
          `Remaining: ${remainingQuestionsCount}, Fetched: ${allQuestionsFromDB.length})`
        );
      }
    } else {
      throw new Error(
        `Unable to load available questions. ` +
        `(Total questions in database: ${actualTotalQuestions}, Questions answered: ${answeredQuestionIds.size}, ` +
        `Remaining: ${remainingQuestionsCount}, Could not fetch questions from database)`
      );
    }
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
export const submitExam = async (examId, userId, answers, timeSpent, clientCorrectCount = null) => {
  // Helper to normalize IDs (UUIDs) to a consistent lowercase string
  const normalizeId = (id) => {
    if (!id) return '';
    let str = id;
    if (typeof str !== 'string') {
      str = String(str);
    }
    return str.trim().toLowerCase();
  };

  // Normalize the answers object keys so they match normalized question IDs
  const normalizedAnswers = {};
  if (answers && typeof answers === 'object') {
    Object.keys(answers).forEach((key) => {
      const normalizedKey = normalizeId(key);
      if (normalizedKey) {
        normalizedAnswers[normalizedKey] = answers[key];
      }
    });
  }

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

  // Build a lookup map of questions by normalized ID
  const questionsById = new Map();
  (exam.questions || []).forEach((question) => {
    const normalizedQuestionId = normalizeId(question.id);
    if (normalizedQuestionId) {
      questionsById.set(normalizedQuestionId, question);
    }
  });

  // Calculate how many questions in this attempt were actually answered
  let correctAnswers = 0;
  let answeredCount = 0;

  Object.keys(normalizedAnswers).forEach((normalizedId) => {
    const question = questionsById.get(normalizedId);
    if (!question) return;

    const userAnswer = normalizedAnswers[normalizedId];
    if (userAnswer !== null && userAnswer !== undefined) {
      answeredCount++;
      if (userAnswer === question.correct_answer) {
        correctAnswers++;
      }
    }
  });

  // If the client provided a trusted correct-count based on the same
  // randomized questions it displayed (randomizedCorrectAnswer),
  // prefer that value. This protects against any rare ID-mapping issues
  // between the client and the exam/questions fetched here.
  if (typeof clientCorrectCount === 'number' && clientCorrectCount >= 0) {
    correctAnswers = clientCorrectCount;
  }

  // Get user daily limit and total exam questions count
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit')
    .eq('id', userId)
    .single();
  const dailyLimit = profile?.daily_mcq_limit ?? null;

  // Get total questions in exam from database
  const { count: totalExamQuestionsInDB } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);

  // Safely determine total exam questions:
  // - Prefer a positive DB count
  // - If DB count is 0 or null but we have questions from the joined exam, fall back to that length
  // - As a last resort, fall back to the number of questions answered in this attempt
  const dbQuestionCount =
    typeof totalExamQuestionsInDB === 'number' && totalExamQuestionsInDB > 0
      ? totalExamQuestionsInDB
      : null;
  const totalExamQuestions =
    dbQuestionCount ??
    (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0
      ? exam.questions.length
      : answeredCount);
  const totalQuestionsAnswered = answeredCount;

  // Get all previous attempts for this exam to calculate cumulative metrics
  const { data: previousAttempts } = await supabase
    .from('exam_attempts')
    .select('correct_answers, total_questions, answers')
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .order('completed_at', { ascending: true });

  // Calculate cumulative correct answers and answered questions across all attempts (including this one)
  let cumulativeCorrectAnswers = correctAnswers;
  let cumulativeAnsweredQuestions = answeredCount;

  if (previousAttempts && previousAttempts.length > 0) {
    previousAttempts.forEach((prevAttempt) => {
      cumulativeCorrectAnswers += typeof prevAttempt.correct_answers === 'number' 
        ? prevAttempt.correct_answers 
        : Number(prevAttempt.correct_answers) || 0;
      
      // Count answered questions from previous attempts
      const prevAnsweredCount = prevAttempt.answers
        ? Object.values(prevAttempt.answers).filter((val) => val !== null && val !== undefined).length
        : (typeof prevAttempt.total_questions === 'number' ? prevAttempt.total_questions : Number(prevAttempt.total_questions) || 0);
      
      cumulativeAnsweredQuestions += prevAnsweredCount;
    });
  }

  // THREE METRICS SYSTEM:
  // 1. MAIN SCORE: Correct Answers / Daily Limit (primary metric)
  const mainScore = dailyLimit && dailyLimit > 0
    ? Math.min((correctAnswers / dailyLimit) * 100, 100) // Cap at 100%
    : null; // No main score if no daily limit

  // 2. ATTEMPT OVERVIEW: Cumulative Correct Answers / Cumulative Questions Answered in ALL attempts till this attempt
  const attemptOverview = cumulativeAnsweredQuestions > 0
    ? (cumulativeCorrectAnswers / cumulativeAnsweredQuestions) * 100
    : 0;

  // 3. OVERALL RESULT: Cumulative Correct Answers / Total MCQs in database for this exam
  // This reflects overall progress across all attempts, not just this one.
  const overallResult = totalExamQuestions > 0
    ? (cumulativeCorrectAnswers / totalExamQuestions) * 100
    : 0;

  // Use main score if available, otherwise use attempt overview as the primary score
  const score = mainScore !== null ? mainScore : attemptOverview;

  // Create attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: userId,
      exam_id: examId,
      score,
      total_questions: totalQuestionsAnswered,
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

  // Prepare per-question results for the questions that belong to this attempt
  const results = (exam.questions || []).map((question) => {
    const normalizedQuestionId = normalizeId(question.id);
    const userAnswer = normalizedQuestionId ? normalizedAnswers[normalizedQuestionId] : undefined;

    return {
      questionId: question.id,
      question: question.question,
      userAnswer: userAnswer ?? null,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      isCorrect: userAnswer === question.correct_answer,
    };
  });

  return {
    attempt,
    results,
    // Primary score (main score or attempt overview)
    score,
    // Three metrics system
    mainScore, // Correct / Daily Limit (primary if daily limit exists)
    attemptOverview, // Cumulative Correct / Cumulative Questions Answered in ALL attempts
    overallResult, // Correct / Total MCQs in database
    // Supporting data
    correctAnswers,
    totalQuestionsAnswered,
    totalExamQuestions,
    answeredCount,
    dailyLimit,
    // Cumulative data for attempt overview
    cumulativeCorrectAnswers,
    cumulativeAnsweredQuestions,
  };
};

// Normalize numeric fields from Supabase (returns decimals as strings) and attach derived usage
// This function is used for existing attempts, so we calculate all three metrics
// cumulativeCorrectAnswers and cumulativeAnsweredQuestions should be passed for attempt overview calculation
const normalizeAttempt = (attempt, dailyLimit = null, totalExamQuestions = null, cumulativeCorrectAnswers = null, cumulativeAnsweredQuestions = null) => {
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

  // Use provided total exam questions or fallback to total_questions.
  // Be careful with 0: if caller passes 0 but this attempt clearly has questions,
  // prefer the attempt's total_questions as a safer fallback.
  const hasValidTotalFromCaller =
    typeof totalExamQuestions === 'number' && totalExamQuestions > 0;
  const totalExamQuestionsCount = hasValidTotalFromCaller
    ? totalExamQuestions
    : normalized.total_questions;

  // Use provided cumulative values or calculate from this attempt only
  const cumulativeCorrect = cumulativeCorrectAnswers !== null ? cumulativeCorrectAnswers : correctCount;
  const cumulativeAnswered = cumulativeAnsweredQuestions !== null ? cumulativeAnsweredQuestions : answeredCount;

  // THREE METRICS SYSTEM:
  // 1. MAIN SCORE: Correct Answers / Daily Limit (primary metric)
  const mainScore = dailyLimit && dailyLimit > 0
    ? Math.min((correctCount / dailyLimit) * 100, 100) // Cap at 100%
    : null;

  // 2. ATTEMPT OVERVIEW: Cumulative Correct Answers / Cumulative Questions Answered in ALL attempts till this attempt
  const attemptOverview = cumulativeAnswered > 0
    ? (cumulativeCorrect / cumulativeAnswered) * 100
    : 0;

  // 3. OVERALL RESULT: Cumulative Correct Answers / Total MCQs in database for this exam
  // This reflects overall progress across all attempts, not just this one.
  const overallResult = totalExamQuestionsCount > 0
    ? (cumulativeCorrect / totalExamQuestionsCount) * 100
    : 0;

  // Use main score if available, otherwise use attempt overview as the primary score
  const recalculatedScore = mainScore !== null ? mainScore : attemptOverview;

  return {
    ...normalized,
    score: recalculatedScore, // Primary score
    // Three metrics
    mainScore,
    attemptOverview,
    overallResult,
    // Supporting data
    answeredCount,
    totalQuestionsAnswered: answeredCount,
    totalExamQuestions: totalExamQuestionsCount,
    dailyLimit,
    correctCount,
    // Cumulative data
    cumulativeCorrectAnswers: cumulativeCorrect,
    cumulativeAnsweredQuestions: cumulativeAnswered,
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

  // Get unique exam IDs to fetch question counts
  const examIds = [...new Set((data || []).map(a => a.exam_id))];
  
  // Fetch question counts for all exams in parallel
  const examQuestionCounts = {};
  if (examIds.length > 0) {
    await Promise.all(
      examIds.map(async (examId) => {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);
        // Only trust a positive count; if 0 or null, we'll fall back later to attempt data
        examQuestionCounts[examId] =
          typeof count === 'number' && count > 0 ? count : null;
      })
    );
  }

  // Group attempts by exam_id and calculate cumulative metrics
  const attemptsByExam = {};
  (data || []).forEach(attempt => {
    if (!attemptsByExam[attempt.exam_id]) {
      attemptsByExam[attempt.exam_id] = [];
    }
    attemptsByExam[attempt.exam_id].push(attempt);
  });

  // Calculate cumulative metrics for each exam
  const cumulativeMetrics = {};
  Object.keys(attemptsByExam).forEach(examId => {
    // Sort attempts by completed_at ascending to calculate cumulative
    const sortedAttempts = [...attemptsByExam[examId]].sort((a, b) => 
      new Date(a.completed_at) - new Date(b.completed_at)
    );
    
    let cumulativeCorrect = 0;
    let cumulativeAnswered = 0;
    
    sortedAttempts.forEach(attempt => {
      const correct = typeof attempt.correct_answers === 'number' 
        ? attempt.correct_answers 
        : Number(attempt.correct_answers) || 0;
      const answered = attempt.answers
        ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
        : (typeof attempt.total_questions === 'number' ? attempt.total_questions : Number(attempt.total_questions) || 0);
      
      cumulativeCorrect += correct;
      cumulativeAnswered += answered;
      
      if (!cumulativeMetrics[attempt.id]) {
        cumulativeMetrics[attempt.id] = {};
      }
      cumulativeMetrics[attempt.id] = {
        cumulativeCorrectAnswers: cumulativeCorrect,
        cumulativeAnsweredQuestions: cumulativeAnswered,
      };
    });
  });

  return (data || []).map((attempt) => 
    normalizeAttempt(
      attempt, 
      dailyLimit, 
      examQuestionCounts[attempt.exam_id],
      cumulativeMetrics[attempt.id]?.cumulativeCorrectAnswers,
      cumulativeMetrics[attempt.id]?.cumulativeAnsweredQuestions
    )
  );
};

// Fetch a single attempt and build per-question review data (answered MCQs)
export const getAttemptReview = async (userId, attemptId) => {
  if (!userId || !attemptId) {
    throw new Error('Missing user or attempt id');
  }

  const normalizeId = (id) => {
    if (!id) return '';
    let str = id;
    if (typeof str !== 'string') str = String(str);
    return str.trim().toLowerCase();
  };

  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exam:exams(title, exam_type, duration)
    `)
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single();

  if (attemptError) throw attemptError;
  if (!attempt) throw new Error('Attempt not found');

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, correct_answer, explanation')
    .eq('exam_id', attempt.exam_id);

  if (questionsError) throw questionsError;

  const answers = attempt.answers && typeof attempt.answers === 'object' ? attempt.answers : {};
  const normalizedAnswers = {};
  Object.keys(answers).forEach((k) => {
    const nk = normalizeId(k);
    if (nk) normalizedAnswers[nk] = answers[k];
  });

  const results = (questions || []).map((q) => {
    const userAnswer = normalizedAnswers[normalizeId(q.id)];
    return {
      questionId: q.id,
      question: q.question,
      userAnswer: userAnswer ?? null,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      isCorrect: userAnswer === q.correct_answer,
    };
  });

  // Keep review focused on questions the user actually answered in this attempt.
  const answeredResults = results.filter((r) => r.userAnswer !== null && r.userAnswer !== undefined);

  // Reuse the same normalization logic as lists (dailyLimit/overall totals will be calculated by caller in UI as needed).
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit')
    .eq('id', userId)
    .maybeSingle();

  const dailyLimit = profile?.daily_mcq_limit ?? null;

  // total questions in exam (for overallResult) - prefer DB count
  const { count: totalExamQuestionsInDB } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', attempt.exam_id);

  const totalExamQuestions =
    typeof totalExamQuestionsInDB === 'number' && totalExamQuestionsInDB > 0
      ? totalExamQuestionsInDB
      : null;

  return {
    attempt: normalizeAttempt(attempt, dailyLimit, totalExamQuestions),
    results: answeredResults,
  };
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

  // Get unique exam IDs to fetch question counts
  const examIds = [...new Set((attempts || []).map(a => a.exam_id))];
  
  // Fetch question counts for all exams in parallel
  const examQuestionCounts = {};
  if (examIds.length > 0) {
    await Promise.all(
      examIds.map(async (examId) => {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);
        // Only trust a positive count; if 0 or null, we'll fall back later to attempt data
        examQuestionCounts[examId] =
          typeof count === 'number' && count > 0 ? count : null;
      })
    );
  }

  // For each exam, get all attempts to calculate cumulative metrics
  const cumulativeMetrics = {};
  for (const examId of examIds) {
    const { data: allExamAttempts } = await supabase
      .from('exam_attempts')
      .select('id, correct_answers, total_questions, answers, completed_at')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .order('completed_at', { ascending: true });
    
    if (allExamAttempts && allExamAttempts.length > 0) {
      let cumulativeCorrect = 0;
      let cumulativeAnswered = 0;
      
      allExamAttempts.forEach(attempt => {
        const correct = typeof attempt.correct_answers === 'number' 
          ? attempt.correct_answers 
          : Number(attempt.correct_answers) || 0;
        const answered = attempt.answers
          ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
          : (typeof attempt.total_questions === 'number' ? attempt.total_questions : Number(attempt.total_questions) || 0);
        
        cumulativeCorrect += correct;
        cumulativeAnswered += answered;
        
        cumulativeMetrics[attempt.id] = {
          cumulativeCorrectAnswers: cumulativeCorrect,
          cumulativeAnsweredQuestions: cumulativeAnswered,
        };
      });
    }
  }

  return {
    user: {
      ...profile,
      profession: profile.profession,
      healthAuthority: profile.health_authority,
      dailyMcqLimit: profile.daily_mcq_limit,
      fullName: profile.full_name,
    },
    recentAttempts: (attempts || []).map((attempt) => 
      normalizeAttempt(
        attempt, 
        profile.daily_mcq_limit, 
        examQuestionCounts[attempt.exam_id],
        cumulativeMetrics[attempt.id]?.cumulativeCorrectAnswers,
        cumulativeMetrics[attempt.id]?.cumulativeAnsweredQuestions
      )
    ),
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

    // Get unique exam IDs to fetch question counts
    const adminExamIds = [...new Set((recentAttempts || []).map(a => a.exam_id))];
    
    // Fetch question counts for all exams in parallel
    const adminExamQuestionCounts = {};
    if (adminExamIds.length > 0) {
      await Promise.all(
        adminExamIds.map(async (examId) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', examId);
          adminExamQuestionCounts[examId] = count ?? 0;
        })
      );
    }

    // Calculate cumulative metrics for each user-exam combination
    const adminCumulativeMetrics = {};
    for (const attempt of recentAttempts || []) {
      const key = `${attempt.user_id}_${attempt.exam_id}`;
      if (!adminCumulativeMetrics[key]) {
        // Get all attempts for this user-exam combination
        const { data: allUserExamAttempts } = await supabase
          .from('exam_attempts')
          .select('id, correct_answers, total_questions, answers, completed_at')
          .eq('user_id', attempt.user_id)
          .eq('exam_id', attempt.exam_id)
          .order('completed_at', { ascending: true });
        
        if (allUserExamAttempts && allUserExamAttempts.length > 0) {
          let cumulativeCorrect = 0;
          let cumulativeAnswered = 0;
          
          allUserExamAttempts.forEach(userAttempt => {
            const correct = typeof userAttempt.correct_answers === 'number' 
              ? userAttempt.correct_answers 
              : Number(userAttempt.correct_answers) || 0;
            const answered = userAttempt.answers
              ? Object.values(userAttempt.answers).filter((val) => val !== null && val !== undefined).length
              : (typeof userAttempt.total_questions === 'number' ? userAttempt.total_questions : Number(userAttempt.total_questions) || 0);
            
            cumulativeCorrect += correct;
            cumulativeAnswered += answered;
            
            adminCumulativeMetrics[`${attempt.user_id}_${attempt.exam_id}_${userAttempt.id}`] = {
              cumulativeCorrectAnswers: cumulativeCorrect,
              cumulativeAnsweredQuestions: cumulativeAnswered,
            };
          });
        }
      }
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
        const dailyLimit = attempt.user?.daily_mcq_limit ?? null;
        const totalExamQuestions = adminExamQuestionCounts[attempt.exam_id] ?? attempt.total_questions;
        const key = `${attempt.user_id}_${attempt.exam_id}_${attempt.id}`;
        
        return normalizeAttempt(
          attempt, 
          dailyLimit, 
          totalExamQuestions,
          adminCumulativeMetrics[key]?.cumulativeCorrectAnswers,
          adminCumulativeMetrics[key]?.cumulativeAnsweredQuestions
        );
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
