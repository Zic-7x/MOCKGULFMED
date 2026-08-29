-- Support Ticketing & Candidate Query System
-- Divides queries into task categories, tracks SLA response times (24h for Mastering, 48h for Basic/Acing)
-- and ensures Admin identity is masked as "Support Team".

-- 1) Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(32) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_ON_APPLICANT', 'RESOLVED', 'CLOSED')),
  sla_response_hours INTEGER NOT NULL DEFAULT 48
    CHECK (sla_response_hours IN (24, 48)),
  package_tier VARCHAR(128),
  last_responder_role VARCHAR(20) NOT NULL DEFAULT 'APPLICANT'
    CHECK (last_responder_role IN ('APPLICANT', 'ADMIN', 'SYSTEM')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON support_tickets(sla_response_hours);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_msg ON support_tickets(last_message_at DESC);

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2) Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL DEFAULT 'APPLICANT'
    CHECK (sender_role IN ('APPLICANT', 'ADMIN', 'SYSTEM')),
  sender_name VARCHAR(128) NOT NULL DEFAULT 'Support Team',
  message TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON support_ticket_messages(created_at ASC);

-- 3) Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies for support_tickets
DROP POLICY IF EXISTS "Users can insert own support tickets" ON support_tickets;
CREATE POLICY "Users can insert own support tickets"
  ON support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select own support tickets" ON support_tickets;
CREATE POLICY "Users can select own support tickets"
  ON support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own support tickets" ON support_tickets;
CREATE POLICY "Users can update own support tickets"
  ON support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can select all support tickets" ON support_tickets;
CREATE POLICY "Admins can select all support tickets"
  ON support_tickets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can update all support tickets" ON support_tickets;
CREATE POLICY "Admins can update all support tickets"
  ON support_tickets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can delete support tickets" ON support_tickets;
CREATE POLICY "Admins can delete support tickets"
  ON support_tickets FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );

-- 5) RLS Policies for support_ticket_messages
DROP POLICY IF EXISTS "Users can select messages for own tickets" ON support_ticket_messages;
CREATE POLICY "Users can select messages for own tickets"
  ON support_ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages on own tickets" ON support_ticket_messages;
CREATE POLICY "Users can insert messages on own tickets"
  ON support_ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can select all ticket messages" ON support_ticket_messages;
CREATE POLICY "Admins can select all ticket messages"
  ON support_ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can insert ticket messages" ON support_ticket_messages;
CREATE POLICY "Admins can insert ticket messages"
  ON support_ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );
