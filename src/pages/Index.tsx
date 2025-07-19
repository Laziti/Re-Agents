import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Building2, Users, TrendingUp, Shield, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, userRole, userStatus } = useAuth();
  const navigate = useNavigate();

  // Redirect based on role
  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'super_admin') {
        navigate('/admin');
      } else if (userRole === 'agent' && (userStatus === 'approved' || userStatus === 'active')) {
        navigate('/dashboard');
      } else if (userRole === 'agent' && userStatus === 'pending_approval') {
        navigate('/pending');
      }
    }
  }, [user, userRole, userStatus, navigate]);

  // Don't redirect immediately if not authenticated - show the landing page
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Building2,
      title: "Property Management",
      description: "Showcase your listings with stunning galleries and detailed property information."
    },
    {
      icon: Users,
      title: "Client Portal",
      description: "Provide clients with a seamless experience to browse and connect with you."
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Track your performance with comprehensive insights and reporting tools."
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security to protect your data and client information."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Premium Properties",
      text: "This platform transformed how I showcase properties to clients. The professional look gives me a competitive edge.",
      rating: 5
    },
    {
      name: "Michael Chen",
      company: "Urban Realty",
      text: "The analytics features help me understand my market better. I've increased my closing rate by 30%.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      company: "Coastal Homes",
      text: "My clients love the seamless experience. It's professional, fast, and exactly what modern real estate needs.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="absolute top-0 w-full z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RealEstate Portal</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="border-2 border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Your Real Estate.
              <span className="gradient-text block">Your Brand.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create stunning property showcases, manage listings, and connect with clients through our modern real estate platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link to="/auth">
              <Button 
                size="lg" 
                className="gradient-btn px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-lg border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              View Demo
            </Button>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            className="relative max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="glass-card p-8 rounded-3xl shadow-2xl border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">10K+</div>
                  <div className="text-gray-600">Properties Listed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">500+</div>
                  <div className="text-gray-600">Active Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">98%</div>
                  <div className="text-gray-600">Client Satisfaction</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="gradient-text"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for real estate professionals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="modern-card p-8 hover-lift group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by
              <span className="gradient-text"> Professionals</span>
            </h2>
            <p className="text-xl text-gray-600">
              See what real estate agents are saying about our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="modern-card p-6 hover-lift"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="text-blue-200"> Real Estate Business?</span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of successful agents who are already using our platform to grow their business.
            </p>
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                Get Started Today
                <Zap className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">RealEstate Portal</span>
          </div>
          <p className="text-gray-400">
            © 2024 RealEstate Portal. Built for modern real estate professionals.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
