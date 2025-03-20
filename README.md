# Healthcare Clock App ⏰

A web application for healthcare workers to clock in and out of their shifts, with location-based verification and management features.

## Features ✨

### Manager Features
- ✅ Set location perimeter for clock-in boundaries
- ✅ View real-time table of clocked-in staff
- ✅ Track staff clock in/out history with location
- ✅ Analytics Dashboard
  - ✅ Average hours per day
  - ✅ Daily clock-in counts
  - ✅ Weekly hours per staff member

### Care Worker Features
- ✅ Location-based clock in
  - ✅ Perimeter verification
  - ✅ Optional notes
- ✅ Clock out functionality
  - ✅ Optional notes
- ✅ View personal clock history

### Authentication
- ✅ Auth0 integration
- ✅ Google login
- ✅ Email login
- ✅ Role-based access (Manager/Care Worker)

### UI/UX
- ✅ Responsive design (Mobile/Desktop)
- ✅ Clean interface using Ant Design
- ✅ Interactive maps for location
- ✅ User-friendly notifications

### Bonus Features
- ✅ Progressive Web App (PWA)
  - ✅ Installable on home screen
  - ✅ App-like experience
- ✅ Location detection
  - ✅ Perimeter entry notification
  - ✅ Perimeter exit notification

## Tech Stack 🛠

- **Frontend**: React.js with Vite
- **UI Library**: Ant Design
- **State Management**: React Context
- **Backend**: Node.js with GraphQL
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0
- **Maps**: Leaflet.js
- **Charts**: Chart.js
- **PWA**: Vite PWA plugin

## Local Setup 🚀
Frontend:
1. Clone the repository:
```bash
git clone https://github.com/yourusername/healthcare-clock-app.git
cd healthcare-clock-app
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Create `.env` file in frontend directory:
```env
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_audience
VITE_API_URL=your_backend_url/graphql
VITE_GRAPHQL_URI=your_backend_url/graphql
VITE_BACKEND_URL=your_backend_url
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend Setup
1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file in the `backend` directory**:
   ```env
   # Database Configuration
   DATABASE_URL=your_database_url

   # Auth0 API Configuration
   AUTH0_DOMAIN=your_auth0_domain
   AUTH0_AUDIENCE=your_auth0_audience

   # Application Settings
   PORT=4000
   NODE_ENV=development

   # CORS Settings
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run Prisma migrations**:
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Production Deployment 🌐

The application is deployed using Vercel:
https://health-care-app-r21c-3giu45jsp-shravan773s-projects.vercel.app/

## License 📝

MIT
