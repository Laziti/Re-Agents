import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle, Lock, Mail, User, Phone, MapPin } from 'lucide-react';
import { createSlug } from '@/lib/formatters';

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
  const { userRole } = useAuth();

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
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    // Check if there's a stored auth mode preference
    const authMode = localStorage.getItem('authMode');
    if (authMode === 'signup') {
      setActiveTab('signUp');
    } else if (authMode === 'signin') {
      setActiveTab('signIn');
    }
    
    // Clear the stored preference
    localStorage.removeItem('authMode');
    
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
      // Check if Supabase URL and key are defined
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase credentials. Please check ENV-SETUP.md for configuration instructions.");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      
      if (error) {
        // Handle Supabase auth errors with more specific messages
        if (error.message === 'Invalid API key') {
          throw new Error('Authentication error: Invalid Supabase API key. Please check your environment variables.');
        } else {
          throw error;
        }
      }
      
      if (data.user) navigate('/dashboard');
    } catch (error: any) {
      // Provide a more detailed error message for common issues
      let errorMsg = error.message || 'Failed to sign in.';
      
      if (errorMsg.includes('Invalid API key')) {
        errorMsg = 'Authentication error: Missing or invalid Supabase credentials. Please check ENV-SETUP.md for setup instructions.';
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'Invalid email or password. Please try again.';
      } else if (errorMsg.includes('rate limit')) {
        errorMsg = 'Too many sign-in attempts. Please try again in a few minutes.';
      }
      
      setErrorMessage(errorMsg);
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
      // Check if Supabase URL and key are defined
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase credentials. Please check ENV-SETUP.md for configuration instructions.");
      }
      
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
      
      if (signUpError) {
        // Handle Supabase auth errors with more specific messages
        if (signUpError.message === 'Invalid API key') {
          throw new Error('Authentication error: Invalid Supabase API key. Please check your environment variables.');
        } else {
          throw signUpError;
        }
      }
      
      if (!signUpAuthData.user) throw new Error("Sign up successful, but no user data returned.");
      
      // Generate slug from first and last name
      const slug = createSlug(`${signUpFirstName} ${signUpLastName}`);
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpAuthData.user.id,
        user_id: signUpAuthData.user.id,
        first_name: signUpFirstName,
        last_name: signUpLastName,
        phone_number: signUpPhoneNumber,
        company: companyToSubmit,
        status: 'active',
        slug,
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
      
      setSignUpSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
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
      // Provide a more detailed error message for common issues
      let errorMsg = error.message || 'Failed to sign up.';
      
      if (errorMsg.includes('Invalid API key')) {
        errorMsg = 'Authentication error: Missing or invalid Supabase credentials. Please check ENV-SETUP.md for setup instructions.';
      } else if (errorMsg.includes('rate limit')) {
        errorMsg = 'Too many sign-up attempts. Please try again in a few minutes.';
      }
      
      setErrorMessage(errorMsg);
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left side - Hero Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">RealEstate Portal</span>
          </div>

          <div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Your Real Estate.
              <span className="gradient-text block">Your Brand.</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Join hundreds of successful real estate professionals who trust our platform to showcase their properties and grow their business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Professional Listings</div>
                <div className="text-sm text-gray-600">Stunning property showcases</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Client Management</div>
                <div className="text-sm text-gray-600">Connect with prospects</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Analytics Dashboard</div>
                <div className="text-sm text-gray-600">Track your performance</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Secure Platform</div>
                <div className="text-sm text-gray-600">Enterprise-grade security</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="glass-card p-8 rounded-3xl shadow-2xl border border-white/20">
            
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-gray-100 rounded-2xl p-1">
              <button
                className={`flex-1 py-3 px-4 text-center font-semibold rounded-xl transition-all duration-300 ${
                  activeTab === 'signIn'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => { setActiveTab('signIn'); setErrorMessage(null); }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-semibold rounded-xl transition-all duration-300 ${
                  activeTab === 'signUp'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => { setActiveTab('signUp'); setErrorMessage(null); }}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Sign In Form */}
            {activeTab === 'signIn' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="modern-input pl-12 w-full"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="modern-input pl-12 w-full"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="modern-btn w-full group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signUp' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="max-h-96 overflow-y-auto"
              >
                {signUpSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm"
                  >
                    Sign up successful! Redirecting to your portal...
                  </motion.div>
                )}
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="firstName"
                          type="text"
                          value={signUpFirstName}
                          onChange={(e) => setSignUpFirstName(e.target.value)}
                          placeholder="First name"
                          className="modern-input pl-10 w-full text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="lastName"
                          type="text"
                          value={signUpLastName}
                          onChange={(e) => setSignUpLastName(e.target.value)}
                          placeholder="Last name"
                          className="modern-input pl-10 w-full text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="signUpEmail" className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="signUpEmail"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="modern-input pl-10 w-full text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="signUpPassword" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="signUpPassword"
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a password"
                        className="modern-input pl-10 w-full text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={signUpPhoneNumber}
                        onChange={(e) => setSignUpPhoneNumber(e.target.value)}
                        placeholder="Your phone number"
                        className="modern-input pl-10 w-full text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-700">
                      Real Estate Company
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        id="company"
                        value={signUpCompany}
                        onChange={(e) => setSignUpCompany(e.target.value as typeof REAL_ESTATE_COMPANIES[number] | '')}
                        className="modern-input pl-10 w-full text-sm"
                        disabled={isLoading}
                      >
                        <option value="">Select your company</option>
                        {REAL_ESTATE_COMPANIES.map((company) => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {showOtherCompanyInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <label htmlFor="otherCompany" className="block text-sm font-semibold text-gray-700">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="otherCompany"
                          type="text"
                          value={signUpOtherCompany}
                          onChange={(e) => setSignUpOtherCompany(e.target.value)}
                          placeholder="Enter your company name"
                          className="modern-input pl-10 w-full text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  <button
                    type="submit"
                    className="modern-btn w-full group mt-6"
                    disabled={isLoading || signUpSuccess}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthHero;
