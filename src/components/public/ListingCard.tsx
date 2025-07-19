import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MapPin, ImageIcon, ExternalLink, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingCardProps {
  id: string;
  title: string;
  location?: string;
  mainImageUrl?: string;
  agentSlug?: string;
  description?: string;
  createdAt?: string;
  onViewDetails?: () => void;
}

export const createListingSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const ListingCard = ({
  id,
  title,
  location,
  mainImageUrl,
  agentSlug,
  description,
  createdAt,
  onViewDetails
}: ListingCardProps) => {
  // Format the time ago
  const timeAgo = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';

  // Format the description (limit to X characters)
  const shortDescription = description ? 
    description.length > 100 ? `${description.substring(0, 100)}...` : description 
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out"
    >
      {/* Image section */}
      <div className="relative w-full h-56 overflow-hidden">
        {mainImageUrl ? (
          <img 
            src={mainImageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ImageIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      </div>

      {/* Content section */}
      <div className="p-6">
        <h3 className="font-extrabold text-xl text-gray-900 mb-3 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors duration-300 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
          {title}
        </h3>
        
        {location && (
          <div className="flex items-start mb-4 text-gray-600">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="ml-2 text-sm line-clamp-1">{location}</span>
          </div>
        )}
        
        {shortDescription && (
          <div className="flex items-start mb-6 text-gray-600">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="ml-2 text-sm line-clamp-2 leading-relaxed">{shortDescription}</p>
          </div>
        )}
        
        {onViewDetails && (
          <Button
            variant="default"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-base shadow-md hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
            onClick={onViewDetails}
          >
            View Details
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ListingCard;
