# Netlify Deployment Guide

This guide helps you deploy your Spotify-integrated personal website on Netlify correctly, addressing the "Unexpected token '<', 'Relay'" error you're facing.

## What Was Fixed

1. **Enhanced Error Handling**:
   - Added better error detection and reporting in `App.jsx`
   - Improved the JSON parsing logic to catch malformed responses
   - Added detailed error messages for Netlify-specific issues

2. **Improved Serverless Functions**:
   - Added environment variable validation in all functions
   - Enhanced error responses with more details
   - Added console logs for better debugging

3. **Deployment Preparation**:
   - Added scripts to verify all requirements are met before deployment
   - Created checks for required environment variables
   - Ensured all required redirects are configured

## Deployment Steps

1. **Before Deploying**:
   Run the Netlify check script to ensure everything is properly configured:
   ```
   npm run netlify:check
   ```

2. **Prepare Your Build**:
   Run the Netlify build preparation script:
   ```
   npm run netlify:build
   ```

3. **Deploy to Netlify**:
   Choose one of these options:

   **Option 1: Using Netlify CLI**:
   ```
   npm install -g netlify-cli
   netlify login
   netlify link
   netlify deploy --prod
   ```

   **Option 2: Using Netlify Web Interface**:
   - Go to [Netlify](https://app.netlify.com/)
   - Connect your GitHub/GitLab repository or upload your `dist` folder

4. **Set Environment Variables**:
   After deploying, set these environment variables in the Netlify dashboard:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`

   Go to: Site settings > Build & deploy > Environment > Environment variables

## Testing Your Deployment

After deployment, check the browser console for any errors. If you see the "Unexpected token '<', 'Relay'" error:

1. Verify that environment variables are correctly set
2. Check the Netlify function logs in the Netlify dashboard
3. Try redeploying with a fresh build

## Local Testing

To test the Netlify functions locally before deploying:
```
npm run netlify:test-functions
```

Then visit http://localhost:3001/.netlify/functions/now-playing in your browser.

## Common Issues

1. **HTML Instead of JSON**: This happens when Netlify returns an error page instead of your function's response. Check your function logs.

2. **Environment Variables**: Make sure they are set correctly in the Netlify dashboard.

3. **Function Permissions**: Ensure your functions have the correct permissions.

4. **Netlify Function Limits**: Be aware of Netlify's function limits and timeouts.

## Debugging

If problems persist, check these resources:
- Netlify function logs in the Netlify dashboard
- Browser console errors
- Network requests in browser developer tools
