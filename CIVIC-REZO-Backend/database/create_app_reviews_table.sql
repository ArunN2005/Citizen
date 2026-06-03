-- Create app_reviews table for storing user app-level reviews and ratings
CREATE TABLE IF NOT EXISTS app_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for guest reviews
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_reviews_user_id ON app_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_rating ON app_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_app_reviews_created_at ON app_reviews(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_app_review_updated_at ON app_reviews;
CREATE TRIGGER trigger_update_app_review_updated_at
    BEFORE UPDATE ON app_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_app_review_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can insert their own reviews" ON app_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own reviews" ON app_reviews
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all reviews" ON app_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

CREATE POLICY "Public can read reviews" ON app_reviews
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON app_reviews TO authenticated;
GRANT SELECT, INSERT ON app_reviews TO anon;