# Mock Gulf Med - Exam Portal

A comprehensive mock exam portal for medical professionals preparing for Prometric and Pearson exams. Built with **Supabase** (database & auth) and **React** (frontend), plus secure serverless admin APIs that deploy cleanly on **Vercel**.

## Features

### For Medical Professionals (Users)
- **Filtered Exam Access**: Users can only see and access exams assigned to their profession and health authority
- **Daily MCQ Limits**: Configurable daily MCQ restrictions (100, 300, or unlimited)
- **Exam Taking Interface**: User-friendly exam interface with timer and progress tracking
- **Results & Review**: Detailed exam results with explanations for each question
- **Dashboard**: View profile, daily usage, and recent exam attempts

### For Administrators
- **User Management**: Create and manage user accounts (admin-only registration)
- **Exam Management**: Create, edit, and manage exams with questions
- **Access Control**: Grant exam access based on profession, health authority, or specific users
- **Profession Management**: Manage medical professions (Physiotherapist, Nutritionist, Pharmacist, etc.)
- **Health Authority Management**: Manage health authorities in Middle East countries
- **Dashboard Statistics**: View system-wide statistics

## Technology Stack

- **Frontend**: React with Vite
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **Deployment**: Vercel
- **State Management**: React Query
- **Routing**: React Router
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js (v16 or higher)
- Supabase account
- Vercel account (for deployment)

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`
   - `supabase/migrations/003_seed_data.sql`

3. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy your `Project URL` and `anon/public` key

### 2. Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd MockGulfMed
```

2. Install dependencies:
```bash
cd client
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Create admin user:
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User" and create a user with email/password
   - Note the user ID
   - Go to SQL Editor and run:
   ```sql
   INSERT INTO user_profiles (id, email, full_name, role)
   VALUES ('<user-id-from-auth>', 'admin@mockgulfmed.com', 'Admin User', 'ADMIN');
   ```

6. Start development server:
```bash
npm run dev
```

### 3. Vercel Deployment

1. Push your code to GitHub

2. Import project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Configure environment variables:
   - Frontend (`client/.env` or Vercel Project):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - *(optional)* `VITE_ADMIN_USERS_API_URL` (override if the admin API lives on a different domain)
   - Serverless function (`api/admin-users.js`):
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` (Supabase service-role secret — **never** expose to the browser)

4. Configure build settings:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install && cd client && npm install`

5. Deploy!

## Project Structure

```
MockGulfMed/
├── client/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── lib/             # Supabase client
│   │   └── utils/           # Utility functions & queries
│   └── vite.config.js
├── supabase/
│   └── migrations/          # SQL migration files
├── vercel.json             # Vercel configuration
└── README.md
```

## Database Schema

### Key Tables
- **user_profiles**: User profiles (extends Supabase auth.users)
- **professions**: Medical professions
- **health_authorities**: Health authorities in Middle East
- **exams**: Mock exams (Prometric/Pearson)
- **questions**: MCQ questions for exams
- **exam_access**: Access control linking exams to professions/health authorities/users
- **exam_attempts**: User exam attempts and results
- **daily_mcq_usage**: Daily MCQ usage tracking

## Row Level Security (RLS)

All tables have RLS policies enabled:
- Users can only see their own data
- Admins can see and manage all data
- Exam access is controlled based on profession/health authority/user assignments
- Questions are hidden during exam (correct answers only shown in results)

## Access Control Logic

Users can access exams if:
1. User-specific access is granted (user_id matches)
2. Profession matches (profession_id matches)
3. Health Authority matches (health_authority_id matches)
4. Both profession and health authority match

## Daily MCQ Restrictions

- Users can have a daily MCQ limit (100, 300, etc.) or unlimited
- System tracks daily usage and prevents exam access if limit is reached
- Usage resets daily at midnight

## API Functions

- Regular data fetching/mutations still use the browser Supabase client (`client/src/utils/supabaseQueries.js`) and rely on RLS plus the signed-in session.
- Administrative actions that require Supabase service-role access (create/update/delete users) are routed through the serverless function at `api/admin-users.js`. The React admin console forwards the authenticated session token, and the function validates that the caller is an `ADMIN` before executing.

## Security Features

- Supabase Authentication (email/password)
- Row Level Security (RLS) policies
- Role-based access control (Admin/User)
- Protected routes and data access
- Input validation

## Admin User Creation

After running migrations, create your first admin:

1. Create user in Supabase Auth dashboard
2. Run this SQL (replace with actual user ID):
```sql
UPDATE user_profiles 
SET role = 'ADMIN' 
WHERE email = 'admin@mockgulfmed.com';
```

Or use the Supabase dashboard to manually update the user_profiles table.

## License

ISC

## Support

For issues or questions, please contact the development team.