
-- SquadSpot Supabase initial schema
-- Run in Supabase SQL editor or with Supabase CLI migrations.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_region text,
  country text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (name, state_region, country)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  description text
);

CREATE TABLE IF NOT EXISTS public.vibes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tag_type text
);

CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  address text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  location geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
  ) STORED,
  price_level smallint CHECK (price_level BETWEEN 1 AND 4),
  avg_cost_per_person numeric CHECK (avg_cost_per_person IS NULL OR avg_cost_per_person >= 0),
  rating numeric CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  description text,
  avg_visit_duration_minutes integer NOT NULL DEFAULT 60 CHECK (avg_visit_duration_minutes > 0),
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_phone text,
  website_url text,
  primary_image_url text,
  source text,
  source_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_id)
);

CREATE TABLE IF NOT EXISTS public.place_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.place_categories (
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.place_tags (
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.place_vibes (
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  vibe_id uuid NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  relevance_score numeric NOT NULL DEFAULT 0.5 CHECK (relevance_score BETWEEN 0.0 AND 1.0),
  PRIMARY KEY (place_id, vibe_id)
);
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  home_city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR display_name IS NOT NULL),
  UNIQUE (squad_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  dietary_restrictions text[] NOT NULL DEFAULT ARRAY[]::text[],
  preferred_price_level smallint CHECK (preferred_price_level BETWEEN 1 AND 4),
  notification_opt_in boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferred_vibes (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vibe_id uuid NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, vibe_id)
);

CREATE TABLE IF NOT EXISTS public.itinerary_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  squad_id uuid REFERENCES public.squads(id) ON DELETE SET NULL,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  group_size integer NOT NULL CHECK (group_size > 0),
  budget_total numeric NOT NULL CHECK (budget_total >= 0),
  budget_currency text NOT NULL DEFAULT 'INR',
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  start_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.request_vibes (
  request_id uuid NOT NULL REFERENCES public.itinerary_requests(id) ON DELETE CASCADE,
  vibe_id uuid NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, vibe_id)
);

CREATE TABLE IF NOT EXISTS public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.itinerary_requests(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_estimated_cost numeric NOT NULL DEFAULT 0 CHECK (total_estimated_cost >= 0),
  total_duration_minutes integer NOT NULL DEFAULT 0 CHECK (total_duration_minutes >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE RESTRICT,
  sequence_order integer NOT NULL CHECK (sequence_order > 0),
  start_time timestamptz,
  end_time timestamptz,
  estimated_cost_per_person numeric CHECK (estimated_cost_per_person IS NULL OR estimated_cost_per_person >= 0),
  travel_time_to_next_minutes integer CHECK (travel_time_to_next_minutes IS NULL OR travel_time_to_next_minutes >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (itinerary_id, sequence_order)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS public.saved_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, itinerary_id)
);

CREATE TABLE IF NOT EXISTS public.itinerary_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (itinerary_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.distance_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id_a uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  place_id_b uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  distance_meters numeric NOT NULL CHECK (distance_meters >= 0),
  travel_time_minutes integer NOT NULL CHECK (travel_time_minutes >= 0),
  mode text NOT NULL DEFAULT 'driving' CHECK (mode IN ('walking', 'driving', 'transit')),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (place_id_a <> place_id_b),
  UNIQUE (place_id_a, place_id_b, mode)
);
CREATE INDEX IF NOT EXISTS idx_places_city_id ON public.places(city_id);
CREATE INDEX IF NOT EXISTS idx_places_price_level ON public.places(price_level);
CREATE INDEX IF NOT EXISTS idx_places_rating ON public.places(rating);
CREATE INDEX IF NOT EXISTS idx_places_location_gist ON public.places USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_place_vibes_vibe_id ON public.place_vibes(vibe_id);
CREATE INDEX IF NOT EXISTS idx_place_tags_tag_id ON public.place_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_place_categories_category_id ON public.place_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_sequence ON public.itinerary_items(itinerary_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_requests_requested_by ON public.itinerary_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_itinerary_requests_squad_id ON public.itinerary_requests(squad_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_request_id ON public.itineraries(request_id);
CREATE INDEX IF NOT EXISTS idx_distance_cache_lookup ON public.distance_cache(place_id_a, place_id_b, mode);

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_places_updated_at ON public.places;
CREATE TRIGGER set_places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_squads_updated_at ON public.squads;
CREATE TRIGGER set_squads_updated_at BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_squad_members_updated_at ON public.squad_members;
CREATE TRIGGER set_squad_members_updated_at BEFORE UPDATE ON public.squad_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_itinerary_requests_updated_at ON public.itinerary_requests;
CREATE TRIGGER set_itinerary_requests_updated_at BEFORE UPDATE ON public.itinerary_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER set_itineraries_updated_at BEFORE UPDATE ON public.itineraries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_itinerary_items_updated_at ON public.itinerary_items;
CREATE TRIGGER set_itinerary_items_updated_at BEFORE UPDATE ON public.itinerary_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_favorites_updated_at ON public.favorites;
CREATE TRIGGER set_favorites_updated_at BEFORE UPDATE ON public.favorites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_saved_itineraries_updated_at ON public.saved_itineraries;
CREATE TRIGGER set_saved_itineraries_updated_at BEFORE UPDATE ON public.saved_itineraries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_itinerary_feedback_updated_at ON public.itinerary_feedback;
CREATE TRIGGER set_itinerary_feedback_updated_at BEFORE UPDATE ON public.itinerary_feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_distance_cache_updated_at ON public.distance_cache;
CREATE TRIGGER set_distance_cache_updated_at BEFORE UPDATE ON public.distance_cache FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_squad_member(target_squad_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.squad_members sm
    WHERE sm.squad_id = target_squad_id AND sm.user_id = target_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_access_itinerary(target_itinerary_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.itineraries i
    JOIN public.itinerary_requests r ON r.id = i.request_id
    WHERE i.id = target_itinerary_id
      AND (r.requested_by = target_user_id OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id, target_user_id)))
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferred_vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active cities" ON public.cities FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can read vibes" ON public.vibes FOR SELECT USING (true);
CREATE POLICY "Public can read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Public can read active places" ON public.places FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read place photos" ON public.place_photos FOR SELECT USING (true);
CREATE POLICY "Public can read place categories" ON public.place_categories FOR SELECT USING (true);
CREATE POLICY "Public can read place tags" ON public.place_tags FOR SELECT USING (true);
CREATE POLICY "Public can read place vibes" ON public.place_vibes FOR SELECT USING (true);
CREATE POLICY "Public can read distance cache" ON public.distance_cache FOR SELECT USING (true);

CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can read squadmate profiles" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.squad_members mine JOIN public.squad_members theirs ON theirs.squad_id = mine.squad_id WHERE mine.user_id = auth.uid() AND theirs.user_id = users.id));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read owned or joined squads" ON public.squads FOR SELECT USING (created_by = auth.uid() OR public.is_squad_member(id));
CREATE POLICY "Users can create squads" ON public.squads FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Squad admins can update squads" ON public.squads FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = id AND sm.user_id = auth.uid() AND sm.role = 'admin')
) WITH CHECK (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = id AND sm.user_id = auth.uid() AND sm.role = 'admin')
);
CREATE POLICY "Squad creators can delete squads" ON public.squads FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Members can read squad members" ON public.squad_members FOR SELECT USING (public.is_squad_member(squad_id) OR user_id = auth.uid());
CREATE POLICY "Squad admins can manage members" ON public.squad_members FOR ALL USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_id AND sm.user_id = auth.uid() AND sm.role = 'admin')
) WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_id AND sm.user_id = auth.uid() AND sm.role = 'admin')
);

CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own preferred vibes" ON public.user_preferred_vibes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own or squad itinerary requests" ON public.itinerary_requests FOR SELECT USING (requested_by = auth.uid() OR (squad_id IS NOT NULL AND public.is_squad_member(squad_id)));
CREATE POLICY "Users can create own itinerary requests" ON public.itinerary_requests FOR INSERT WITH CHECK (requested_by = auth.uid() AND (squad_id IS NULL OR public.is_squad_member(squad_id)));
CREATE POLICY "Users can update own or squad itinerary requests" ON public.itinerary_requests FOR UPDATE USING (requested_by = auth.uid() OR (squad_id IS NOT NULL AND public.is_squad_member(squad_id))) WITH CHECK (requested_by = auth.uid() OR (squad_id IS NOT NULL AND public.is_squad_member(squad_id)));
CREATE POLICY "Users can delete own itinerary requests" ON public.itinerary_requests FOR DELETE USING (requested_by = auth.uid());

CREATE POLICY "Users can read request vibes for accessible requests" ON public.request_vibes FOR SELECT USING (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id)))));
CREATE POLICY "Users can manage request vibes for accessible requests" ON public.request_vibes FOR ALL USING (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id))))) WITH CHECK (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id)))));

CREATE POLICY "Users can read own or squad itineraries" ON public.itineraries FOR SELECT USING (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id)))));
CREATE POLICY "Users can create own or squad itineraries" ON public.itineraries FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id)))));
CREATE POLICY "Users can update own or squad itineraries" ON public.itineraries FOR UPDATE USING (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id))))) WITH CHECK (EXISTS (SELECT 1 FROM public.itinerary_requests r WHERE r.id = request_id AND (r.requested_by = auth.uid() OR (r.squad_id IS NOT NULL AND public.is_squad_member(r.squad_id)))));

CREATE POLICY "Users can read accessible itinerary items" ON public.itinerary_items FOR SELECT USING (public.can_access_itinerary(itinerary_id));
CREATE POLICY "Users can manage accessible itinerary items" ON public.itinerary_items FOR ALL USING (public.can_access_itinerary(itinerary_id)) WITH CHECK (public.can_access_itinerary(itinerary_id));

CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own saved itineraries" ON public.saved_itineraries FOR ALL USING (user_id = auth.uid() AND public.can_access_itinerary(itinerary_id)) WITH CHECK (user_id = auth.uid() AND public.can_access_itinerary(itinerary_id));
CREATE POLICY "Users read feedback for accessible itineraries" ON public.itinerary_feedback FOR SELECT USING (public.can_access_itinerary(itinerary_id));
CREATE POLICY "Users create own feedback for accessible itineraries" ON public.itinerary_feedback FOR INSERT WITH CHECK (user_id = auth.uid() AND public.can_access_itinerary(itinerary_id));
CREATE POLICY "Users update own feedback" ON public.itinerary_feedback FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own feedback" ON public.itinerary_feedback FOR DELETE USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('trip-photos', 'trip-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can read trip photos" ON storage.objects FOR SELECT USING (bucket_id = 'trip-photos');
CREATE POLICY "Authenticated users can upload trip photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trip-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Owners can update trip photos" ON storage.objects FOR UPDATE USING (bucket_id = 'trip-photos' AND owner = auth.uid()) WITH CHECK (bucket_id = 'trip-photos' AND owner = auth.uid());
CREATE POLICY "Owners can delete trip photos" ON storage.objects FOR DELETE USING (bucket_id = 'trip-photos' AND owner = auth.uid());

COMMIT;

