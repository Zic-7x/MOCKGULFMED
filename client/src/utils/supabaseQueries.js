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
      throw new Error('You do not have access to this exam');
    }
  }

  // Get exam with questions (without correct answers during exam)
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions(id, question, option_a, option_b, option_c, option_d)
    `)
    .eq('id', examId)
    .eq('is_active', true)
    .single();

  if (error) throw error;

  // Check daily limit
  if (profile.daily_mcq_limit !== null) {
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('daily_mcq_usage')
      .select('mcq_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const used = usage?.mcq_count || 0;
    const remaining = profile.daily_mcq_limit - used;

    if (remaining < data.questions.length) {
      throw new Error(
        `Daily MCQ limit reached. You have ${remaining} MCQs remaining today.`
      );
    }
  }

  return {
    exam: data,
    dailyUsage: {
      mcqCount: usage?.mcq_count || 0,
      limit: profile.daily_mcq_limit,
      remaining: profile.daily_mcq_limit !== null ? profile.daily_mcq_limit - (usage?.mcq_count || 0) : null,
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

  exam.questions.forEach((question) => {
    if (answers[question.id] === question.correct_answer) {
      correctAnswers++;
    }
  });

  const score = (correctAnswers / totalQuestions) * 100;

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
    .single();

  if (existingUsage) {
    await supabase
      .from('daily_mcq_usage')
      .update({ mcq_count: existingUsage.mcq_count + totalQuestions })
      .eq('id', existingUsage.id);
  } else {
    await supabase.from('daily_mcq_usage').insert({
      user_id: userId,
      date: today,
      mcq_count: totalQuestions,
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

  return {
    attempt,
    results,
    score,
    correctAnswers,
    totalQuestions,
  };
};

export const getUserAttempts = async (userId, examId = null) => {
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
  return data;
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
    recentAttempts: attempts || [],
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
    const [usersResult, examsResult, attemptsResult, professionsResult, healthAuthoritiesResult] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('exam_attempts').select('id', { count: 'exact', head: true }),
      supabase.from('professions').select('id', { count: 'exact', head: true }),
      supabase.from('health_authorities').select('id', { count: 'exact', head: true }),
    ]);

    // Check for errors in any of the queries
    const errors = [
      usersResult.error,
      examsResult.error,
      attemptsResult.error,
      professionsResult.error,
      healthAuthoritiesResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join('; ');
      throw new Error(`Failed to load statistics: ${errorMessages}`);
    }

    return {
      totalUsers: usersResult.count || 0,
      totalExams: examsResult.count || 0,
      totalAttempts: attemptsResult.count || 0,
      totalProfessions: professionsResult.count || 0,
      totalHealthAuthorities: healthAuthoritiesResult.count || 0,
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    throw error;
  }
};
