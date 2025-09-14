-- Add thumbnail column to reddit_questions table
-- This migration adds support for storing image thumbnails from Reddit posts

ALTER TABLE reddit_questions ADD COLUMN thumbnail TEXT;
