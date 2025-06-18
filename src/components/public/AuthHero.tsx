import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REAL_ESTATE_COMPANIES = [
  "Noah Real Estate",
  "Gift Real Estate",
  "Flintstone Homes",
  "Afro-Tsion Real Estate",
  "Ayat Share Company",
  "Sunshine Real Estate",
  "Zemen Bank Real Estate",
  "Tsehay Real Estate",
  "Other"
] as const;

const AuthHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');
  const navigate = useNavigate();
  const { setUser, userRole } = useAuth();

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPhoneNumber, setSignUpPhoneNumber] = useState('');
  const [signUpCompany, setSignUpCompany] = useState<typeof REAL_ESTATE_COMPANIES[number] | ''>('');
  const [signUpOtherCompany, setSignUpOtherCompany] = useState('');
  const [showOtherCompanyInput, setShowOtherCompanyInput] = useState(false);


  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (signUpCompany === 'Other') {
      setShowOtherCompanyInput(true);
    } else {
      setShowOtherCompanyInput(false);
      setSignUpOtherCompany('');
    }
  }, [signUpCompany]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!signInEmail || !signInPassword) {
      setErrorMessage('Please fill in all fields for sign-in.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(signInEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      if (error) throw error;
      if (data.user) navigate('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign in.');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!signUpFirstName || !signUpLastName || !signUpEmail || !signUpPassword || !signUpPhoneNumber || !signUpCompany) {
      setErrorMessage('Please fill in all required fields for sign-up.');
      return;
    }
    if (signUpCompany === 'Other' && !signUpOtherCompany) {
      setErrorMessage('Please specify your company name.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(signUpEmail)) {
      setErrorMessage('Please enter a valid email address for sign-up.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPhoneNumber.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    setIsLoading(true);
    const companyToSubmit = signUpCompany === 'Other' ? signUpOtherCompany : signUpCompany;
    try {
      const { data: signUpAuthData, error: signUpError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            first_name: signUpFirstName,
            last_name: signUpLastName,
            phone_number: signUpPhoneNumber,
            company: companyToSubmit,
          }
        }
      });
      if (signUpError) throw signUpError;
      if (!signUpAuthData.user) throw new Error("Sign up successful, but no user data returned.");
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpAuthData.user.id,
        user_id: signUpAuthData.user.id,
        first_name: signUpFirstName,
        last_name: signUpLastName,
        phone_number: signUpPhoneNumber,
        company: companyToSubmit,
        status: 'active'
      });
      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw new Error('Account created, but profile setup failed. Please contact support.');
      }
      const { error: roleError } = await supabase.from('user_roles').insert({ user_id: signUpAuthData.user.id, role: 'agent' });
      if (roleError) {
        console.error('Error setting user role:', roleError);
        throw new Error('Account created, but role assignment failed. Please contact support.');
      }
      alert('Sign up successful! You can now sign in.');
      setActiveTab('signIn');
      setSignInEmail(signUpEmail);
      setSignInPassword('');
      setSignUpFirstName('');
      setSignUpLastName('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpPhoneNumber('');
      setSignUpCompany('');
      setSignUpOtherCompany('');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign up.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClasses = "w-full p-3 bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] rounded-md border border-[var(--portal-input-border)] focus:ring-2 focus:ring-[var(--portal-accent)] focus:border-transparent placeholder-[var(--portal-text-secondary)]";
  const buttonBaseClasses = "w-full bg-[var(--portal-button-bg)] hover:bg-[var(--portal-button-hover)] text-[var(--portal-button-text)] font-semibold p-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--portal-accent)] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transform";

  return (
    <div className="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)] flex flex-col items-center justify-center p-4 transition-all duration-500">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto p-4 md:p-8">
        {/* Left Column */}
        <div className="md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <img src="/Logo.svg" alt="Company Logo" className="w-32 h-auto mb-6 md:mb-8" />
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--portal-text)] mb-3 md:mb-4">About Real Estate Agents</h2>
          <p className="text-lg md:text-xl text-[var(--portal-text-secondary)]">Access exclusive tools and resources designed for top real estate professionals.</p>
        </div>

        {/* Right Column (Form Card) */}
        <div className="md:w-1/2 p-4 w-full flex justify-center md:justify-start">
          <div className="w-full max-w-md"> {/* This div now controls the form card's width and max-width */}
            <div className="flex mb-4 border-b border-[var(--portal-border)]">
              <button
                className={`flex-1 py-3 px-4 text-center font-semibold transition-colors duration-300 ${
                  activeTab === 'signIn'
                    ? 'text-[var(--portal-accent)] border-b-2 border-[var(--portal-accent)]'
                    : 'text-[var(--portal-text-secondary)] hover:text-[var(--portal-accent)] focus:outline-none'
                }`}
                onClick={() => { setActiveTab('signIn'); setErrorMessage(null); }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-semibold transition-colors duration-300 ${
                  activeTab === 'signUp'
                    ? 'text-[var(--portal-accent)] border-b-2 border-[var(--portal-accent)]'
                    : 'text-[var(--portal-text-secondary)] hover:text-[var(--portal-accent)] focus:outline-none'
                }`}
                onClick={() => { setActiveTab('signUp'); setErrorMessage(null); }}
              >
                Sign Up
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-700/30 border border-red-600 text-red-400 rounded-md text-center">
                {errorMessage}
              </div>
            )}

            <div className="bg-[var(--portal-card-bg)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--portal-border)] relative overflow-hidden min-h-[560px]">
              {/* Sign In Form */}
              <div
                className={`transition-opacity duration-500 ease-in-out ${
              activeTab === 'signIn' ? 'opacity-100' : 'opacity-0 absolute invisible pointer-events-none'
            }`}
          >
            <form onSubmit={handleSignIn} className="space-y-6">
              <h2 className="text-3xl font-bold text-center text-[var(--portal-accent)] mb-6">Sign In</h2>
              <div>
                <label htmlFor="email-signin" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email-signin"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className={inputBaseClasses}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password-signin" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password-signin"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className={inputBaseClasses}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className={buttonBaseClasses}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Sign Up Form */}
          <div
            className={`transition-opacity duration-500 ease-in-out ${
              activeTab === 'signUp' ? 'opacity-100' : 'opacity-0 absolute invisible pointer-events-none'
            }`}
          >
            <form onSubmit={handleSignUp} className="space-y-4">
              <h2 className="text-3xl font-bold text-center text-[var(--portal-accent)] mb-4">Create Your Account</h2>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="firstName-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName-signup"
                    value={signUpFirstName}
                    onChange={(e) => setSignUpFirstName(e.target.value)}
                    className={inputBaseClasses}
                    placeholder="John"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="lastName-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName-signup"
                    value={signUpLastName}
                    onChange={(e) => setSignUpLastName(e.target.value)}
                    className={inputBaseClasses}
                    placeholder="Doe"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email-signup"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className={inputBaseClasses}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password-signup"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className={inputBaseClasses}
                  placeholder="•••••••• (min. 6 characters)"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="phoneNumber-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber-signup"
                  value={signUpPhoneNumber}
                  onChange={(e) => setSignUpPhoneNumber(e.target.value)}
                  className={inputBaseClasses}
                  placeholder="+251 91 234 5678"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="company-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Real Estate Company
                </label>
                <select
                  id="company-signup"
                  value={signUpCompany}
                  onChange={(e) => setSignUpCompany(e.target.value as typeof REAL_ESTATE_COMPANIES[number] | '')}
                  className={`${inputBaseClasses} appearance-none`}
                  disabled={isLoading}
                >
                  <option value="" disabled>Select your company</option>
                  {REAL_ESTATE_COMPANIES.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
              {showOtherCompanyInput && (
                <div>
                  <label htmlFor="otherCompany-signup" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                    Company Name (if Other)
                  </label>
                  <input
                    type="text"
                    id="otherCompany-signup"
                    value={signUpOtherCompany}
                    onChange={(e) => setSignUpOtherCompany(e.target.value)}
                    className={inputBaseClasses}
                    placeholder="Enter your company name"
                    disabled={isLoading}
                  />
                </div>
              )}
              <button
                type="submit"
                className={`${buttonBaseClasses} pt-2 pb-2.5`} // Adjusted padding for button text centering
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHero;
