import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

     const role = data.user.roles?.[0];
	if (role === 'ADMIN') navigate('/admin/dashboard');
	else if (role === 'DENTIST') navigate('/dentist/dashboard');
	else if (role === 'PATIENT') navigate('/portal/dashboard');
	else if (role === 'RECEPTIONIST') navigate('/receptionist/dashboard');
	else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetPhone('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setResetMessage('');
    setResetError('');
    setResetStep('request');
    setResetOpen(true);
  };

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          phone_number: resetPhone
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not start password reset.');

      setResetMessage(data.message || 'Reset instructions were created.');
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setResetStep('reset');
      } else {
        setResetToken('');
      }
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match.');
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not reset password.');

      setResetMessage(data.message || 'Password reset successfully.');
      setPassword('');
      setTimeout(() => {
        setResetOpen(false);
        setResetStep('request');
      }, 1200);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex w-full overflow-x-hidden h-screen">

      {/* Left Panel: Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-primary relative overflow-hidden p-12 h-full">
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <span className="material-symbols-outlined text-[64px] text-on-primary mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>
            dentistry
          </span>
          <h1 className="text-[32px] font-bold text-on-primary mb-3">UBT Dent</h1>
          <p className="text-[16px] text-primary-fixed-dim">Your dental health, simplified.</p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">

        {/* Mobile Logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <span className="material-symbols-outlined text-[40px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            dentistry
          </span>
          <h1 className="text-[24px] font-semibold text-on-surface">UBT Dent</h1>
        </div>

        {/* Card */}
        <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 flex flex-col">

          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-[24px] font-semibold text-on-surface mb-1">Welcome Back</h2>
            <p className="text-[15px] text-on-surface-variant">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
              <label className="text-[14px] font-semibold text-on-surface" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                id="email"
                name="email"
                type="email"
                placeholder="practitioner@clinic.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
              <div className="flex justify-between items-center">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="password">
                  Password
                </label>
                <button className="text-[12px] text-primary hover:text-tertiary transition-colors" type="button" onClick={openForgotPassword}>
                  Forgot Password?
                </button>
              </div>
              <input
                className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-start gap-3 mt-1">
              <input
                className="w-4 h-4 rounded border-outline-variant text-primary cursor-pointer mt-[2px]"
                id="remember"
                name="remember"
                type="checkbox"
              />
              <label className="text-[15px] text-on-surface-variant cursor-pointer" htmlFor="remember">
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-[12px] rounded-lg text-[14px] font-semibold mt-3 hover:bg-[#005049] transition-colors duration-200 shadow-sm flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>

          </form>
		  
		  <div className="mt-4 text-center">
			<p className="text-[15px] text-on-surface-variant">
				Don't have an account?{' '}
				<Link to="/register" className="text-[14px] font-semibold text-primary hover:text-[#005049] hover:underline transition-colors">
				Create Account
				</Link>
			</p>
		</div>

          {/* HIPAA Notice */}
          <div className="mt-12 pt-5 border-t border-outline-variant/20 text-center flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '20px' }}>
              health_and_safety
            </span>
            <p className="text-[12px] text-on-surface-variant max-w-[280px]">
              This is a secure, HIPAA-compliant portal. Unauthorized access is strictly prohibited and monitored.
            </p>
          </div>

        </div>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setResetOpen(false)}>
          <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-[24px] shadow-2xl border border-outline-variant/20 overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <h3 className="text-[22px] font-semibold text-on-surface">Reset Password</h3>
                <p className="text-[14px] text-on-surface-variant mt-1">
                  {resetStep === 'request' ? 'Verify your email and phone number.' : 'Set a new password.'}
                </p>
              </div>
              <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant" type="button" onClick={() => setResetOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              {resetError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {resetError}
                </div>
              )}
              {resetMessage && (
                <div className="mb-4 p-3 bg-[#e6f4ea] border border-[#ceead6] rounded text-[#137333] text-sm">
                  {resetMessage}
                </div>
              )}

              {resetStep === 'request' ? (
                <form className="flex flex-col gap-4" onSubmit={requestPasswordReset}>
                  <div>
                    <label className="text-[14px] font-semibold text-on-surface" htmlFor="reset-email">Email Address</label>
                    <input
                      className="mt-1 w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-on-surface" htmlFor="reset-phone">Phone Number</label>
                    <input
                      className="mt-1 w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                      id="reset-phone"
                      type="tel"
                      value={resetPhone}
                      onChange={(event) => setResetPhone(event.target.value)}
                      required
                    />
                  </div>
                  <button className="w-full bg-primary text-on-primary py-[12px] rounded-lg text-[14px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-60" type="submit" disabled={resetLoading}>
                    {resetLoading ? 'Verifying...' : 'Verify and Continue'}
                  </button>
                </form>
              ) : (
                <form className="flex flex-col gap-4" onSubmit={submitPasswordReset}>
                  <div>
                    <label className="text-[14px] font-semibold text-on-surface" htmlFor="reset-token">Reset Token</label>
                    <input
                      className="mt-1 w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                      id="reset-token"
                      value={resetToken}
                      onChange={(event) => setResetToken(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-on-surface" htmlFor="new-password">New Password</label>
                    <input
                      className="mt-1 w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                      id="new-password"
                      type="password"
                      minLength="8"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-on-surface" htmlFor="confirm-password">Confirm Password</label>
                    <input
                      className="mt-1 w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                      id="confirm-password"
                      type="password"
                      minLength="8"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                  <button className="w-full bg-primary text-on-primary py-[12px] rounded-lg text-[14px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-60" type="submit" disabled={resetLoading}>
                    {resetLoading ? 'Saving...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
