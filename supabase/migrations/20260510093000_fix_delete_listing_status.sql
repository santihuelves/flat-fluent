CREATE OR REPLACE FUNCTION public.convinter_delete_listing(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  listing record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO listing
  FROM public.convinter_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LISTING_NOT_FOUND');
  END IF;

  IF listing.owner_id <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_OWNER');
  END IF;

  UPDATE public.convinter_listings
  SET status = 'deleted', updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_delete_listing(uuid) TO authenticated;
