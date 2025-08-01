
-- Create lead_notes table for storing notes about leads/contacts
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES linkedin_leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own notes
CREATE POLICY "Users can view their own lead notes" ON lead_notes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own notes
CREATE POLICY "Users can insert their own lead notes" ON lead_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own notes
CREATE POLICY "Users can update their own lead notes" ON lead_notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own notes
CREATE POLICY "Users can delete their own lead notes" ON lead_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_user_id ON lead_notes(user_id);
CREATE INDEX idx_lead_notes_created_at ON lead_notes(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_notes_updated_at 
    BEFORE UPDATE ON lead_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
