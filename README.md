# FhinovaxSmartQM (FhinovaxSmartQueueManager)

FhinovaxSmartQM is a versatile, institution-agnostic digital queue management system designed to eliminate physical waiting lines and improve customer experience. Whether it's a university registrar, a corporate reception, a hospital clinic, or a government office, FSQM provides a seamless way for users to join a queue digitally and stay informed in real-time.

## Key Features

- **Digital Ticketing**: Users can join the queue from their mobile devices by scanning a QR code or visiting the web portal.
- **Real-time Tracking**: Live updates on queue position and estimated wait times.
- **Institutional Branding**: Fully customizable branding including name, logo, colors, and typography (Google Fonts).
- **Advanced Admin Dashboard**:
  - **Offices Management**: Add and configure multiple departments or service points.
  - **Live Queue Control**: Call next, serve, skip, or recall tickets with a single click.
  - **System Settings**: Super Admin control over app identity and global configurations.
- **Customizable Footer**: Dynamic 4-column footer with quick links, office lists, and contact information.
- **AI Assistant**: Built-in chatbot trained on institutional knowledge bases to answer common queries.
- **Notifications**: Automated confirmations and status updates via email or webhooks.
- **Analytics & Records**: Comprehensive history of daily queue activity and exportable CSV reports.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL Database
- Prisma CLI

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AmPhilDanny/Campus_Queue_MAnager.git
   cd Campus_Queue_MAnager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and provide your database credentials and API keys.
   ```env
   DATABASE_URL="your-postgresql-url"
   DIRECT_URL="your-direct-url"
   GOOGLE_AI_API_KEY="your-gemini-api-key"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   node prisma/seed-settings.js
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```

## Roles & Permissions

- **Super Admin**: Full control over branding, institutional settings, offices, user management, and AI training.
- **Institutional Admin**: Manage day-to-day queue operations for their assigned office (Calling/Serving tickets).

## Deployment

FSQM is designed to be easily deployed on platforms like Vercel or Netlify with a hosted PostgreSQL instance (Supabase, Neon, etc.).

---
*Powered by FhinovaxSmartQM — Making queues smart and waiting obsolete.*
