import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Briefcase, Award, Star, Calendar, MessageCircle, Send, Sparkles } from 'lucide-react';

interface ListingCategory {
  id: string;
  label: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location?: string;
  city?: string;
  main_image_url?: string;
  description?: string;
  created_at?: string;
  progress_status?: 'excavation' | 'on_progress' | 'semi_finished' | 'fully_finished';
  bank_option?: boolean;
}

interface AgentProfileHeaderProps {
  firstName: string;
  lastName: string;
  career?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  description?: string;
  experience?: string;
  email?: string;
  location?: string;
  whatsappLink?: string;
  telegramLink?: string;
  listings?: Listing[];
}

const progressStatusLabels: Record<string, string> = {
  excavation: 'Excavation',
  on_progress: 'On Progress',
  semi_finished: 'Semi-finished',
  fully_finished: 'Fully Finished',
};

const priceRanges = [
  { id: 'lt1m', label: '< 1M ETB', min: 0, max: 1_000_000 },
  { id: '1m-3m', label: '1M - 3M ETB', min: 1_000_000, max: 3_000_000 },
  { id: '3m-5m', label: '3M - 5M ETB', min: 3_000_000, max: 5_000_000 },
  { id: '5m-10m', label: '5M - 10M ETB', min: 5_000_000, max: 10_000_000 },
  { id: 'gt10m', label: '> 10M ETB', min: 10_000_000, max: Infinity },
];

const AgentProfileHeader = ({
  firstName,
  lastName,
  career,
  phoneNumber,
  avatarUrl,
  description,
  experience,
  email,
  location,
  whatsappLink,
  telegramLink,
  listings = [],
}: AgentProfileHeaderProps) => {
  // Default description if none provided
  const agentDescription = description || `${firstName} ${lastName} is a trusted real estate agent specializing in finding the perfect properties for clients.`;

  // Extract unique cities
  const cities = Array.from(new Set(listings.map(l => l.city).filter(Boolean)));
  // Extract unique progress statuses
  const progressStatuses = Array.from(new Set(listings.map(l => l.progress_status).filter(Boolean)));
  // Bank options
  const hasBankOption = listings.some(l => l.bank_option);
  const hasNoBankOption = listings.some(l => l.bank_option === false);
  // Price range categories present in listings
  const priceRangeIds = new Set<string>();
  listings.forEach(l => {
    const range = priceRanges.find(r => l.price >= r.min && l.price < r.max);
    if (range) priceRangeIds.add(range.id);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-card-bg)] p-8 shadow-xl backdrop-blur-sm"
    >
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative flex-shrink-0"
        >
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[var(--portal-border)] shadow-lg bg-[var(--portal-bg-hover)]">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`${firstName} ${lastName}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--portal-bg)] to-[var(--portal-card-bg)] text-gold-500 text-4xl font-bold">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
            )}
            {/* Verified badge */}
            {email && (
              <div className="absolute bottom-2 right-2 bg-gold-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 animate-bounce">
                <Award className="w-4 h-4" /> Verified
              </div>
            )}
          </div>
        </motion.div>
        {/* Info Section */}
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate= {{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--portal-text)] mb-2">{firstName} {lastName}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-4 text-[var(--portal-text-secondary)]">
              {career && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--portal-bg-hover)] rounded-full text-sm font-medium">
                  <Briefcase className="h-4 w-4 text-gold-500" />
                  <span>{career}</span>
                </div>
              )}
              {experience && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--portal-bg-hover)] rounded-full text-sm font-medium">
                  <Calendar className="h-4 w-4 text-gold-500" />
                  <span>{experience}</span>
                </div>
              )}
              {location && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--portal-bg-hover)] rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4 text-gold-500" />
                  <span>{location}</span>
                </div>
              )}
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-[var(--portal-text-secondary)] mb-6 max-w-3xl leading-relaxed text-lg"
            >
              {agentDescription}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentProfileHeader;