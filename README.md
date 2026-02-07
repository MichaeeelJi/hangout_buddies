# Hangout Buddies

Hangout Buddies is a social platform designed to help people discover local events, meet new friends, and explore shared interests in their community.

## Features

- **Event Discovery**: Browse and search for local events by category, location, time, and distance.
- **AI-Powered Search**: Use natural language to find the perfect event for your mood (e.g., "I want a relaxing outdoor activity").
- **Social Connections**: Get friend recommendations based on shared interests and event attendance.
- **Interactive Visualizations**: View event statistics with interactive charts showing category distribution and popular locations.
- **User Profiles**: Manage your profile, interests, and event history.
- **Real-time Updates**: See who's joining events and track participant counts instantly.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: OpenAI API
- **Visualization**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hangout-buddies.git
   cd hangout-buddies
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
