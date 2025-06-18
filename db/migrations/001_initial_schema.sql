-- Create metadata table
CREATE TABLE IF NOT EXISTS hierarchy_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_input JSONB NOT NULL,
    version VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in-draft', 'approved')),
    user_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create data table
CREATE TABLE IF NOT EXISTS hierarchy_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metadata_id UUID REFERENCES hierarchy_metadata(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_metadata_status ON hierarchy_metadata(status);
CREATE INDEX IF NOT EXISTS idx_metadata_version ON hierarchy_metadata(version);
CREATE INDEX IF NOT EXISTS idx_data_metadata_id ON hierarchy_data(metadata_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps
CREATE TRIGGER update_metadata_modtime
BEFORE UPDATE ON hierarchy_metadata
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_data_modtime
BEFORE UPDATE ON hierarchy_data
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
