import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

/**
 * Hook to monitor session health and handle unexpected logouts
 * Periodically checks if session is still valid
 * NOTE: Disabled session validation to prevent false "session expired" messages
 * Real session validation happens through authentication API calls
 */
export function useSessionMonitor() {
  const navigate = useNavigate();

  // Session validation disabled - auth is checked through API calls
  // and getCurrentUser endpoint already handles session validation
  
  useEffect(() => {
    // Keep hook functional but don't do active polling
    // Session is validated reactively through getCurrentUser calls
  }, [navigate]);
}

/**
 * Hook to track user activity and keep session alive
 */
export function useActivityTracker() {
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    let activityTimeout: NodeJS.Timeout;

    const handleActivity = () => {
      // Clear existing timeout
      clearTimeout(activityTimeout);

      // Send keep-alive every 6 hours of activity to prevent 7-day inactivity timeout
      activityTimeout = setTimeout(async () => {
        try {
          await fetch('/api/session/keep-alive', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Error keeping session alive:', error);
        }
      }, 6 * 60 * 60 * 1000); // 6 hours
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity
    handleActivity();

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);
}
