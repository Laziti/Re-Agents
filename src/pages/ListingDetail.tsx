import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { createSlug, formatCurrency, formatDate } from '@/lib/formatters';
import { Loader2, ArrowLeft, MapPin, Banknote, Calendar, ExternalLink, Phone, MessageCircle, Send, Share2, Copy, Check, FileText, Home, DollarSign, Facebook, Twitter, Linkedin, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { createListingSlug } from '@/components/public/ListingCard';
import { Listing, Agent } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ListingDetail = () => {
  const { agentSlug, listingSlug } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareUrlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching listing details for agentSlug: ${agentSlug}, listingSlug: ${listingSlug}`);

        // Get listings for this agent, including user_id
        // Remove any authentication dependency and make this truly public
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select(`*`)
          .in('status', ['active', 'published']); // Allow both active and published listings

        if (listingsError) {
          console.error('Supabase error fetching listings:', listingsError);
          throw new Error('Error fetching listings');
        }
        if (!listings || listings.length === 0) {
          console.warn('No listings found.', { listings });
          throw new Error('No listings found');
        }
        console.log(`Successfully fetched ${listings.length} total listings.`);

        // Find the agent by slug first
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, career, phone_number, avatar_url, slug, status, whatsapp_link, telegram_link')
          .eq('slug', agentSlug)
          .in('status', ['active', 'approved']) // Allow both active and approved agents
          .maybeSingle();
        
        if (agentError) {
          console.error('Supabase error fetching agent by slug:', agentError);
          throw new Error('Error fetching agent profile');
        }
        if (!agentData) {
          console.warn(`Agent with slug ${agentSlug} not found or not approved.`);
          throw new Error('Agent not found');
        }
        console.log('Agent found:', agentData);

        // Filter listings by the found agent's ID
        const agentListings = listings.filter(l => l.user_id === agentData.id);
        if (agentListings.length === 0) {
          console.warn(`No listings found for agent ID ${agentData.id}.`);
          throw new Error('No listings found for this agent');
        }
        console.log(`Found ${agentListings.length} listings for agent ${agentData.id}.`);

        // Find the listing with matching slug from the agent's listings
        const matchingListing = agentListings.find(
          listing => {
            const generatedSlug = createListingSlug(listing.title);
            console.log(`Comparing fetched listing title: "${listing.title}" (generated slug: "${generatedSlug}") with URL slug: "${listingSlug}"`);
            return generatedSlug === listingSlug;
          }
        );

        if (!matchingListing) {
          console.warn(`No matching listing found for listingSlug: ${listingSlug} among agent's listings.`);
          throw new Error('Listing not found');
        }

        setListing(matchingListing);
        setAgent(agentData);
        console.log('Setting listing:', matchingListing);
        console.log('Setting agent:', agentData);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Caught error in fetchListing:', err);
        setError(errorMessage);
        // Only navigate if an agentSlug exists to avoid infinite redirects on root
        if (agentSlug) {
          console.log(`Navigating back to agent profile due to error: ${errorMessage}`);
          navigate(`/${agentSlug}`, { replace: true });
        } else {
          console.log('Navigating to /not-found due to error and no agentSlug.');
          navigate('/not-found', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    if (agentSlug && listingSlug) {
      fetchListing();
    } else {
      console.warn('Missing agentSlug or listingSlug. Skipping fetchListing.', { agentSlug, listingSlug });
      setLoading(false);
      setError('Invalid URL for listing details.');
      navigate('/not-found', { replace: true });
    }
  }, [agentSlug, listingSlug, navigate]);

  const handleCopyLink = () => {
    const url = window.location.href;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
      
      document.body.removeChild(textarea);
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this listing: ${listing?.title || ''}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this listing: ${listing?.title || ''}\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(listing?.title || 'Check out this property');
    const summary = encodeURIComponent(listing?.description || '');
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${summary}`, '_blank', 'noopener,noreferrer');
  };

  const shareToTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this listing: ${listing?.title || ''}`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-gold-500 mx-auto mb-4" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--portal-text-secondary)] text-lg"
          >
            Loading property details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error || !listing || !agent) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)]">
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Oops!</h2>
            <p className="text-[var(--portal-text-secondary)] mb-6">
              {error || 'This property listing could not be found.'}
            </p>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const pageTitle = `${listing.title} - Property Listing`;
  const pageDescription = listing.description 
    ? listing.description.substring(0, 160) 
    : `View details for this property listed by ${agent.first_name} ${agent.last_name}`;

  const contactOptions = [
    { 
      type: 'phone',
      label: 'Call Agent',
      icon: <Phone className="h-4 w-4 mr-2" />,
      href: `tel:${agent.phone_number}`,
      link: agent.phone_number,
    },
    { 
      type: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4 mr-2" />,
      href: listing.whatsapp_link,
      link: listing.whatsapp_link,
    },
    { 
      type: 'telegram',
      label: 'Telegram',
      icon: <Send className="h-4 w-4 mr-2" />,
      href: listing.telegram_link,
      link: listing.telegram_link,
    },
  ].filter(option => option.link);

  const shareUrl = window.location.href;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={listing.description?.slice(0, 155) || `View details for ${listing.title}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={listing.description?.slice(0, 155) || `View details for ${listing.title}`} />
        {listing.main_image_url && (
          <meta property="og:image" content={listing.main_image_url} />
        )}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-[var(--portal-bg)] to-gold-50/30 relative overflow-x-hidden">
        {/* Decorative blurred background elements for luxury feel */}
        <div className="fixed top-0 left-0 w-[36rem] h-[36rem] bg-gold-400/10 rounded-full -ml-60 -mt-60 blur-3xl pointer-events-none z-0"></div>
        <div className="fixed bottom-0 right-0 w-[36rem] h-[36rem] bg-gold-500/10 rounded-full -mr-60 -mb-60 blur-3xl pointer-events-none z-0"></div>
        {/* Hero/Image Section with gradient overlay */}
        <div className="relative w-full h-72 md:h-96 mb-12 flex items-end z-10">
          <div className="absolute inset-0">
            <img 
              src={listing.main_image_url || '/placeholder.svg'} 
              alt={listing.title} 
              className="w-full h-full object-cover object-center brightness-90" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="relative z-10 w-full px-6 md:px-16 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2 flex items-center gap-3">
                <Home className="h-8 w-8 text-gold-400" />
                {listing.title}
              </h1>
              <div className="flex items-center gap-6 text-lg text-gold-100/90 font-medium">
                <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold-300" />{listing.location || 'N/A'}</span>
                <span className="flex items-center gap-2"><Banknote className="h-5 w-5 text-gold-300" />{formatCurrency(listing.price || 0)}</span>
                <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold-300" />{formatDate(listing.created_at)}</span>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/80 text-gold-700 hover:bg-gold-100 border-none flex items-center justify-center gap-2 px-6 py-3 shadow-lg backdrop-blur-md"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Listing
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-white/90 border-gold-100 p-2 rounded-lg shadow-xl backdrop-blur-md">
                  <Button
                    onClick={handleCopyLink}
                    variant="ghost"
                    className="w-full justify-start text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="text-green-500 mr-2"
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="mr-2"
                        >
                          <Copy className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button 
                    onClick={shareToFacebook}
                    variant="ghost"
                    className="w-full justify-start text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button 
                    onClick={shareToTwitter}
                    variant="ghost"
                    className="w-full justify-start text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button 
                    onClick={shareToWhatsApp}
                    variant="ghost"
                    className="w-full justify-start text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    onClick={shareToLinkedIn}
                    variant="ghost"
                    className="w-full justify-start text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    onClick={shareToTelegram}
                    variant="ghost"
                    className="w-full justify-start text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Telegram
                  </Button>
                </PopoverContent>
              </Popover>
            </motion.div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-10 py-12 relative z-10 max-w-7xl">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[var(--portal-text-secondary)] hover:text-gold-500 mb-10 transition-colors group text-lg font-medium gap-2"
          >
            <ArrowLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Listings
          </motion.button>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Left: Gallery (2 cols on desktop) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <ModernGallery images={[
                listing.main_image_url,
                ...(Array.isArray(listing.additional_image_urls) ? listing.additional_image_urls : [])
              ].filter(Boolean)} />
              {/* Description Card (below gallery on all screens) */}
              <Card className="bg-white/80 border-gold-100 rounded-2xl shadow-xl backdrop-blur-md mt-4">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gold-500 flex items-center gap-2">
                    <FileText className="h-6 w-6 mr-2" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gold dark:prose-invert max-w-none text-lg break-words whitespace-pre-line">
                  {listing.description ? (
                    <p className="whitespace-pre-line leading-relaxed text-[var(--portal-text-secondary)]">{listing.description}</p>
                  ) : (
                    <p className="text-[var(--portal-text-secondary)] italic">No description provided for this listing.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Right: Key Details and Contact Card */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              {/* Key Details Card */}
              <Card className="bg-white/80 border-gold-100 rounded-2xl shadow-xl backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gold-500 flex items-center gap-2">
                    <MapPin className="h-6 w-6 mr-2" />
                    Key Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gold dark:prose-invert max-w-none">
                  <div className="grid grid-cols-1 gap-8">
                    {/* City */}
                    {listing.city && (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-gold-500"><MapPin className="h-5 w-5" />City</div>
                        <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                          {listing.city}
                        </p>
                      </>
                    )}
                    {/* Progress Status */}
                    {listing.progress_status && (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-gold-500"><ThumbsUp className="h-5 w-5" />Progress</div>
                        <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                          {listing.progress_status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </p>
                      </>
                    )}
                    {/* Bank Option */}
                    {listing.bank_option !== undefined && (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-gold-500"><Banknote className="h-5 w-5" />Bank Option</div>
                        <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                          {listing.bank_option ? 'Available' : 'Not Available'}
                        </p>
                      </>
                    )}
                    {/* Down Payment Percent */}
                    {listing.down_payment_percent !== undefined && (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-gold-500"><DollarSign className="h-5 w-5" />Down Payment (%)</div>
                        <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                          {listing.down_payment_percent}%
                        </p>
                      </>
                    )}
                    {/* Location (legacy) */}
                    {listing.location && (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-gold-500"><MapPin className="h-5 w-5" />Location</div>
                        <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                          {listing.location}
                        </p>
                      </>
                    )}
                    {/* Price */}
                    <div className="flex items-center gap-2 font-semibold text-gold-500"><Banknote className="h-5 w-5" />Price</div>
                    <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                      {listing.price === null || listing.price === undefined ? 'Call for price' : formatCurrency(listing.price)}
                    </p>
                    {/* Listed Date */}
                    <div className="flex items-center gap-2 font-semibold text-gold-500"><Calendar className="h-5 w-5" />Listed</div>
                    <p className="text-[var(--portal-text-secondary)] bg-gold-50/40 p-3 rounded-lg flex items-center gap-2">
                      {formatDate(listing.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* Contact Card (updated) */}
              <div className="bg-white/80 border-gold-100 rounded-2xl p-8 shadow-xl backdrop-blur-md sticky top-4 flex flex-col gap-6">
                <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 mr-1 text-black" /> Contact Agent
                </h2>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-black overflow-hidden border-2 border-gold-300 flex items-center justify-center">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={`${agent.first_name} ${agent.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black text-white text-3xl font-bold">
                        {agent.first_name?.[0]}{agent.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-black">{agent.first_name} {agent.last_name}</h3>
                    {agent.career && (
                      <p className="text-sm text-black">{agent.career}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {agent.phone_number && (
                    <a
                      href={`tel:${agent.phone_number}`}
                      className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-gold-500/90 text-black rounded-lg hover:bg-gold-600 transition-colors font-semibold shadow-md"
                    >
                      <Phone className="h-5 w-5" />
                      Call {agent.first_name}
                    </a>
                  )}
                  {agent.whatsapp_link && (
                    <a
                      href={agent.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold shadow-md"
                    >
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp
                    </a>
                  )}
                  {agent.telegram_link && (
                    <a
                      href={agent.telegram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-md"
                    >
                      <Send className="h-5 w-5" />
                      Telegram
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ModernGallery: React.FC<{ images: string[] }> = ({ images }) => {
  const [current, setCurrent] = React.useState(0);
  if (!images.length) return null;
  const goPrev = () => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const showThumbs = images.length > 1;
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden shadow-xl border border-gold-100 bg-white/70 backdrop-blur-md flex items-center justify-center">
        <img
          key={images[current]}
          src={images[current]}
          alt={`Property image ${current + 1}`}
          className="object-cover w-full h-full transition-all duration-500 ease-in-out rounded-2xl"
          style={{ opacity: 1 }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-gold-500 hover:text-white text-gold-700 rounded-full p-2 shadow-lg border border-gold-200 transition-colors z-10"
              aria-label="Previous image"
              type="button"
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-gold-500 hover:text-white text-gold-700 rounded-full p-2 shadow-lg border border-gold-200 transition-colors z-10"
              aria-label="Next image"
              type="button"
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
      {showThumbs && (
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gold-200 scrollbar-track-transparent pb-1">
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={img}
              onClick={() => setCurrent(idx)}
              className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${current === idx ? 'border-gold-500 shadow-lg' : 'border-gold-100'} flex-shrink-0 focus:outline-none`}
              style={{ minWidth: 80, minHeight: 56 }}
              aria-label={`Show image ${idx + 1}`}
              type="button"
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingDetail;