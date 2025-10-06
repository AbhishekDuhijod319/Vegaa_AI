// Authentication service for Google OAuth integration
import { toast } from 'sonner';

/**
 * Fetch Google user profile and store in localStorage
 * @param {Object} tokenInfo - Google OAuth token information
 * @param {Function} onSuccess - Callback function on successful authentication
 */
export const fetchGoogleUserProfile = async (tokenInfo, onSuccess) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokenInfo?.access_token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const user = await response.json();
    
    // Store user information in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    toast.success(`Welcome, ${user.name}!`);
    
    if (onSuccess) {
      onSuccess(user);
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching Google user profile:', error);
    toast.error('Failed to authenticate with Google. Please try again.');
    throw error;
  }
};

/**
 * Check if user is currently authenticated
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  try {
    const user = localStorage.getItem('user');
    return user !== null && user !== 'undefined';
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Get current user from localStorage
 * @returns {Object|null} - User object or null if not authenticated
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Sign out the current user
 */
export const signOut = () => {
  try {
    localStorage.removeItem('user');
    toast.success('Signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error('Error signing out');
  }
};