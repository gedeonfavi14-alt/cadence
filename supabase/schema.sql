-- ============================================
-- CADENCE v2 — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE public.restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.dishes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category TEXT,
    media_url TEXT,
    media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
    active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    table_number TEXT NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    dish_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL,
    dish_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time NUMERIC(10,2) NOT NULL
);

-- ============================================
-- 2. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage Policies
CREATE POLICY "Public media access" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated media upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated media update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated media delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Restaurants: Owner full CRUD, Public can read (for client menu)
CREATE POLICY "restaurants_owner_all" ON public.restaurants
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "restaurants_public_read" ON public.restaurants
    FOR SELECT USING (true);

-- Dishes: Owner full CRUD, Public can read active dishes
CREATE POLICY "dishes_owner_all" ON public.dishes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = restaurant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "dishes_public_read" ON public.dishes
    FOR SELECT USING (true);

-- Allow anonymous users to increment views
CREATE POLICY "dishes_public_update_views" ON public.dishes
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Orders: Owner full CRUD, Public can insert (clients ordering)
CREATE POLICY "orders_owner_all" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = restaurant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "orders_public_insert" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_public_read" ON public.orders
    FOR SELECT USING (true);

-- Order Items: Owner can read, Public can insert
CREATE POLICY "order_items_owner_all" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.restaurants r ON r.id = o.restaurant_id
            WHERE o.id = order_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "order_items_public_insert" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_public_read" ON public.order_items
    FOR SELECT USING (true);

-- ============================================
-- 4. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;

-- ============================================
-- 5. INDEXES
-- ============================================

CREATE INDEX idx_dishes_restaurant ON public.dishes(restaurant_id);
CREATE INDEX idx_dishes_active ON public.dishes(restaurant_id, active);
CREATE INDEX idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX idx_orders_status ON public.orders(restaurant_id, status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_dish ON public.order_items(dish_id);
