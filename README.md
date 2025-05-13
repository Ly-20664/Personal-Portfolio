# Personal Portfolio Website

A dynamic personal portfolio website featuring Spotify integration, interactive design, and a responsive layout. Built with modern web technologies to showcase my projects and skills.

## 🚀 Features

- **Real-time Spotify Integration**
  - Now Playing display
  - Recently played tracks
  - Top tracks showcase
  - Music player controls

- **Interactive Design**
  - Dark/Light theme toggle
  - Responsive layout
  - Smooth animations
  - Dynamic navigation

- **Portfolio Sections**
  - About Me
  - Experience
  - Projects
  - Contact Form

## 💻 Tech Stack

- **Frontend**
  - React.js
  - HTML5/CSS3
  - JavaScript (ES6+)
  - EmailJS

- **Backend**
  - Node.js
  - Express.js
  - Spotify Web API

- **Security**
  - Helmet
  - CORS
  - Rate Limiting
  - Environment Variables

## 🛠️ Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Ly-20664/Personal-Portfolio.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with required credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=your_redirect_uri
   EMAILJS_PUBLIC_KEY=your_emailjs_key
   EMAILJS_SERVICE_ID=your_service_id
   EMAILJS_TEMPLATE_ID=your_template_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📱 Key Features

- Responsive design for all devices
- Real-time Spotify integration
- Interactive project showcases
- Dynamic theme switching
- Contact form with EmailJS
- Smooth animations and transitions

## 🔒 Environment Variables

Required environment variables:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`

## 🚀 Deploying to Netlify

### Prerequisites
- A Netlify account
- Your project pushed to a Git repository (GitHub, GitLab, BitBucket)
- Spotify API credentials (Client ID, Client Secret, Refresh Token)

### Step 1: Configure Environment Variables
For security reasons, environment variables are not included in your Git repository. Before deploying, you must add these variables to your Netlify site:

1. Go to your Netlify dashboard
2. Navigate to **Site settings** > **Build & deploy** > **Environment**
3. Click on **Edit variables**
4. Add the following environment variables:
   - `SPOTIFY_CLIENT_ID` - Your Spotify application Client ID
   - `SPOTIFY_CLIENT_SECRET` - Your Spotify application Client Secret
   - `SPOTIFY_REFRESH_TOKEN` - Your Spotify API refresh token

### Step 2: Connect to Git Repository
1. In your Netlify dashboard, click **New site from Git**
2. Select your Git provider (GitHub, GitLab, etc.)
3. Select your repository
4. Configure build settings:
   - Build command: `npm run netlify:check && npm run build`
   - Publish directory: `dist`

### Step 3: Deploy
1. Click **Deploy site**
2. Wait for the build and deployment process to complete
3. Your site will be accessible at the provided Netlify URL

### Troubleshooting
- If you see errors related to Spotify API, verify your environment variables are correctly set in Netlify
- If you need a new refresh token, run: `node get-token.js` and follow the instructions
- Check the Netlify function logs for any errors by going to **Functions** in your site dashboard

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.