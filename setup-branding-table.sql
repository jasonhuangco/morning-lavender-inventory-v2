-- Create branding_settings table for storing company branding information
CREATE TABLE IF NOT EXISTS public.branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Morning Lavender',
    logo_url TEXT DEFAULT '',
    icon_url TEXT DEFAULT '',
    primary_color TEXT NOT NULL DEFAULT '#8B4513',
    secondary_color TEXT NOT NULL DEFAULT '#E6E6FA',
    accent_color TEXT NOT NULL DEFAULT '#DDA0DD',
    text_color TEXT NOT NULL DEFAULT '#374151',
    background_color TEXT NOT NULL DEFAULT '#F9FAFB',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branding_settings_updated_at 
    BEFORE UPDATE ON branding_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default branding settings (let UUID be auto-generated)
INSERT INTO public.branding_settings (company_name, logo_url, icon_url, primary_color, secondary_color, accent_color, text_color, background_color)
VALUES ('Morning Lavender', '', '', '#8B4513', '#E6E6FA', '#DDA0DD', '#374151', '#F9FAFB');

-- Enable Row Level Security (RLS)
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.branding_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.branding_settings TO authenticated;
GRANT ALL ON public.branding_settings TO anon;
