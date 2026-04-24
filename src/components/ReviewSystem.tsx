import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Review } from '../types';

interface ReviewSystemProps {
  productId: string;
  productName: string;
}

export default function ReviewSystem({ productId, productName }: ReviewSystemProps) {
  const { user, profile, setAuthModalOpen } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (!productId) return;

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const reviewData: Omit<Review, 'id'> = {
        productId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Anonymous',
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-emerald-600 dark:text-emerald-500" />
            Reviews & Ratings
          </h3>
          <p className="text-sm text-zinc-500 mt-1">Share your experience with {productName}</p>
        </div>
        
        {reviews.length > 0 && (
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star className="text-amber-400 fill-amber-400" size={20} />
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{averageRating}</span>
            </div>
            <p className="text-xs text-zinc-500">{reviews.length} total reviews</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  size={24}
                  className={star <= (hoveredRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-600'}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
          </span>
        </div>

        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`What do you think about the ${productName}?`}
            rows={3}
            className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none shadow-inner"
          />
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-[10px] text-zinc-500 max-w-[200px] leading-tight">
             Keep it civil and focus on performance, noise, and temperatures.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-6 py-2 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10 active:scale-95 italic uppercase tracking-tighter"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Post Review
          </button>
        </div>
      </form>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="text-emerald-500 animate-spin" size={32} />
            <p className="text-zinc-500 text-sm italic">Gathering user feedback...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-2xl">
            <AlertTriangle className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" size={32} />
            <p className="text-zinc-500 font-medium italic">No reviews yet. Be the first to rate it!</p>
          </div>
        ) : (
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 rounded-2xl p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group shadow-sm dark:shadow-none"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                      <User className="text-emerald-600 dark:text-emerald-500" size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-white leading-none italic uppercase tracking-tighter">{review.userName}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {new Date(review.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-700'}
                      />
                    ))}
                    {(user?.uid === review.userId || profile?.role === 'admin' || profile?.role === 'owner') && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="ml-2 p-1.5 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 bg-zinc-50 dark:bg-black/20 py-2 rounded-r-lg">
                   "{review.comment}"
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
