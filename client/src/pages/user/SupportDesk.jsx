import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getSupportTickets,
  getSupportTicketById,
  createSupportTicket,
  addSupportTicketMessage,
  updateSupportTicketStatus,
  getUserSupportSlaTier,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_PRIORITIES,
} from '../../utils/supabaseQueries';
import './SupportDesk.css';

// SVG Icons for clean rendering
const Icons = {
  HelpCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  PlusCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  CheckCircle2: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Crown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  FolderKanban: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v2" />
      <path d="M16 10v6" />
    </svg>
  ),
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

export default function SupportDesk() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // New ticket form state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL_QUERY');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('NORMAL');

  // Thread reply state
  const [replyMessage, setReplyMessage] = useState('');

  // 1. Fetch User SLA Tier
  const { data: slaInfo, isLoading: isSlaLoading } = useQuery({
    queryKey: ['userSupportSla', user?.id],
    queryFn: () => getUserSupportSlaTier(user?.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // 2. Fetch User Tickets
  const {
    data: allTickets = [],
    isLoading: isTicketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['supportTickets', user?.id],
    queryFn: () => getSupportTickets({}),
    enabled: !!user?.id,
    refetchInterval: 8000, // Poll every 8 seconds so new submissions and replies show up automatically
  });

  // Filter tickets in-memory for immediate, flicker-free UI updates
  const tickets = useMemo(() => {
    let list = allTickets;

    if (activeTab === 'ACTIVE') {
      list = list.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_APPLICANT'
      );
    } else if (activeTab === 'RESOLVED') {
      list = list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      list = list.filter((t) => t.category === categoryFilter);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const ticketNo = String(t.ticket_number || '').toLowerCase();
        const sub = String(t.subject || '').toLowerCase();
        return ticketNo.includes(q) || sub.includes(q);
      });
    }

    return list;
  }, [allTickets, activeTab, categoryFilter, searchQuery]);

  // 3. Fetch Selected Ticket with full conversation
  const {
    data: activeTicketData,
    isLoading: isActiveTicketLoading,
  } = useQuery({
    queryKey: ['supportTicket', selectedTicketId],
    queryFn: () => getSupportTicketById(selectedTicketId),
    enabled: !!selectedTicketId,
    refetchInterval: selectedTicketId ? 10000 : false, // Poll every 10s while viewing conversation
  });

  // Mutation: Create Ticket
  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (data) => {
      toast.success(
        data.message || `Query filed! Support Team will respond within ${slaInfo?.slaHours || 48} hours.`
      );
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      setIsNewTicketOpen(false);
      // Reset form
      setNewSubject('');
      setNewCategory('GENERAL_QUERY');
      setNewMessage('');
      setNewPriority('NORMAL');
      if (data.ticket?.id) {
        setSelectedTicketId(data.ticket.id);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit query');
    },
  });

  // Mutation: Add Reply
  const replyMutation = useMutation({
    mutationFn: addSupportTicketMessage,
    onSuccess: () => {
      toast.success('Reply sent to Support Team');
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['supportTicket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send reply');
    },
  });

  // Mutation: Update Status / Resolve
  const statusMutation = useMutation({
    mutationFn: updateSupportTicketStatus,
    onSuccess: (_, variables) => {
      const isResolved = variables.status === 'RESOLVED';
      toast.success(isResolved ? 'Query marked as resolved' : 'Status updated');
      queryClient.invalidateQueries({ queryKey: ['supportTicket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update query status');
    },
  });

  // Stats calculation
  const stats = useMemo(() => {
    const total = allTickets.length;
    const active = allTickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_APPLICANT'
    ).length;
    const resolved = allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    return { total, active, resolved };
  }, [allTickets]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!newMessage.trim()) {
      toast.error('Please enter your query description');
      return;
    }
    createMutation.mutate({
      subject: newSubject,
      category: newCategory,
      message: newMessage,
      priority: newPriority,
    });
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    const currentStatus = activeTicketData?.ticket?.status;
    if (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED') {
      toast.error('This query has been resolved/closed and is locked. No further responses can be sent.');
      return;
    }
    replyMutation.mutate({
      ticketId: selectedTicketId,
      message: replyMessage,
    });
  };

  const handleMarkResolved = () => {
    if (!selectedTicketId) return;
    statusMutation.mutate({
      ticketId: selectedTicketId,
      status: 'RESOLVED',
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

  return (
    <Layout>
      <div className="support-desk">
        {/* Page Header */}
        <header className="support-header">
          <div className="support-header-title-group">
            <h1>Candidate Support & Help Desk</h1>
            <p>
              Submit questions regarding exam practice, Dataflow verification, licensing, and
              account assistance to our expert Support Team.
            </p>
          </div>
          <div className="support-header-actions">
            <button
              type="button"
              className="btn-new-ticket"
              onClick={() => setIsNewTicketOpen(true)}
            >
              <Icons.PlusCircle />
              <span>File a Query</span>
            </button>
          </div>
        </header>

        {/* SLA Notice Banner */}
        <section
          className={`support-sla-banner ${
            slaInfo?.isMastering
              ? 'support-sla-banner--mastering'
              : 'support-sla-banner--standard'
          }`}
        >
          <div className="support-sla-content">
            <div className="support-sla-icon">
              {slaInfo?.isMastering ? '👑' : '🕒'}
            </div>
            <div className="support-sla-text">
              <h4>
                {slaInfo?.isMastering
                  ? 'Expedited Priority Response Guaranteed (Mastering the Exam Plan)'
                  : 'Official Support Response Window (Basic / Acing the Exam Plans)'}
              </h4>
              <p>
                {slaInfo?.isMastering ? (
                  <>
                    As a <strong>Mastering the Exam (Annual)</strong> subscriber, our Support
                    Team will review and respond to your queries within <strong>24 hours</strong>.
                  </>
                ) : (
                  <>
                    Our Support Team will review and respond to your queries within{' '}
                    <strong>48 hours</strong>. <em>(Tip: Subscribers with the Mastering the Exam Annual package receive expedited 24-hour response priority.)</em>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="support-sla-badge">
            {slaInfo?.isMastering ? '⚡ 24-Hour SLA' : '🕒 48-Hour SLA'}
          </div>
        </section>

        {/* Quick Stats Grid */}
        <div className="support-stats-grid">
          <div className="support-stat-card">
            <div className="support-stat-icon-wrap support-stat-icon-wrap--blue">
              <Icons.HelpCircle />
            </div>
            <div className="support-stat-data">
              <span className="support-stat-num">{stats.total}</span>
              <span className="support-stat-label">Total Queries Filed</span>
            </div>
          </div>

          <div className="support-stat-card">
            <div className="support-stat-icon-wrap support-stat-icon-wrap--amber">
              <Icons.Clock />
            </div>
            <div className="support-stat-data">
              <span className="support-stat-num">{stats.active}</span>
              <span className="support-stat-label">In Progress / Active</span>
            </div>
          </div>

          <div className="support-stat-card">
            <div className="support-stat-icon-wrap support-stat-icon-wrap--emerald">
              <Icons.CheckCircle2 />
            </div>
            <div className="support-stat-data">
              <span className="support-stat-num">{stats.resolved}</span>
              <span className="support-stat-label">Resolved Issues</span>
            </div>
          </div>

          <div className="support-stat-card">
            <div className="support-stat-icon-wrap support-stat-icon-wrap--purple">
              {slaInfo?.isMastering ? <Icons.Crown /> : <Icons.Shield />}
            </div>
            <div className="support-stat-data">
              <span className="support-stat-num">{slaInfo?.slaHours || 48}h</span>
              <span className="support-stat-label">Your Response Guarantee</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="support-toolbar">
          <div className="support-filter-tabs">
            <button
              type="button"
              className={`support-tab-btn ${activeTab === 'ALL' ? 'support-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Queries
            </button>
            <button
              type="button"
              className={`support-tab-btn ${
                activeTab === 'ACTIVE' ? 'support-tab-btn--active' : ''
              }`}
              onClick={() => setActiveTab('ACTIVE')}
            >
              Active ({stats.active})
            </button>
            <button
              type="button"
              className={`support-tab-btn ${
                activeTab === 'RESOLVED' ? 'support-tab-btn--active' : ''
              }`}
              onClick={() => setActiveTab('RESOLVED')}
            >
              Resolved ({stats.resolved})
            </button>
          </div>

          <div className="support-filter-selects">
            <select
              className="support-select"
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

            <input
              type="search"
              className="support-search-input"
              placeholder="Search by ticket # or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tickets List View */}
        {isTicketsLoading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
              Loading your support queries...
            </p>
          </div>
        ) : ticketsError ? (
          <div className="support-empty-state">
            <div className="support-empty-icon">⚠️</div>
            <h3>Unable to load support queries</h3>
            <p>{ticketsError.message || 'Please refresh or verify your connection.'}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="support-empty-state">
            <div className="support-empty-icon">📂</div>
            <h3>No support queries found</h3>
            <p>
              {searchQuery || categoryFilter !== 'ALL' || activeTab !== 'ALL'
                ? 'Try clearing your search or category filters to see past queries.'
                : 'Have a question about your exam preparation, Dataflow verification, or package? Submit a query and our Support Team will assist you.'}
            </p>
            <button
              type="button"
              className="btn-new-ticket"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setIsNewTicketOpen(true)}
            >
              <Icons.PlusCircle />
              <span>Submit First Query</span>
            </button>
          </div>
        ) : (
          <div className="support-ticket-list">
            {tickets.map((ticket) => {
              const catInfo = getCategoryInfo(ticket.category);
              const is24h = ticket.sla_response_hours === 24;

              return (
                <article
                  key={ticket.id}
                  className="support-ticket-card"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTicketId(ticket.id);
                    }
                  }}
                >
                  <div className="support-ticket-card-header">
                    <div className="support-ticket-card-title-wrap">
                      <span className="support-ticket-num">{ticket.ticket_number}</span>
                      <h3 className="support-ticket-subject">{ticket.subject}</h3>
                    </div>

                    <div className="support-ticket-badges">
                      <span
                        className={`support-sla-pill ${
                          is24h ? 'support-sla-pill--24' : 'support-sla-pill--48'
                        }`}
                      >
                        {is24h ? '⚡ 24h SLA' : '🕒 48h SLA'}
                      </span>
                      <span className="support-badge support-badge--blue">
                        {catInfo.shortLabel}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <div className="support-ticket-card-footer">
                    <span>
                      Created {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                      <span className="support-ticket-responder" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <Icons.Lock /> {ticket.status === 'RESOLVED' ? 'Resolved & Locked' : 'Closed & Locked'}
                      </span>
                    ) : (
                      <span
                        className={`support-ticket-responder ${
                          ticket.last_responder_role === 'ADMIN'
                            ? 'support-ticket-responder--support'
                            : 'support-ticket-responder--applicant'
                        }`}
                      >
                        {ticket.last_responder_role === 'ADMIN' ? (
                          <>
                            <Icons.Shield /> Last reply by <strong>Support Team</strong>
                          </>
                        ) : (
                          'Awaiting Support Team review'
                        )}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal: File a New Query */}
        {isNewTicketOpen && (
          <div
            className="support-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsNewTicketOpen(false);
            }}
          >
            <div className="support-modal-panel support-modal-panel--large" role="dialog" aria-modal="true">
              <div className="support-modal-header">
                <h2>File a Candidate Query</h2>
                <button
                  type="button"
                  className="support-modal-close-btn"
                  onClick={() => setIsNewTicketOpen(false)}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <form className="support-modal-form" onSubmit={handleCreateSubmit}>
                <div className="support-modal-body">
                  {/* SLA banner in form */}
                  <div
                    className={`support-sla-banner ${
                      slaInfo?.isMastering
                        ? 'support-sla-banner--mastering'
                        : 'support-sla-banner--standard'
                    }`}
                    style={{ margin: 0 }}
                  >
                    <div className="support-sla-content">
                      <div className="support-sla-icon">
                        {slaInfo?.isMastering ? '👑' : '🕒'}
                      </div>
                      <div className="support-sla-text">
                        <h4>
                          {slaInfo?.isMastering
                            ? 'Priority SLA (24-Hour Response Guarantee)'
                            : 'Standard SLA (48-Hour Response Window)'}
                        </h4>
                        <p>
                          {slaInfo?.isMastering
                            ? 'Your Mastering package entitles you to priority queue routing with guaranteed response within 24 hours.'
                            : 'You will receive a response from our Support Team within 48 hours.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Task Category Selection */}
                  <div className="support-form-group">
                    <label className="support-form-label">
                      Select Task Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="category-picker-grid">
                      {SUPPORT_TICKET_CATEGORIES.map((cat) => {
                        const isSelected = newCategory === cat.id;
                        return (
                          <div
                            key={cat.id}
                            className={`category-picker-item ${
                              isSelected ? 'category-picker-item--active' : ''
                            }`}
                            onClick={() => setNewCategory(cat.id)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                          >
                            <span className="category-picker-label">
                              {cat.label}
                            </span>
                            <span className="category-picker-desc">{cat.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div className="support-form-group">
                    <label className="support-form-label" htmlFor="ticket-subject">
                      Subject / Short Summary <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="ticket-subject"
                      type="text"
                      className="support-input"
                      placeholder="e.g. Need clarification on Cardiology MCQ #142 / Dataflow document status"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>

                  {/* Priority selector */}
                  <div className="support-form-group">
                    <label className="support-form-label" htmlFor="ticket-priority">
                      Urgency Level
                    </label>
                    <select
                      id="ticket-priority"
                      className="support-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="LOW">Low - General inquiry / Non-urgent</option>
                      <option value="NORMAL">Normal - Standard question</option>
                      <option value="HIGH">High - Exam scheduled soon</option>
                      <option value="URGENT">Urgent - Immediate blocker</option>
                    </select>
                  </div>

                  {/* Message Detail Textarea */}
                  <div className="support-form-group">
                    <label className="support-form-label" htmlFor="ticket-msg">
                      Describe Your Question or Issue in Detail{' '}
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      id="ticket-msg"
                      className="support-textarea"
                      placeholder="Provide all relevant details (e.g. exam name, question ID, document type, health authority) to help our Support Team resolve your query quickly..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                </div>

                <div className="support-modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsNewTicketOpen(false)}
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Query'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Ticket Conversation Thread */}
        {selectedTicketId && (
          <div
            className="support-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTicketId(null);
            }}
          >
            <div
              className="support-modal-panel support-modal-panel--large"
              role="dialog"
              aria-modal="true"
            >
              {isActiveTicketLoading || !activeTicketData ? (
                <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                  <LoadingSpinner />
                  <p style={{ marginTop: '0.75rem', color: '#64748b' }}>
                    Loading conversation thread...
                  </p>
                </div>
              ) : (
                <>
                  <div className="support-modal-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="support-ticket-num">
                          {activeTicketData.ticket?.ticket_number}
                        </span>
                        <h2>{activeTicketData.ticket?.subject}</h2>
                      </div>
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

                  {/* Thread Meta & SLA Banner */}
                  <div className="support-thread-header-meta">
                    <div className="support-thread-meta-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="support-badge support-badge--blue">
                          {getCategoryInfo(activeTicketData.ticket?.category).label}
                        </span>
                        {getStatusBadge(activeTicketData.ticket?.status)}
                        <span
                          className={`support-sla-pill ${
                            activeTicketData.ticket?.sla_response_hours === 24
                              ? 'support-sla-pill--24'
                              : 'support-sla-pill--48'
                          }`}
                        >
                          {activeTicketData.ticket?.sla_response_hours === 24
                            ? '⚡ 24h SLA'
                            : '🕒 48h SLA'}
                        </span>
                      </div>

                      {activeTicketData.ticket?.status !== 'RESOLVED' &&
                        activeTicketData.ticket?.status !== 'CLOSED' ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                            onClick={handleMarkResolved}
                            disabled={statusMutation.isPending}
                          >
                            ✓ Mark as Resolved
                          </button>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              background: '#ecfdf5',
                              color: '#065f46',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            <Icons.Lock /> Thread Locked
                          </span>
                        )}
                    </div>

                    <div className="support-thread-sla-notice">
                      <span>
                        🛡️ Responses from our <strong>Support Team</strong> are guaranteed within{' '}
                        <strong>{activeTicketData.ticket?.sla_response_hours || 48} hours</strong>.
                      </span>
                    </div>
                  </div>

                  {/* Messages Bubble Stream */}
                  <div className="support-messages-container">
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
                                  <Icons.Shield />
                                  <span>Support Team</span>
                                  <span className="support-official-badge">Verified Support</span>
                                </>
                              ) : (
                                <span>You ({user?.fullName || 'Candidate'})</span>
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

                  {/* Reply Input Form or Locked Message Banner */}
                  {activeTicketData.ticket?.status !== 'RESOLVED' &&
                  activeTicketData.ticket?.status !== 'CLOSED' ? (
                    <form onSubmit={handleReplySubmit} className="support-thread-reply-area">
                      <textarea
                        className="support-textarea"
                        placeholder="Write your reply or additional questions for the Support Team..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        required
                      />

                      <div className="support-thread-reply-controls">
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Our Support Team will be notified instantly of your reply.
                        </span>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={replyMutation.isPending || !replyMessage.trim()}
                        >
                          <Icons.Send />
                          <span>{replyMutation.isPending ? 'Sending...' : 'Send Reply'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      style={{
                        padding: '1.25rem 1.5rem',
                        textAlign: 'center',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        color: '#475569',
                        fontSize: '0.875rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        <Icons.Lock />
                        <span>
                          Query {activeTicketData.ticket?.status === 'RESOLVED' ? 'Resolved' : 'Closed'} & Locked
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem', maxWidth: '520px' }}>
                        This query has been marked as{' '}
                        <strong>
                          {activeTicketData.ticket?.status === 'RESOLVED' ? 'Resolved' : 'Closed'}
                        </strong>{' '}
                        and is locked. No further responses can be submitted. If you need assistance with a new topic or question, please submit a new query.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
