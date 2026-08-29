import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceRoleKey);

// In-memory fallback cache for when database migration 041 has not yet been executed in target project
const memoryStore = {
  tickets: [],
  messages: [],
};

const send = (res, status, payload) => {
  res.status(status).json(payload);
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '').trim();
};

const readJsonBody = async (req) => {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf8'));
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'string') {
      try {
        return req.body ? JSON.parse(req.body) : {};
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'object') {
      return req.body;
    }
  }
  return new Promise((resolve, reject) => {
    if (req.readableEnded || req.complete) {
      resolve({});
      return;
    }
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve({});
      }
    });
    req.on('error', (err) => reject(err));
  });
};

/** Authenticate user and fetch their profile role */
async function authenticateUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const { data: authData, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return null;
    }

    const userId = authData.user.id;
    let profile = null;

    try {
      const { data: p } = await serviceClient
        .from('user_profiles')
        .select('id, full_name, email, role, phone, profession_id, health_authority_id')
        .eq('id', userId)
        .single();
      profile = p;
    } catch {
      // ignore
    }

    const userProfile = profile || {
      id: userId,
      role: 'USER',
      full_name: authData.user.user_metadata?.full_name || 'Applicant',
      email: authData.user.email,
    };

    const roleStr = String(
      userProfile.role ||
      authData.user.user_metadata?.role ||
      authData.user.app_metadata?.role ||
      ''
    ).toUpperCase();

    const emailStr = String(authData.user.email || '').toLowerCase();
    const isAdmin =
      roleStr === 'ADMIN' ||
      roleStr === 'SUPERADMIN' ||
      roleStr === 'STAFF' ||
      emailStr === 'howzic0@gmail.com' ||
      (process.env.ADMIN_EMAIL && emailStr === String(process.env.ADMIN_EMAIL).toLowerCase());

    return {
      user: authData.user,
      profile: userProfile,
      isAdmin,
    };
  } catch (err) {
    console.error('[support-tickets] auth error:', err);
    return null;
  }
}

/** Check user active package and determine SLA hours (24h for Mastering, 48h for Basic/Acing/other) */
async function determineUserSla(userId) {
  try {
    const { data: entitlements } = await serviceClient
      .from('user_entitlements')
      .select('id, package_id, status, ends_at, package:packages(id, name, duration_label)')
      .eq('user_id', userId)
      .eq('scope', 'PACKAGE')
      .order('created_at', { ascending: false });

    const now = new Date();
    const active = (entitlements || []).find((e) => {
      if (e.status !== 'ACTIVE') return false;
      if (e.ends_at && new Date(e.ends_at) <= now) return false;
      return true;
    });

    if (active && active.package) {
      const pkgName = String(active.package.name || '').toLowerCase();
      const durLabel = String(active.package.duration_label || '').toLowerCase();
      const isMastering =
        pkgName.includes('mastering') ||
        pkgName.includes('annual') ||
        durLabel.includes('12 month') ||
        durLabel.includes('annual');

      if (isMastering) {
        return {
          sla_response_hours: 24,
          package_tier: active.package.name || 'Mastering the Exam Annual (12 Months)',
          is_mastering: true,
        };
      }

      return {
        sla_response_hours: 48,
        package_tier: active.package.name || 'Standard Package',
        is_mastering: false,
      };
    }
  } catch (err) {
    console.error('[support-tickets] error determining SLA:', err);
  }

  return {
    sla_response_hours: 48,
    package_tier: 'Standard / Candidate',
    is_mastering: false,
  };
}

function generateTicketNumber() {
  const prefix = 'MGM';
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomDigits}`;
}

/** Safely hydrate tickets with user profile details without risky SQL joins */
async function hydrateTicketProfiles(tickets) {
  if (!tickets || !tickets.length) return [];
  const userIds = [...new Set(tickets.map((t) => t.user_id).filter(Boolean))];
  if (!userIds.length) return tickets;

  let profileMap = new Map();
  try {
    const { data: profiles } = await serviceClient
      .from('user_profiles')
      .select('id, full_name, email, phone, profession_id, health_authority_id')
      .in('id', userIds);

    if (profiles && profiles.length) {
      // Gather profession and health authority ids
      const profIds = [...new Set(profiles.map((p) => p.profession_id).filter(Boolean))];
      const haIds = [...new Set(profiles.map((p) => p.health_authority_id).filter(Boolean))];

      let profMap = new Map();
      let haMap = new Map();

      if (profIds.length) {
        try {
          const { data: profs } = await serviceClient.from('professions').select('id, name').in('id', profIds);
          (profs || []).forEach((p) => profMap.set(p.id, p));
        } catch {
          // ignore
        }
      }

      if (haIds.length) {
        try {
          const { data: has } = await serviceClient.from('health_authorities').select('id, name, country').in('id', haIds);
          (has || []).forEach((h) => haMap.set(h.id, h));
        } catch {
          // ignore
        }
      }

      profiles.forEach((p) => {
        profileMap.set(p.id, {
          id: p.id,
          full_name: p.full_name || 'Applicant',
          email: p.email,
          phone: p.phone,
          profession: profMap.get(p.profession_id) || null,
          health_authority: haMap.get(p.health_authority_id) || null,
        });
      });
    }
  } catch (err) {
    console.error('[support-tickets] error hydrating profiles:', err);
  }

  return tickets.map((t) => ({
    ...t,
    applicant: profileMap.get(t.user_id) || {
      id: t.user_id,
      full_name: 'Applicant',
      email: '',
      phone: '',
      profession: null,
      health_authority: null,
    },
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return send(res, 200, { ok: true });
  }

  const auth = await authenticateUser(req);
  if (!auth) {
    return send(res, 401, { error: 'Unauthorized. Please sign in to access support tickets.' });
  }

  const { user, profile, isAdmin } = auth;
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action') || '';
  const ticketIdParam = url.searchParams.get('ticketId') || url.pathname.split('/').pop();

  // -------------------------------------------------------------
  // GET: Fetch SLA tier info for current user
  // -------------------------------------------------------------
  if (req.method === 'GET' && action === 'sla_tier') {
    const slaInfo = await determineUserSla(user.id);
    return send(res, 200, slaInfo);
  }

  // -------------------------------------------------------------
  // GET: Stats overview (for admin or user dashboard)
  // -------------------------------------------------------------
  if (req.method === 'GET' && action === 'stats') {
    let tickets = [];
    try {
      let query = serviceClient
        .from('support_tickets')
        .select('id, status, priority, sla_response_hours, created_at, last_responder_role, user_id');

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        // Fallback to memoryStore if DB table not yet migrated
        tickets = isAdmin
          ? memoryStore.tickets
          : memoryStore.tickets.filter((t) => t.user_id === user.id);
      } else {
        tickets = data || [];
      }
    } catch {
      tickets = isAdmin
        ? memoryStore.tickets
        : memoryStore.tickets.filter((t) => t.user_id === user.id);
    }

    if (isAdmin) {
      const list = tickets;
      const total = list.length;
      const open = list.filter((t) => t.status === 'OPEN').length;
      const inProgress = list.filter((t) => t.status === 'IN_PROGRESS').length;
      const waitingOnApplicant = list.filter((t) => t.status === 'WAITING_ON_APPLICANT').length;
      const resolved = list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      const priority24h = list.filter((t) => t.sla_response_hours === 24 && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      const urgentOrHigh = list.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      const awaitingStaffReply = list.filter((t) => t.last_responder_role === 'APPLICANT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

      return send(res, 200, {
        total,
        open,
        inProgress,
        waitingOnApplicant,
        resolved,
        priority24h,
        urgentOrHigh,
        awaitingStaffReply,
      });
    } else {
      const list = tickets;
      const total = list.length;
      const active = list.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      const resolved = list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      const slaInfo = await determineUserSla(user.id);

      return send(res, 200, {
        total,
        active,
        resolved,
        slaInfo,
      });
    }
  }

  // -------------------------------------------------------------
  // GET: Single ticket with message history
  // -------------------------------------------------------------
  if (req.method === 'GET' && ticketIdParam && ticketIdParam.length >= 10) {
    let ticket = null;
    let messages = [];

    try {
      let query = serviceClient
        .from('support_tickets')
        .select('*')
        .eq('id', ticketIdParam);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data: t, error: ticketError } = await query.single();
      if (!ticketError && t) {
        ticket = t;
        const { data: msgs } = await serviceClient
          .from('support_ticket_messages')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });
        messages = msgs || [];
      }
    } catch {
      // ignore
    }

    // Fallback to memoryStore
    if (!ticket) {
      ticket = memoryStore.tickets.find(
        (t) => t.id === ticketIdParam && (isAdmin || t.user_id === user.id)
      );
      if (ticket) {
        messages = memoryStore.messages.filter((m) => m.ticket_id === ticket.id);
      }
    }

    if (!ticket) {
      return send(res, 404, { error: 'Support ticket not found.' });
    }

    // Hydrate single ticket applicant
    const [hydratedTicket] = await hydrateTicketProfiles([ticket]);

    // Sanitize messages so that ANY admin response has its sender_name strictly as 'Support Team'
    const sanitizedMessages = messages.map((m) => {
      if (m.sender_role === 'ADMIN') {
        return {
          ...m,
          sender_name: 'Support Team',
        };
      }
      return m;
    });

    return send(res, 200, {
      ticket: hydratedTicket,
      messages: sanitizedMessages,
    });
  }

  // -------------------------------------------------------------
  // GET: List tickets (supports filtering by category, status, priority, SLA)
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const statusFilter = url.searchParams.get('status');
    const categoryFilter = url.searchParams.get('category');
    const priorityFilter = url.searchParams.get('priority');
    const slaFilter = url.searchParams.get('sla');
    const searchFilter = url.searchParams.get('search');

    let tickets = [];
    let isDbSuccess = false;

    try {
      let query = serviceClient
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE') {
          query = query.in('status', ['OPEN', 'IN_PROGRESS', 'WAITING_ON_APPLICANT']);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      if (categoryFilter && categoryFilter !== 'ALL') {
        query = query.eq('category', categoryFilter);
      }

      if (priorityFilter && priorityFilter !== 'ALL') {
        query = query.eq('priority', priorityFilter);
      }

      if (slaFilter && slaFilter !== 'ALL') {
        query = query.eq('sla_response_hours', parseInt(slaFilter, 10));
      }

      const { data, error } = await query;
      if (!error && data) {
        tickets = data;
        isDbSuccess = true;
      }
    } catch (err) {
      console.warn('[support-tickets] DB query failed, using memory fallback:', err.message);
    }

    if (!isDbSuccess) {
      // Memory store fallback
      let list = memoryStore.tickets;
      if (!isAdmin) {
        list = list.filter((t) => t.user_id === user.id);
      }
      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE') {
          list = list.filter((t) => ['OPEN', 'IN_PROGRESS', 'WAITING_ON_APPLICANT'].includes(t.status));
        } else {
          list = list.filter((t) => t.status === statusFilter);
        }
      }
      if (categoryFilter && categoryFilter !== 'ALL') {
        list = list.filter((t) => t.category === categoryFilter);
      }
      if (priorityFilter && priorityFilter !== 'ALL') {
        list = list.filter((t) => t.priority === priorityFilter);
      }
      if (slaFilter && slaFilter !== 'ALL') {
        list = list.filter((t) => t.sla_response_hours === parseInt(slaFilter, 10));
      }
      tickets = list;
    }

    const hydratedTickets = await hydrateTicketProfiles(tickets);

    let results = hydratedTickets;
    if (searchFilter && searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      results = results.filter((t) => {
        const ticketNo = String(t.ticket_number || '').toLowerCase();
        const sub = String(t.subject || '').toLowerCase();
        const applicantName = String(t.applicant?.full_name || '').toLowerCase();
        const applicantEmail = String(t.applicant?.email || '').toLowerCase();
        return (
          ticketNo.includes(q) ||
          sub.includes(q) ||
          applicantName.includes(q) ||
          applicantEmail.includes(q)
        );
      });
    }

    return send(res, 200, { tickets: results });
  }

  // -------------------------------------------------------------
  // POST: Create a new support ticket query
  // -------------------------------------------------------------
  if (req.method === 'POST' && (action === 'create' || !action)) {
    const body = await readJsonBody(req);
    const { subject, category, message, priority = 'NORMAL', attachment_url, attachment_name } = body;

    if (!subject || !subject.trim()) {
      return send(res, 400, { error: 'Subject is required.' });
    }
    if (!category) {
      return send(res, 400, { error: 'Task category is required.' });
    }
    if (!message || !message.trim()) {
      return send(res, 400, { error: 'Initial message / query description is required.' });
    }

    const slaInfo = await determineUserSla(user.id);
    const ticketNumber = generateTicketNumber();
    const nowIso = new Date().toISOString();

    const newTicketData = {
      ticket_number: ticketNumber,
      user_id: user.id,
      subject: subject.trim(),
      category,
      priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority) ? priority : 'NORMAL',
      status: 'OPEN',
      sla_response_hours: slaInfo.sla_response_hours,
      package_tier: slaInfo.package_tier,
      last_responder_role: 'APPLICANT',
      last_message_at: nowIso,
    };

    let createdTicket = null;
    let initialMessage = null;

    try {
      const { data: ticket, error: ticketError } = await serviceClient
        .from('support_tickets')
        .insert(newTicketData)
        .select()
        .single();

      if (!ticketError && ticket) {
        createdTicket = ticket;
        const { data: msg } = await serviceClient
          .from('support_ticket_messages')
          .insert({
            ticket_id: ticket.id,
            sender_id: user.id,
            sender_role: 'APPLICANT',
            sender_name: profile.full_name || 'Applicant',
            message: message.trim(),
            attachment_url: attachment_url || null,
            attachment_name: attachment_name || null,
          })
          .select()
          .single();
        initialMessage = msg;
      }
    } catch (err) {
      console.warn('[support-tickets] DB insert failed, writing to fallback memory:', err.message);
    }

    if (!createdTicket) {
      const syntheticId = 'ticket_' + Math.random().toString(36).substring(2, 12);
      createdTicket = {
        id: syntheticId,
        ...newTicketData,
        created_at: nowIso,
        updated_at: nowIso,
      };
      initialMessage = {
        id: 'msg_' + Math.random().toString(36).substring(2, 12),
        ticket_id: syntheticId,
        sender_id: user.id,
        sender_role: 'APPLICANT',
        sender_name: profile.full_name || 'Applicant',
        message: message.trim(),
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        created_at: nowIso,
      };
      memoryStore.tickets.unshift(createdTicket);
      memoryStore.messages.push(initialMessage);
    }

    return send(res, 201, {
      ticket: createdTicket,
      initialMessage,
      sla_response_hours: slaInfo.sla_response_hours,
      message: `Your query ${ticketNumber} has been logged. Our Support Team will respond within ${slaInfo.sla_response_hours} hours.`,
    });
  }

  // -------------------------------------------------------------
  // POST: Add a message / reply to an existing ticket
  // -------------------------------------------------------------
  if (req.method === 'POST' && action === 'reply') {
    const body = await readJsonBody(req);
    const { ticketId, message, attachment_url, attachment_name, statusUpdate } = body;

    if (!ticketId) {
      return send(res, 400, { error: 'ticketId is required.' });
    }
    if (!message || !message.trim()) {
      return send(res, 400, { error: 'Message content cannot be empty.' });
    }

    let ticket = null;
    try {
      const { data: t } = await serviceClient
        .from('support_tickets')
        .select('id, user_id, status, ticket_number')
        .eq('id', ticketId)
        .single();
      ticket = t;
    } catch {
      // ignore
    }

    if (!ticket) {
      ticket = memoryStore.tickets.find((t) => t.id === ticketId);
    }

    if (!ticket) {
      return send(res, 404, { error: 'Support ticket not found.' });
    }

    if (!isAdmin && ticket.user_id !== user.id) {
      return send(res, 403, { error: 'Access denied.' });
    }

    // STRICT LOCK: If query is marked RESOLVED or CLOSED, lock it for the user
    if (!isAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      return send(res, 403, {
        error: 'This query has been marked as resolved or closed. The thread is locked and no further responses can be sent.',
      });
    }

    const senderRole = isAdmin ? 'ADMIN' : 'APPLICANT';
    // STRICT REQUIREMENT: Admin name is replaced with "Support Team"
    const senderName = isAdmin ? 'Support Team' : profile.full_name || 'Applicant';

    let newStatus = ticket.status;
    if (statusUpdate && ['OPEN', 'IN_PROGRESS', 'WAITING_ON_APPLICANT', 'RESOLVED', 'CLOSED'].includes(statusUpdate)) {
      newStatus = statusUpdate;
    } else if (isAdmin) {
      if (newStatus !== 'RESOLVED' && newStatus !== 'CLOSED') {
        newStatus = 'WAITING_ON_APPLICANT';
      }
    } else {
      if (newStatus === 'WAITING_ON_APPLICANT') {
        newStatus = 'IN_PROGRESS';
      }
    }

    const nowIso = new Date().toISOString();
    let newMsg = null;

    try {
      const { data: insertedMsg, error: insertError } = await serviceClient
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_role: senderRole,
          sender_name: senderName,
          message: message.trim(),
          attachment_url: attachment_url || null,
          attachment_name: attachment_name || null,
        })
        .select()
        .single();

      if (!insertError && insertedMsg) {
        newMsg = insertedMsg;
        await serviceClient
          .from('support_tickets')
          .update({
            status: newStatus,
            last_responder_role: senderRole,
            last_message_at: nowIso,
          })
          .eq('id', ticket.id);
      }
    } catch {
      // ignore
    }

    if (!newMsg) {
      newMsg = {
        id: 'msg_' + Math.random().toString(36).substring(2, 12),
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: senderRole,
        sender_name: senderName,
        message: message.trim(),
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        created_at: nowIso,
      };
      memoryStore.messages.push(newMsg);
      const memTicket = memoryStore.tickets.find((t) => t.id === ticket.id);
      if (memTicket) {
        memTicket.status = newStatus;
        memTicket.last_responder_role = senderRole;
        memTicket.last_message_at = nowIso;
      }
    }

    return send(res, 200, {
      message: newMsg,
      status: newStatus,
    });
  }

  // -------------------------------------------------------------
  // PATCH: Update ticket status or priority
  // -------------------------------------------------------------
  if (req.method === 'PATCH' || (req.method === 'POST' && action === 'update_status')) {
    const body = await readJsonBody(req);
    const { ticketId, status, priority } = body;

    if (!ticketId) {
      return send(res, 400, { error: 'ticketId is required.' });
    }

    let ticket = null;
    try {
      const { data: t } = await serviceClient
        .from('support_tickets')
        .select('id, user_id, status')
        .eq('id', ticketId)
        .single();
      ticket = t;
    } catch {
      // ignore
    }

    if (!ticket) {
      ticket = memoryStore.tickets.find((t) => t.id === ticketId);
    }

    if (!ticket) {
      return send(res, 404, { error: 'Support ticket not found.' });
    }

    if (!isAdmin && ticket.user_id !== user.id) {
      return send(res, 403, { error: 'Access denied.' });
    }

    if (!isAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      return send(res, 403, {
        error: 'This query has been resolved or closed. Its status cannot be changed by the applicant.',
      });
    }

    const updates = {};
    if (status && ['OPEN', 'IN_PROGRESS', 'WAITING_ON_APPLICANT', 'RESOLVED', 'CLOSED'].includes(status)) {
      updates.status = status;
    }
    if (isAdmin && priority && ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
      updates.priority = priority;
    }

    let updatedTicket = null;
    try {
      const { data: u, error: updateError } = await serviceClient
        .from('support_tickets')
        .update(updates)
        .eq('id', ticket.id)
        .select()
        .single();
      if (!updateError && u) {
        updatedTicket = u;
      }
    } catch {
      // ignore
    }

    if (!updatedTicket) {
      const memTicket = memoryStore.tickets.find((t) => t.id === ticket.id);
      if (memTicket) {
        Object.assign(memTicket, updates, { updated_at: new Date().toISOString() });
        updatedTicket = memTicket;
      } else {
        updatedTicket = { ...ticket, ...updates };
      }
    }

    return send(res, 200, { ticket: updatedTicket });
  }

  return send(res, 405, { error: 'Method not allowed.' });
}

