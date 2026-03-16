-- Create increment function for PostgreSQL
CREATE OR REPLACE FUNCTION increment(x int) 
RETURNS int AS $$
BEGIN
  RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get pending gifts for a user
CREATE OR REPLACE FUNCTION get_pending_gifts(p_user_id UUID)
RETURNS TABLE (
  gift_id UUID,
  sender_id UUID,
  sender_name TEXT,
  gift_name TEXT,
  gift_image_url TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sg.id,
    sg.sender_id,
    COALESCE(p.name, 'Anonymous') as sender_name,
    vg.name as gift_name,
    vg.image_url as gift_image_url,
    sg.message,
    sg.created_at
  FROM sent_gifts sg
  JOIN virtual_gifts vg ON sg.gift_id = vg.id
  LEFT JOIN profiles p ON sg.sender_id = p.id
  WHERE sg.recipient_id = p_user_id 
    AND sg.status = 'pending'
  ORDER BY sg.created_at DESC;
END;
$$ LANGUAGE plpgsql;
