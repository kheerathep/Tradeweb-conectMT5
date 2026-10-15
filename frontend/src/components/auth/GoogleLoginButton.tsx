import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  mode?: 'signin' | 'signup';
  onError?: (error: string) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ mode = 'signin', onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [missingConfig, setMissingConfig] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setMissingConfig(true);
      return;
    }

    let isMounted = true;

    const handleCredentialResponse = async (response: { credential: string }) => {
      try {
        setLoading(true);
        await loginWithGoogle(response.credential);
        if (isMounted) {
          navigate('/');
        }
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        const msg = errorObj?.message || 'Google authentication failed. Please try again.';
        if (onError) onError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });

          // Clear any previous rendered button
          buttonRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 380,
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
          });
        } catch (e) {
          console.error('Failed to initialize Google Sign-In:', e);
        }
      }
    };

    // If script already loaded
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      // Load Google Identity Services script dynamically
      const scriptId = 'google-gsi-client-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        document.body.appendChild(script);
      } else {
        script.addEventListener('load', initializeGoogleSignIn);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, mode, loginWithGoogle, navigate, onError]);

  const handleManualClick = () => {
    if (missingConfig) {
      if (onError) {
        onError('Google Client ID is missing. Add VITE_GOOGLE_CLIENT_ID to your frontend .env file.');
      } else {
        alert('Google Client ID is not configured yet!\nPlease add VITE_GOOGLE_CLIENT_ID to frontend/.env (or root .env). See the Google Cloud setup instructions.');
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      {missingConfig ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleManualClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-sm font-medium transition-colors shadow-sm"
          >
            <GoogleSvgIcon />
            <span>Continue with Google</span>
          </button>
          <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Setup required: Add VITE_GOOGLE_CLIENT_ID to .env</span>
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div ref={buttonRef} className="w-full min-h-[44px] flex justify-center" />
          {loading && (
            <p className="text-xs text-blue-400 mt-1 animate-pulse">Verifying with Google...</p>
          )}
        </div>
      )}
    </div>
  );
};

export const GoogleSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);
