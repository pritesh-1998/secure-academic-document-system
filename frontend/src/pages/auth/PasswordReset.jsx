import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';

export default function PasswordReset() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Step 1: Send OTP
  const handleSendOTP = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      setStep(2);
      setCountdown(60);
      setLoading(false);
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 600);
  };

  // Handle OTP input — each digit in its own box
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 600);
  };

  // Step 3: Reset Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      alert('Password reset successfully! Please log in.');
      window.location.href = '/login';
    }, 600);
  };

  const resendOTP = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

  // Stepper indicator
  const Stepper = () => (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
              step >= s
                ? 'bg-primary text-white'
                : 'bg-border text-text-secondary'
            }`}
          >
            {step > s ? '✓' : s}
          </div>
          {s < 3 && (
            <div className={`w-6 sm:w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <AuthLayout>
      <Stepper />

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Enter Email */}
      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text">Reset Password</h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Enter your email address and we'll send you a verification code.
          </p>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* Step 2: Enter OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text">Verify OTP</h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Enter the 6-digit code sent to <span className="font-medium text-text break-all">{email}</span>
          </p>
          <div className="flex gap-1.5 sm:gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(i, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(i, e)}
                className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold rounded-lg border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-text-secondary">
                Resend code in <span className="font-medium text-primary">{countdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={resendOTP}
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text">New Password</h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Create a strong password for your account.
          </p>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
            <input
              id="reset-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm Password</label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition-colors">
          ← Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
