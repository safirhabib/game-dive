import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { Game } from '../types';
import { Review } from '../types';

interface ReviewsListProps {
  game: Game;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ game }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API_BASE}/games/${game._id}/reviews`);
        setReviews(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch reviews. Please try again.');
        setLoading(false);
      }
    };

    fetchReviews();
  }, [game._id]);

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No reviews yet. Be the first to review this game!
        </div>
      ) : (
        reviews.map((review) => (
          <div
            key={review._id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{review.title}</h3>
                <p className="text-sm text-gray-600">
                  {review.user.username}
                </p>
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${
                      star <= review.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-gray-700">{review.text}</p>
            <div className="mt-4 text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewsList;
