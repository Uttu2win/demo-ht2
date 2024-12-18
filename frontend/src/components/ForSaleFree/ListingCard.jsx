import React from 'react';
import { formatTimeAgo } from '../../utils/dateUtils.js';

const ListingCard = ({ listing }) => {
  const { 
    title, 
    description, 
    category,
    price,
    imageUrl,
    createdAt,
    createdBy 
  } = listing;

  return (
    <div className="listing-card">
      <div className="listing-image">
        <img src={imageUrl} alt={title} />
      </div>
      <div className="listing-content">
        <div className="listing-price">
          {category === 'free' ? 'Free' : `$${price}`}
        </div>
        <h3 className="listing-title">{title}</h3>
        <p className="listing-description">{description}</p>
        <div className="listing-meta">
          <div className="listing-user">
            <img 
              src={createdBy.profilePic} 
              alt={createdBy.name} 
              className="user-avatar"
            />
            <span>{createdBy.name}</span>
          </div>
          <div className="listing-time">
            {formatTimeAgo(new Date(createdAt))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;