import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import { Loader2, Phone, Mail, MapPin, Home, Star, Filter, Search, MessageCircle, Send } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-red-600" />
          <p className="text-gray-600 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!agent) return null;

  const pageTitle = `${agent.first_name} ${agent.last_name} - Premium Real Estate Properties`;
  const pageDescription = `Discover luxury properties and real estate opportunities with ${agent.first_name} ${agent.last_name}${agent.career ? `, ${agent.career}` : ''}`;

  // Get featured listing (most expensive or first one)
  const featuredListing = listings.length > 0 ? listings.reduce((prev, current) => (prev.price > current.price) ? prev : current) : null;

  // Get unique property types from listings
  const propertyTypes = Array.from(new Set(listings.map(listing => {
    const title = listing.title.toLowerCase();
    if (title.includes('apartment') || title.includes('condo')) return 'Apartments';
    if (title.includes('house') || title.includes('villa')) return 'Houses';
    if (title.includes('commercial') || title.includes('office')) return 'Commercial';
    if (title.includes('land') || title.includes('plot')) return 'Land';
    return 'Properties';
  })));

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Cover Section */}
        <div className="bg-white rounded-lg shadow-sm border h-48 relative overflow-hidden">
          {featuredListing?.main_image_url ? (
            <img 
              src={featuredListing.main_image_url}
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
              <Home className="h-16 w-16 text-red-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome to My Profile</h1>
              <p className="text-lg">Discover Premium Real Estate Opportunities</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Profile Section - Left Side */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6 h-fit">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 mx-auto mb-4">
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={`${agent.first_name} ${agent.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl">
                      {agent.first_name?.[0]}{agent.last_name?.[0]}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {agent.first_name} {agent.last_name}
                </h2>
                {agent.career && (
                  <p className="text-gray-600 mb-4">{agent.career}</p>
                )}
                
                {/* Contact Actions */}
                <div className="space-y-2">
                  {agent.phone_number && (
                    <a
                      href={`tel:${agent.phone_number}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  {agent.telegram_link && (
                    <a
                      href={agent.telegram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Send className="h-4 w-4" />
                      Telegram
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">{listings.length}</div>
                      <div className="text-xs text-gray-600">Properties</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{availableCities.length}</div>
                      <div className="text-xs text-gray-600">Locations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Profile Bar and Categories Row */}
            <div className="grid grid-cols-12 gap-6">
              {/* Profile Bar */}
              <div className="col-span-12 md:col-span-4">
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center h-24 flex items-center justify-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">profile</h3>
                    <p className="text-sm text-gray-600">Real Estate Expert</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="col-span-12 md:col-span-8">
                <div className="bg-white rounded-lg shadow-sm border p-4 h-24">
                  <h3 className="font-semibold text-gray-800 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.slice(0, 4).map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Cards Row */}
            <div className="grid grid-cols-12 gap-6">
              {/* Featured Property */}
              <div className="col-span-12 md:col-span-4">
                <div className="bg-white rounded-lg shadow-sm border h-40 overflow-hidden">
                  {featuredListing ? (
                    <div 
                      className="h-full relative cursor-pointer"
                      onClick={() => navigate(`/${agent.slug}/listing/${createSlug(featuredListing.title)}`)}
                    >
                      {featuredListing.main_image_url ? (
                        <img
                          src={featuredListing.main_image_url}
                          alt={featuredListing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Home className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                        <div className="p-4 text-white">
                          <p className="text-sm font-medium">Featured</p>
                          <p className="text-xs truncate">{featuredListing.title}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Home className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No featured property</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="col-span-12 md:col-span-4">
                <div className="bg-white rounded-lg shadow-sm border p-4 h-40">
                  <h3 className="font-semibold text-gray-800 mb-3">Quick Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Properties</span>
                      <span className="text-sm font-medium">{listings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Listings</span>
                      <span className="text-sm font-medium">{filteredListings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Locations</span>
                      <span className="text-sm font-medium">{availableCities.length}</span>
                    </div>
                    {listings.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg. Price</span>
                        <span className="text-sm font-medium">
                          {formatPrice(listings.reduce((sum, listing) => sum + listing.price, 0) / listings.length)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="col-span-12 md:col-span-4">
                <div className="bg-white rounded-lg shadow-sm border p-4 h-40">
                  <h3 className="font-semibold text-gray-800 mb-3">Search Properties</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                    </button>
                    <div className="text-center">
                      <span className="text-sm text-gray-600">
                        {filteredListings.length} properties available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Filter Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Cities */}
                  {availableCities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Location</h4>
                      <div className="space-y-2">
                        {availableCities.map(city => (
                          <label key={city} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={searchFilters.city === city}
                              onChange={() => toggleFilter('city', city)}
                              className="mr-2 text-red-600"
                            />
                            <span className="text-sm text-gray-700">{city}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Price Ranges */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Price Range</h4>
                    <div className="space-y-2">
                      {priceRanges.map(range => (
                        <label key={range.id} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchFilters.minPrice === range.min && searchFilters.maxPrice === range.max}
                            onChange={() => toggleFilter('priceRange', { min: range.min, max: range.max })}
                            className="mr-2 text-red-600"
                          />
                          <span className="text-sm text-gray-700">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Progress Status */}
                  {listings.length > 0 && (() => {
                    const progressStatuses = Array.from(new Set(listings.map(l => l.progress_status).filter(Boolean)));
                    return progressStatuses.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">Construction Status</h4>
                        <div className="space-y-2">
                          {progressStatuses.map(status => (
                            <label key={status as string} className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={searchFilters.progressStatus === status}
                                onChange={() => toggleFilter('progressStatus', status)}
                                className="mr-2 text-red-600"
                              />
                              <span className="text-sm text-gray-700">{progressStatusLabels[status as string] || status}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Bank Option */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Financing</h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchFilters.bankOption === true}
                          onChange={() => toggleFilter('bankOption', true)}
                          className="mr-2 text-red-600"
                        />
                        <span className="text-sm text-gray-700">Bank Financing Available</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listings Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">Listings</h3>
                <p className="text-gray-600">Explore available properties</p>
              </div>
              
              <div className="p-6">
                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/${agent.slug}/listing/${createSlug(listing.title)}`)}
                      >
                        <div className="relative h-48">
                          {listing.main_image_url ? (
                            <img
                              src={listing.main_image_url}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Home className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Price Badge */}
                          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                            {formatPrice(listing.price)}
                          </div>
                          
                          {/* Bank Option Badge */}
                          {listing.bank_option && (
                            <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              Bank Financing
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-800 mb-2 line-clamp-1">{listing.title}</h4>
                          {listing.location && (
                            <div className="flex items-center gap-1 text-gray-600 mb-2">
                              <MapPin className="h-3 w-3" />
                              <span className="text-sm truncate">{listing.location}</span>
                            </div>
                          )}
                          {listing.description && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {listing.description}
                            </p>
                          )}
                          {listing.progress_status && (
                            <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {progressStatusLabels[listing.progress_status] || listing.progress_status}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Properties Found</h3>
                    <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPublicProfile;