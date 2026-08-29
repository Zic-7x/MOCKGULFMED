import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getSupportTickets,
  getSupportTicketById,
  addSupportTicketMessage,
  updateSupportTicketStatus,
  getSupportOverviewStats,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_PRIORITIES,
} from '../../utils/supabaseQueries';
import './SupportManagement.css';

// SVG Icons
const Icons = {
  HelpDesk: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Crown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

const CANNED_RESPONSES = [
  {
    label: 'General Inquiry Assistance',
    text: 'Hello, thank you for reaching out to the Support Team. We have received your query and are happy to assist you. Please let us know if you need any specific guidance regarding exam preparation, dataflow verification, or platform access.',
  },
  {
    label: 'Dataflow Process Steps',
    text: 'Hello, thank you for reaching out to the Support Team. For your Dataflow Primary Source Verification, please ensure your Degree, Transcript, and Experience Letters are clearly scanned in high-resolution PDF format. Our verification team will review them within 2-3 business days. Please let us know if you have any questions.',
  },
  {
    label: 'Exam Prep & Question Guidance',
    text: 'Hello, thank you for contacting the Support Team. We have reviewed your question regarding the MCQ rationale. In medical licensing exams (Prometric/Pearson), scenario-based questions focus on the first-line management protocol. We recommend reviewing the detailed reference explanation in your results review panel.',
  },
  {
    label: 'Complaint / Escalation Handling',
    text: 'Hello, thank you for bringing this issue to our attention. We sincerely apologize for any inconvenience caused. Our senior operations desk has prioritized your ticket and is actively investigating the matter. We will update you with a resolution shortly.',
  },
  {
    label: 'Refund Request Processing',
    text: 'Hello, thank you for contacting us regarding your refund request. We have initiated the review with our billing department according to our refund policy. You will receive an email confirmation once the evaluation or transaction reversal is processed (typically 3-5 business days).',
  },
  {
    label: 'Exam Cancellation / Reschedule',
    text: 'Hello, thank you for reaching out regarding your exam schedule. We have logged your cancellation/reschedule request. Please ensure you provide your Prometric/Pearson confirmation code and preferred new date range so our support desk can assist you promptly.',
  },
  {
    label: 'Licensing & Health Authority',
    text: 'Hello, regarding your Health Authority licensing inquiry (DHA/MOH/DOH), your eligibility assessment report qualifies you for the standard licensing exam track. Once your Dataflow PSV report is issued, you can proceed with the exam booking.',
  },
  {
    label: 'Billing & Plan Upgrade',
    text: 'Hello, thank you for reaching out. We have verified your account billing. Your package access has been synchronized. You now have full access to the package features and question banks. Thank you for choosing MockGulfMed!',
  },
  {
    label: 'Issue Resolved / Closing Note',
    text: 'Hello, we are glad we could assist you with your inquiry. We have marked this query as resolved. If you need any further guidance with your exam preparation or licensing, please feel free to open a new query at any time. Best regards, Support Team.',
  },
];

export default function SupportManagement() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Workspace Modal
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [modalPriority, setModalPriority] = useState('');

  // 1. Fetch KPI Overview Stats
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['adminSupportStats'],
    queryFn: getSupportOverviewStats,
    refetchInterval: 8000,
  });

  // 2. Fetch All Support Tickets with filters
  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: [
      'adminSupportTickets',
      { statusFilter, categoryFilter, priorityFilter, slaFilter, searchQuery },
    ],
    queryFn: () =>
      getSupportTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        sla: slaFilter,
        search: searchQuery,
        adminView: true,
      }),
    refetchInterval: 6000,
  });

  // 3. Fetch Active Ticket details
  const {
    data: activeTicketData,
    isLoading: isActiveTicketLoading,
  } = useQuery({
    queryKey: ['supportTicket', selectedTicketId],
    queryFn: () => getSupportTicketById(selectedTicketId),
    enabled: !!selectedTicketId,
  });

  // Mutation: Send Admin Response (Attributed as Support Team)
  const replyMutation = useMutation({
    mutationFn: addSupportTicketMessage,
    onSuccess: () => {
      toast.success('Response delivered to applicant as "Support Team"');
      setAdminReplyText('');
      queryClient.invalidateQueries({ queryKey: ['supportTicket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportStats'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send reply');
    },
  });

  // Mutation: Update Status & Priority
  const updateStatusMutation = useMutation({
    mutationFn: updateSupportTicketStatus,
    onSuccess: () => {
      toast.success('Ticket updated successfully');
      queryClient.invalidateQueries({ queryKey: ['supportTicket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportStats'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update ticket');
    },
  });

  const handleOpenWorkspace = (ticket) => {
    setSelectedTicketId(ticket.id);
    setModalStatus(ticket.status);
    setModalPriority(ticket.priority);
  };

  const handleSendAdminReply = (e) => {
    e.preventDefault();
    if (!adminReplyText.trim()) {
      toast.error('Please write a reply');
      return;
    }
    replyMutation.mutate({
      ticketId: selectedTicketId,
      message: adminReplyText,
      statusUpdate: modalStatus || 'WAITING_ON_APPLICANT',
    });
  };

  const handleApplyStatusChange = (newStatus) => {
    setModalStatus(newStatus);
    updateStatusMutation.mutate({
      ticketId: selectedTicketId,
      status: newStatus,
      priority: modalPriority,
    });
  };

  const handleApplyPriorityChange = (newPriority) => {
    setModalPriority(newPriority);
    updateStatusMutation.mutate({
      ticketId: selectedTicketId,
      status: modalStatus,
      priority: newPriority,
    });
  };

  const getCategoryInfo = (catId) => {
    return (
      SUPPORT_TICKET_CATEGORIES.find((c) => c.id === catId) || {
        label: catId || 'General',
        shortLabel: catId || 'General',
      }
    );
  };

  const getStatusBadge = (statusKey) => {
    const st = SUPPORT_TICKET_STATUSES[statusKey] || { label: statusKey, color: 'slate' };
    const colorClass = `support-badge--${st.color}`;
    return <span className={`support-badge ${colorClass}`}>{st.label}</span>;
  };

  const getPriorityBadge = (priorityKey) => {
    const pr = SUPPORT_TICKET_PRIORITIES[priorityKey] || { label: priorityKey, color: 'slate' };
    const colorClass = `support-badge--${pr.color}`;
    return <span className={`support-badge ${colorClass}`}>{pr.label}</span>;
  };

  return (
    <Layout>
      <div className="admin-support-page">
        {/* Header */}
        <header className="admin-support-header">
          <div className="admin-support-title-group">
            <h1>Candidate Support Tickets & Query Desk</h1>
            <p>
              Review and respond to applicant questions across all task categories.
            </p>
          </div>

          <div className="admin-privacy-pill">
            <Icons.ShieldCheck />
            <span>Identity Guard Active: All replies are delivered as <strong>Support Team</strong></span>
          </div>
        </header>

        {/* KPI Overview Tiles */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap admin-kpi-icon-wrap--blue">
              <Icons.HelpDesk />
            </div>
            <div className="admin-kpi-data">
              <span className="admin-kpi-num">{statsData?.total ?? tickets.length}</span>
              <span className="admin-kpi-label">Total Queries</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap admin-kpi-icon-wrap--rose">
              <Icons.AlertTriangle />
            </div>
            <div className="admin-kpi-data">
              <span className="admin-kpi-num">{statsData?.open ?? 0}</span>
              <span className="admin-kpi-label">Open / Unassigned</span>
            </div>
          </div>

          <div className="admin-kpi-card admin-kpi-card--highlight">
            <div className="admin-kpi-icon-wrap admin-kpi-icon-wrap--emerald">
              <Icons.Crown />
            </div>
            <div className="admin-kpi-data">
              <span className="admin-kpi-num">{statsData?.priority24h ?? 0}</span>
              <span className="admin-kpi-label">⚡ 24h Priority Queue (Mastering)</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap admin-kpi-icon-wrap--amber">
              <Icons.Clock />
            </div>
            <div className="admin-kpi-data">
              <span className="admin-kpi-num">{statsData?.inProgress ?? 0}</span>
              <span className="admin-kpi-label">In Progress</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap admin-kpi-icon-wrap--purple">
              <Icons.CheckCircle />
            </div>
            <div className="admin-kpi-data">
              <span className="admin-kpi-num">{statsData?.resolved ?? 0}</span>
              <span className="admin-kpi-label">Resolved</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-support-filter-bar">
          <div className="admin-filter-controls-group">
            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Open & In Progress)</option>
              <option value="OPEN">Open / New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_APPLICANT">Waiting on Candidate</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              className="admin-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by task category"
            >
              <option value="ALL">All Task Categories</option>
              {SUPPORT_TICKET_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              className="admin-filter-select"
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              aria-label="Filter by SLA guarantee"
            >
              <option value="ALL">All SLA Tiers</option>
              <option value="24">⚡ 24h Priority (Mastering)</option>
              <option value="48">🕒 48h Standard (Basic / Acing)</option>
            </select>

            <select
              className="admin-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="ALL">All Urgency Levels</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <input
            type="search"
            className="admin-search-input"
            placeholder="Search candidate name, email, ticket #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tickets Data Table */}
        <div className="admin-table-card">
          {isTicketsLoading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                Loading support tickets...
              </p>
            </div>
          ) : ticketsError ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#e11d48' }}>
              <p>Error loading tickets: {ticketsError.message}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                No support queries found
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                There are currently no tickets matching your active filters.
              </p>
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-tickets-table">
                <thead>
                  <tr>
                    <th>Ticket / Subject</th>
                    <th>Candidate</th>
                    <th>Task Category</th>
                    <th>SLA Tier</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const catInfo = getCategoryInfo(t.category);
                    const is24h = t.sla_response_hours === 24;

                    return (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span className="support-ticket-num" style={{ alignSelf: 'flex-start' }}>
                              {t.ticket_number}
                            </span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.subject}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-candidate-cell">
                            <span className="admin-candidate-name">
                              {t.applicant?.full_name || 'Candidate'}
                            </span>
                            <span className="admin-candidate-email">
                              {t.applicant?.email || '—'}
                            </span>
                            <span className="admin-candidate-meta">
                              {t.package_tier || 'Standard Package'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="support-badge support-badge--blue">
                            {catInfo.shortLabel}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`support-sla-pill ${
                              is24h ? 'support-sla-pill--24' : 'support-sla-pill--48'
                            }`}
                          >
                            {is24h ? '⚡ 24h SLA' : '🕒 48h SLA'}
                          </span>
                        </td>
                        <td>{getPriorityBadge(t.priority)}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            <div>{new Date(t.last_message_at).toLocaleDateString()}</div>
                            <div
                              style={{
                                color: t.last_responder_role === 'ADMIN' ? '#0284c7' : '#e11d48',
                                fontWeight: 500,
                              }}
                            >
                              {t.last_responder_role === 'ADMIN'
                                ? 'Replied by Support'
                                : 'Needs Response'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-admin-action"
                            onClick={() => handleOpenWorkspace(t)}
                          >
                            Respond & Manage →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Admin Workspace & Thread Reply */}
        {selectedTicketId && (
          <div
            className="support-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTicketId(null);
            }}
          >
            <div
              className="support-modal-panel support-modal-panel--large"
              style={{ maxWidth: '960px' }}
              role="dialog"
              aria-modal="true"
            >
              {isActiveTicketLoading || !activeTicketData ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <LoadingSpinner />
                  <p style={{ marginTop: '0.75rem', color: '#64748b' }}>Loading ticket details...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="support-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="support-ticket-num">
                        {activeTicketData.ticket?.ticket_number}
                      </span>
                      <h2>{activeTicketData.ticket?.subject}</h2>
                    </div>
                    <button
                      type="button"
                      className="support-modal-close-btn"
                      onClick={() => setSelectedTicketId(null)}
                      aria-label="Close dialog"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="support-modal-body" style={{ padding: '1.25rem' }}>
                    <div className="admin-workspace-grid">
                      {/* Left: Applicant Information Sidebar */}
                      <aside className="admin-applicant-info-sidebar">
                        <h4 className="admin-info-section-title">Candidate Profile</h4>

                        <div className="admin-info-item">
                          <span className="admin-info-label">Full Name</span>
                          <span className="admin-info-value">
                            {activeTicketData.ticket?.applicant?.full_name || 'Candidate'}
                          </span>
                        </div>

                        <div className="admin-info-item">
                          <span className="admin-info-label">Email Address</span>
                          <span className="admin-info-value">
                            {activeTicketData.ticket?.applicant?.email || '—'}
                          </span>
                        </div>

                        <div className="admin-info-item">
                          <span className="admin-info-label">Profession</span>
                          <span className="admin-info-value">
                            {activeTicketData.ticket?.applicant?.profession?.name || 'General / Medical'}
                          </span>
                        </div>

                        <div className="admin-info-item">
                          <span className="admin-info-label">Health Authority</span>
                          <span className="admin-info-value">
                            {activeTicketData.ticket?.applicant?.health_authority?.name || 'DHA / Gulf Authorities'}
                          </span>
                        </div>

                        <div className="admin-info-item">
                          <span className="admin-info-label">Package Plan</span>
                          <span className="admin-info-value" style={{ color: '#0284c7' }}>
                            {activeTicketData.ticket?.package_tier || 'Standard Package'}
                          </span>
                        </div>

                        <div className="admin-info-item">
                          <span className="admin-info-label">Response SLA Window</span>
                          <span
                            className={`support-sla-pill ${
                              activeTicketData.ticket?.sla_response_hours === 24
                                ? 'support-sla-pill--24'
                                : 'support-sla-pill--48'
                            }`}
                            style={{ alignSelf: 'flex-start', marginTop: '0.2rem' }}
                          >
                            {activeTicketData.ticket?.sla_response_hours === 24
                              ? '⚡ 24h Priority (Mastering Plan)'
                              : '🕒 48h Standard (Basic / Acing)'}
                          </span>
                        </div>

                        <hr style={{ borderColor: '#e2e8f0', margin: '0.25rem 0' }} />

                        <h4 className="admin-info-section-title">Quick Controls</h4>

                        <div className="admin-info-item">
                          <label className="admin-info-label" htmlFor="ticket-status-select">
                            Update Status
                          </label>
                          <select
                            id="ticket-status-select"
                            className="admin-filter-select"
                            value={modalStatus}
                            onChange={(e) => handleApplyStatusChange(e.target.value)}
                          >
                            <option value="OPEN">Open / New</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="WAITING_ON_APPLICANT">Waiting on Candidate</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </div>

                        <div className="admin-info-item">
                          <label className="admin-info-label" htmlFor="ticket-priority-select">
                            Update Urgency
                          </label>
                          <select
                            id="ticket-priority-select"
                            className="admin-filter-select"
                            value={modalPriority}
                            onChange={(e) => handleApplyPriorityChange(e.target.value)}
                          >
                            <option value="LOW">Low</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                      </aside>

                      {/* Right: Message Stream & Reply Area */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Privacy alert reinforcing admin anonymity */}
                        <div className="admin-privacy-alert">
                          <Icons.ShieldCheck />
                          <span>
                            <strong>Admin Anonymity Guard:</strong> Your message will be sent with
                            the sender name <strong>Support Team</strong>.
                          </span>
                        </div>

                        {/* Messages Container */}
                        <div
                          className="support-messages-container"
                          style={{ maxHeight: '320px', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                        >
                          {(activeTicketData.messages || []).map((msg) => {
                            const isAdminMsg = msg.sender_role === 'ADMIN';

                            return (
                              <div
                                key={msg.id}
                                className={`support-msg ${
                                  isAdminMsg ? 'support-msg--admin' : 'support-msg--applicant'
                                }`}
                              >
                                <div className="support-msg-author-row">
                                  <span className="support-msg-author">
                                    {isAdminMsg ? (
                                      <>
                                        <Icons.ShieldCheck />
                                        <span>Support Team</span>
                                        <span className="support-official-badge">Verified</span>
                                      </>
                                    ) : (
                                      <span>
                                        {activeTicketData.ticket?.applicant?.full_name || 'Candidate'}
                                      </span>
                                    )}
                                  </span>
                                  <span className="support-msg-time">
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>

                                <div className="support-msg-body">{msg.message}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Canned Templates */}
                        <div>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#64748b',
                              display: 'block',
                              marginBottom: '0.35rem',
                            }}
                          >
                            Insert Canned Response Template:
                          </span>
                          <div className="admin-canned-templates">
                            {CANNED_RESPONSES.map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="admin-template-chip"
                                onClick={() => setAdminReplyText(tmpl.text)}
                              >
                                {tmpl.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleSendAdminReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <textarea
                            className="support-textarea"
                            placeholder="Write official reply as Support Team..."
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            rows={4}
                            required
                          />

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {activeTicketData.ticket?.status === 'RESOLVED' ? (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleApplyStatusChange('CLOSED')}
                                disabled={updateStatusMutation.isPending}
                              >
                                🔒 Close & Archive Ticket
                              </button>
                            ) : activeTicketData.ticket?.status === 'CLOSED' ? (
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                🔒 Ticket is Closed & Locked for Candidate
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleApplyStatusChange('RESOLVED')}
                                disabled={updateStatusMutation.isPending}
                              >
                                ✓ Mark Resolved & Lock for Candidate
                              </button>
                            )}

                            <button
                              type="submit"
                              className="btn-primary"
                              disabled={replyMutation.isPending || !adminReplyText.trim()}
                            >
                              <Icons.Send />
                              <span>
                                {replyMutation.isPending
                                  ? 'Sending...'
                                  : 'Send as Support Team'}
                              </span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
