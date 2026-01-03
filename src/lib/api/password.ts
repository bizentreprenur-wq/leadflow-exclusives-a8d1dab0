import { API_BASE_URL, apiRequest, USE_MOCK_AUTH } from './config';

const PASSWORD_ENDPOINTS = {
  forgotPassword: `${API_BASE_URL}/password.php?action=forgot-password`,
  resetPassword: `${API_BASE_URL}/password.php?action=reset-password`,
  verifyEmail: `${API_BASE_URL}/password.php?action=verify-email`,
  resendVerification: `${API_BASE_URL}/password.php?action=resend-verification`,
};

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link. (Demo mode - no email sent)'
    };
  }

  return apiRequest(PASSWORD_ENDPOINTS.forgotPassword, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
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

  return apiRequest(PASSWORD_ENDPOINTS.resetPassword, {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
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

  return apiRequest(`${PASSWORD_ENDPOINTS.verifyEmail}&token=${encodeURIComponent(token)}`);
}

export async function resendVerification(): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'Verification email sent! (Demo mode - no email sent)'
    };
  }

  return apiRequest(PASSWORD_ENDPOINTS.resendVerification, {
    method: 'POST',
  });
}
