import { API_BASE_URL, apiRequest, USE_MOCK_AUTH } from './config';

const PASSWORD_ENDPOINTS = {
  forgotPasswordAuth: `${API_BASE_URL}/auth.php?action=forgot-password`,
  resetPasswordAuth: `${API_BASE_URL}/auth.php?action=reset-password`,
  base: `${API_BASE_URL}/password.php`,
  forgotPassword: `${API_BASE_URL}/password.php?action=forgot-password`,
  resetPassword: `${API_BASE_URL}/password.php?action=reset-password`,
  verifyEmail: `${API_BASE_URL}/password.php?action=verify-email`,
  resendVerification: `${API_BASE_URL}/password.php?action=resend-verification`,
};

function shouldFallbackToBodyAction(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('not valid json') ||
    msg.includes('method not allowed') ||
    msg.includes('405') ||
    msg.includes('403') ||
    msg.includes('invalid action')
  );
}

async function requestWithBodyAction<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  return apiRequest<T>(PASSWORD_ENDPOINTS.base, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload }),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link. (Demo mode - no email sent)'
    };
  }

  try {
    return await apiRequest<{ success: boolean; message: string }>(PASSWORD_ENDPOINTS.forgotPasswordAuth, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    if (!shouldFallbackToBodyAction(error)) {
      throw error;
    }
    return requestWithBodyAction<{ success: boolean; message: string }>('forgot-password', { email });
  }
}

export async function resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (!token || token.length < 10) {
      throw new Error('Invalid or expired reset link');
    }
    return {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.'
    };
  }

  try {
    return await apiRequest<{ success: boolean; message: string }>(PASSWORD_ENDPOINTS.resetPasswordAuth, {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  } catch (error) {
    if (!shouldFallbackToBodyAction(error)) {
      throw error;
    }
    return requestWithBodyAction<{ success: boolean; message: string }>('reset-password', { token, password });
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (!token || token.length < 10) {
      throw new Error('Invalid or expired verification link');
    }
    return {
      success: true,
      message: 'Email verified successfully!'
    };
  }

  try {
    return await requestWithBodyAction<{ success: boolean; message: string }>('verify-email', { token });
  } catch (error) {
    if (!shouldFallbackToBodyAction(error)) {
      throw error;
    }
    return apiRequest(`${PASSWORD_ENDPOINTS.verifyEmail}&token=${encodeURIComponent(token)}`);
  }
}

export async function resendVerification(): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'Verification email sent! (Demo mode - no email sent)'
    };
  }

  try {
    return await requestWithBodyAction<{ success: boolean; message: string }>('resend-verification');
  } catch (error) {
    if (!shouldFallbackToBodyAction(error)) {
      throw error;
    }
    return apiRequest(PASSWORD_ENDPOINTS.resendVerification, {
      method: 'POST',
    });
  }
}
