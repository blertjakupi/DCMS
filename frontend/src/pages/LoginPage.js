import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
	else if (role === 'PATIENT') navigate('/portal/dashboard');
	else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <h1 className="text-[32px] font-bold text-on-primary mb-3">DentaCare Pro</h1>
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
          <h1 className="text-[24px] font-semibold text-on-surface">DentaCare Pro</h1>
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
                <a className="text-[12px] text-primary hover:text-tertiary transition-colors" href="#">
                  Forgot Password?
                </a>
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
    </div>
  );
}

export default LoginPage;
