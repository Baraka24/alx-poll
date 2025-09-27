-- Create magic_links table for temporary authentication tokens
CREATE TABLE magic_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);

-- Enable RLS
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Magic links are only accessible via server-side operations" ON magic_links
  FOR ALL USING (false);

-- Function to clean up expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  DELETE FROM magic_links
  WHERE expires_at < NOW() - interval '1 hour';
END;
$$;

-- Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_magic_links_updated_at
  BEFORE UPDATE ON magic_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions to the service role
GRANT ALL ON magic_links TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
