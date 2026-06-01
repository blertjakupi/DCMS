import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const today = new Date();
  const maxDob = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    phone: '',
    password: '',
    confirmPassword: '',
    hipaa: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.hipaa) {
      setError('You must agree to the HIPAA privacy terms.');
      return;
    }

    if (formData.dob && formData.dob > maxDob) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [first_name, ...rest] = formData.fullName.trim().split(' ');
      const last_name = rest.join(' ') || '';

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex w-full overflow-x-hidden">

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-primary relative overflow-hidden p-12">
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <span className="material-symbols-outlined text-[64px] text-on-primary mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>
            dentistry
          </span>
          <h1 className="text-[32px] font-bold text-on-primary mb-3">UBT Dent</h1>
          <p className="text-[16px] text-primary-fixed-dim">Your dental health, simplified.</p>
        </div>
      </div>

      {/* Right Panel */}
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

          <div className="mb-5">
            <h2 className="text-[24px] font-semibold text-on-surface">Create Account</h2>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
              <label className="text-[14px] font-semibold text-on-surface" htmlFor="fullName">Full Name</label>
              <input
                className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                id="fullName" name="fullName" type="text" placeholder="Jane Doe"
                required value={formData.fullName} onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
              <label className="text-[14px] font-semibold text-on-surface" htmlFor="email">Email Address</label>
              <input
                className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                id="email" name="email" type="email" placeholder="jane.doe@example.com"
                required value={formData.email} onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="dob">Date of Birth</label>
                <input
                  className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                  id="dob" name="dob" type="date"
                  max={maxDob}
                  value={formData.dob} onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="phone">Phone Number</label>
                <input
                  className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                  id="phone" name="phone" type="tel" placeholder="(555) 000-0000"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
              <label className="text-[14px] font-semibold text-on-surface" htmlFor="password">Password</label>
              <input
                className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                id="password" name="password" type="password" placeholder="••••••••"
                required value={formData.password} onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-1 clinical-glow rounded transition-all duration-200">
              <label className="text-[14px] font-semibold text-on-surface" htmlFor="confirmPassword">Confirm Password</label>
              <input
                className="w-full px-3 py-[10px] border border-outline-variant rounded bg-surface-container-lowest text-on-surface text-[15px] focus:outline-none focus:border-primary focus:border-[2px] transition-all"
                id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                required value={formData.confirmPassword} onChange={handleChange}
              />
            </div>

            <div className="flex items-start gap-3 mt-1">
              <input
                className="w-4 h-4 rounded border-outline-variant text-primary cursor-pointer mt-[2px]"
                id="hipaa" name="hipaa" type="checkbox"
                checked={formData.hipaa} onChange={handleChange}
              />
              <label className="text-[12px] text-on-surface-variant cursor-pointer leading-tight pt-[2px]" htmlFor="hipaa">
                I agree to the HIPAA privacy terms and conditions.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-[12px] rounded-lg text-[14px] font-semibold mt-3 hover:bg-[#005049] transition-colors duration-200 shadow-sm flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <div className="mt-8 text-center">
            <p className="text-[15px] text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-[14px] font-semibold text-primary hover:text-[#005049] hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
