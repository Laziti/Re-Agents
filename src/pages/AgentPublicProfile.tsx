import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import { Loader2, Phone, Mail, MapPin, Home, Star, Filter, Search } from 'lucide-react';
import { createSlug } from '@/lib/formatters';

interface AgentProfile {
  id: string;
  first_name: string;
  last_name: string;
  career?: string;
  phone_number?: string;
  avatar_url?: string;
  slug?: string;
  whatsapp_link?: string;
  telegram_link?: string;
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

interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  progressStatus?: string;
  bankOption?: boolean;
}

const AgentPublicProfile = () => {
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

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

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(1)}M ETB`;
    }
    return `${price.toLocaleString()} ETB`;
  };

  // Fetch agent profile by slug
  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      try {
        let currentAgent: AgentProfile | null = null;

        // Attempt to fetch by slug first
        const { data: profileBySlug, error: slugError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, career, phone_number, avatar_url, slug, status, whatsapp_link, telegram_link')
          .eq('slug', agentSlug)
          .maybeSingle();

        if (slugError) {
          console.error('Error fetching agent by slug:', slugError);
        }

        if (profileBySlug) {
          currentAgent = profileBySlug;
          console.log('Agent found by slug:', currentAgent);
        } else {
          // If no match by slug field, try the legacy method using name
          console.warn(`No agent found with slug: ${agentSlug}. Attempting fallback by name.`);
          const { data: profiles, error: backupError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, career, phone_number, avatar_url, status, slug, whatsapp_link, telegram_link')
            .eq('status', 'approved'); // Only search approved agents

          if (backupError) {
            console.error('Error fetching profiles for slug fallback:', backupError);
          }

          if (profiles && profiles.length > 0) {
            const matchedAgent = profiles.find(profile => {
              const fullName = `${profile.first_name} ${profile.last_name}`;
              return createSlug(fullName) === agentSlug;
            });

            if (matchedAgent) {
              currentAgent = matchedAgent;
              console.log('Agent found by name fallback:', currentAgent);
              // Update the profile with the slug for future use if it doesn't have one
              if (!matchedAgent.slug) {
                await supabase
                  .from('profiles')
                  .update({ slug: agentSlug })
                  .eq('id', matchedAgent.id);
                console.log(`Updated agent ${matchedAgent.id} with slug: ${agentSlug}`);
              }
            } else {
              console.warn('No agent found by name fallback.');
            }
          }
        }

        if (!currentAgent) {
          console.warn('No agent found, navigating to /not-found.');
          navigate('/not-found');
          return;
        }

        setAgent(currentAgent);

      } catch (error) {
        console.error('Error fetching agent profile:', error);
        setError('Error fetching agent profile');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentSlug, navigate]);

  // Fetch listings when agent is set
  useEffect(() => {
    const fetchListings = async () => {
      if (!agent) {
        console.log('Agent not set, skipping listings fetch.');
        return;
      }
      setLoading(true);
      console.log(`Fetching listings for agent ID: ${agent.id}`);
      try {
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, location, city, main_image_url, description, created_at, progress_status, bank_option')
          .eq('user_id', agent.id)
          .in('status', ['active', 'published'])
          .order('created_at', { ascending: false });

        if (listingsError) {
          console.error('Error fetching listings:', listingsError);
          setListings([]);
        } else {
          console.log(`Fetched ${listingsData?.length || 0} listings.`);
          setListings(listingsData as unknown as Listing[]);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [agent]);

  // Extract available cities from listings
  useEffect(() => {
    if (listings.length > 0) {
      const cities = Array.from(new Set(listings.map(listing => listing.city).filter(Boolean)));
      setAvailableCities(cities as string[]);
      console.log('Available cities for filtering:', cities);
    }
  }, [listings]);

  // Helper to toggle a filter value
  function toggleFilter(key, value) {
    setSearchFilters(prev => {
      let next = { ...prev };
      if (key === 'city') {
        next.city = prev.city === value ? undefined : value;
      } else if (key === 'progressStatus') {
        next.progressStatus = prev.progressStatus === value ? undefined : value;
      } else if (key === 'bankOption') {
        next.bankOption = prev.bankOption === value ? undefined : value;
      } else if (key === 'priceRange') {
        if (prev.minPrice === value.min && prev.maxPrice === value.max) {
          next.minPrice = undefined;
          next.maxPrice = undefined;
        } else {
          next.minPrice = value.min;
          next.maxPrice = value.max;
        }
      }
      return next;
    });
  }

  // Update filtered listings when searchFilters or listings change
  useEffect(() => {
    let filtered = [...listings];
    if (searchFilters.city) {
      filtered = filtered.filter(l => l.city === searchFilters.city);
    }
    if (searchFilters.progressStatus) {
      filtered = filtered.filter(l => l.progress_status === searchFilters.progressStatus);
    }
    if (searchFilters.bankOption !== undefined) {
      filtered = filtered.filter(l => l.bank_option === searchFilters.bankOption);
    }
    if (searchFilters.minPrice !== undefined && searchFilters.maxPrice !== undefined) {
      filtered = filtered.filter(l => l.price >= searchFilters.minPrice && l.price < searchFilters.maxPrice);
    }
    setFilteredListings(filtered);
  }, [searchFilters, listings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-red-600" />
          <p className="text-gray-600 animate-pulse">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (!agent) return null;

  const pageTitle = `${agent.first_name} ${agent.last_name} - Premium Real Estate Properties`;
  const pageDescription = `Discover luxury properties and real estate opportunities with ${agent.first_name} ${agent.last_name}${agent.career ? `, ${agent.career}` : ''}`;

  // Get featured listing (most expensive or first one)
  const featuredListing = listings.length > 0 ? listings.reduce((prev, current) => (prev.price > current.price) ? prev : current) : null;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      {/* Hero Section with Featured Property */}
      <div className="relative">
        <div className="h-[70vh] relative overflow-hidden">
          {featuredListing?.main_image_url ? (
            <img 
              src={featuredListing.main_image_url}
              alt={featuredListing.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
              <Home className="h-32 w-32 text-white/20" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          
          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl px-6">
              <div className="inline-block bg-red-600 text-white px-8 py-3 rounded-sm font-bold text-lg mb-6 transform -rotate-1 shadow-lg">
                YOUR DREAM HOME
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
                {featuredListing ? featuredListing.title : 'Premium Properties'}
              </h1>
              {featuredListing && (
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-6">
                  {formatPrice(featuredListing.price)}
                </div>
              )}
              <p className="text-xl md:text-2xl opacity-90 mb-8">
                Discover exceptional real estate opportunities
              </p>
              
              {/* Agent Info Banner */}
              <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={`${agent.first_name} ${agent.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                      {agent.first_name?.[0]}{agent.last_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">{agent.first_name} {agent.last_name}</div>
                  {agent.career && <div className="text-white/80">{agent.career}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gray-50 py-8 border-b">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <div className="text-gray-600">
                {filteredListings.length} properties available
              </div>
            </div>
            
            {/* Contact Buttons */}
            <div className="flex gap-3">
              {agent.phone_number && (
                <a
                  href={`tel:${agent.phone_number}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              )}
              {agent.whatsapp_link && (
                <a
                  href={agent.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
          
          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Cities */}
                {availableCities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Location</h3>
                    <div className="space-y-2">
                      {availableCities.map(city => (
                        <label key={city} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchFilters.city === city}
                            onChange={() => toggleFilter('city', city)}
                            className="mr-2"
                          />
                          <span className="text-gray-700">{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Price Ranges */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map(range => (
                      <label key={range.id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchFilters.minPrice === range.min && searchFilters.maxPrice === range.max}
                          onChange={() => toggleFilter('priceRange', { min: range.min, max: range.max })}
                          className="mr-2"
                        />
                        <span className="text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Progress Status */}
                {listings.length > 0 && (() => {
                  const progressStatuses = Array.from(new Set(listings.map(l => l.progress_status).filter(Boolean)));
                  return progressStatuses.length > 0 ? (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Construction Status</h3>
                      <div className="space-y-2">
                        {progressStatuses.map(status => (
                          <label key={status as string} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={searchFilters.progressStatus === status}
                              onChange={() => toggleFilter('progressStatus', status)}
                              className="mr-2"
                            />
                            <span className="text-gray-700">{progressStatusLabels[status as string] || status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                
                {/* Bank Option */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Financing</h3>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchFilters.bankOption === true}
                        onChange={() => toggleFilter('bankOption', true)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Bank Financing Available</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container mx-auto px-6 py-12">
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden border hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/${agent.slug}/listing/${createSlug(listing.title)}`)}
              >
                <div className="relative h-64">
                  {listing.main_image_url ? (
                    <img
                      src={listing.main_image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Home className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-sm font-bold">
                    {formatPrice(listing.price)}
                  </div>
                  
                  {/* Bank Option Badge */}
                  {listing.bank_option && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded-sm text-xs font-semibold">
                      Bank Financing
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{listing.title}</h3>
                  {listing.location && (
                    <div className="flex items-center gap-1 text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{listing.location}</span>
                    </div>
                  )}
                  {listing.description && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {listing.description}
                    </p>
                  )}
                  {listing.progress_status && (
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {progressStatusLabels[listing.progress_status] || listing.progress_status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Home className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Properties Found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>

      {/* Footer with Agent Contact */}
      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mx-auto mb-6">
              {agent.avatar_url ? (
                <img
                  src={agent.avatar_url}
                  alt={`${agent.first_name} ${agent.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-bold text-xl">
                  {agent.first_name?.[0]}{agent.last_name?.[0]}
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-2">{agent.first_name} {agent.last_name}</h2>
            {agent.career && <p className="text-xl text-gray-300 mb-6">{agent.career}</p>}
            
            <p className="text-gray-300 mb-8 text-lg">
              Ready to find your dream property? Get in touch today for personalized assistance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {agent.phone_number && (
                <a
                  href={`tel:${agent.phone_number}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  <Phone className="h-5 w-5" />
                  {agent.phone_number}
                </a>
              )}
              {agent.whatsapp_link && (
                <a
                  href={agent.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  WhatsApp
                </a>
              )}
              {agent.telegram_link && (
                <a
                  href={agent.telegram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPublicProfile;