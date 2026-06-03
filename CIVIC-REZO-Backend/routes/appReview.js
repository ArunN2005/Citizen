const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * Submit an app-level review and rating
 * POST /api/app-review/submit
 * Body: { userId: string, rating: number (1-5), title: string, review_text: string }
 */
router.post('/submit', async (req, res) => {
  try {
    console.log('📝 Processing app review submission:', req.body);

    const { userId, rating, title, review_text } = req.body;

    // Validation
    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Prepare review data
    const reviewData = {
      user_id: userId || req.user?.id || null,
      rating: parseInt(rating),
      review_title: title || null,
      review_text: review_text || null,
      created_at: new Date().toISOString()
    };

    // Insert review into database
    const { data: newReview, error: insertError } = await supabase
      .from('app_reviews')
      .insert([reviewData])
      .select();

    if (insertError) {
      console.error('❌ Error inserting app review:', insertError);

      // If table doesn't exist, create it
      if (insertError.code === '42P01') {
        console.log('📋 Creating app_reviews table...');

        const { error: createTableError } = await supabase.rpc('create_app_reviews_table', {});

        if (createTableError) {
          console.error('❌ Error creating app_reviews table:', createTableError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create app_reviews table'
          });
        }

        // Retry insertion
        const { data: retryReview, error: retryError } = await supabase
          .from('app_reviews')
          .insert([reviewData])
          .select();

        if (retryError) {
          console.error('❌ Error inserting review after table creation:', retryError);
          return res.status(500).json({
            success: false,
            message: 'Failed to submit review'
          });
        }

        newReview = retryReview;
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to submit review',
          details: insertError.message
        });
      }
    }

    console.log('✅ App review submitted successfully:', newReview?.[0]?.id);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        reviewId: newReview?.[0]?.id,
        rating: rating,
        submittedAt: reviewData.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error processing app review submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing review'
    });
  }
});

/**
 * Get app review statistics and recent reviews
 * GET /api/app-review/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting app review statistics...');

    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .from('app_reviews')
      .select('rating, review_title, review_text, created_at');

    if (statsError) {
      console.error('❌ Error getting app review stats:', statsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve review statistics'
      });
    }

    // Calculate statistics
    const totalReviews = stats.length;
    const averageRating = totalReviews > 0
      ? (stats.reduce((sum, item) => sum + item.rating, 0) / totalReviews).toFixed(2)
      : 0;

    const ratingDistribution = {
      1: stats.filter(s => s.rating === 1).length,
      2: stats.filter(s => s.rating === 2).length,
      3: stats.filter(s => s.rating === 3).length,
      4: stats.filter(s => s.rating === 4).length,
      5: stats.filter(s => s.rating === 5).length,
    };

    // Get recent reviews with text
    const recentReviews = stats
      .filter(s => s.review_text)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(r => ({
        rating: r.rating,
        title: r.review_title,
        review_text: r.review_text,
        created_at: r.created_at
      }));

    const responseData = {
      totalReviews,
      averageRating: parseFloat(averageRating),
      ratingDistribution,
      recentReviews
    };

    console.log('✅ App review statistics retrieved');

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error getting app review statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving review statistics'
    });
  }
});

module.exports = router;