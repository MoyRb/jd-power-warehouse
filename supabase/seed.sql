-- Seed Data — JD Power Warehouse
-- LOCAL DEVELOPMENT ONLY. Do not import demo inventory into production.
-- Stable, valid UUIDs and ON CONFLICT DO NOTHING allow safe re-runs.
-- Category IDs: c..., product IDs: a..., image IDs: b..., inventory IDs: d...

-- Categories (6)
INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Tools', 'tools', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Outdoor', 'outdoor', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Landscaping', 'landscaping', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Grills', 'grills', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Home Improvement', 'home-improvement', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Seasonal', 'seasonal', 6)
ON CONFLICT (id) DO NOTHING;

-- Products (16) — demonstration data
INSERT INTO products (id, name, description, price, original_price, category_id, status, badge) VALUES
  ('a1000000-0000-0000-0000-000000000001', '7-Piece Patio Dining Set',
   'Weather-resistant outdoor dining set, all-season design.',
   450.00, 899.00, 'c1000000-0000-0000-0000-000000000002', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000002', 'DeWalt 20V Max Drill Combo Kit',
   'High performance drill and driver combo. Includes 2 batteries.',
   129.00, 279.00, 'c1000000-0000-0000-0000-000000000001', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000003', 'Folding Adirondack Chair',
   'Durable HDPE plastic, easy-fold design, weather resistant.',
   65.00, NULL, 'c1000000-0000-0000-0000-000000000002', 'published', NULL),
  ('a1000000-0000-0000-0000-000000000004', 'Gorilla Carts Steel Utility Cart',
   'Heavy-duty steel utility wagon, 400 lb capacity.',
   85.00, 149.00, 'c1000000-0000-0000-0000-000000000003', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000005', 'Kitchen Faucet with Pull-Down Sprayer',
   'Brushed nickel finish, easy installation, dual-function spray.',
   95.00, 199.00, 'c1000000-0000-0000-0000-000000000005', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000006', 'LED Shop Light (4ft)',
   'Super bright 4000 lumen LED, plug-and-play workshop lighting.',
   19.00, 45.00, 'c1000000-0000-0000-0000-000000000001', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000007', 'Milwaukee M18 Fuel Sawzall',
   'Brushless motor, anti-vibration, 18V lithium compatible.',
   159.00, 349.00, 'c1000000-0000-0000-0000-000000000001', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000008', 'Outdoor Solar Path Lights (6pk)',
   'Automatic dusk-to-dawn solar landscaping lights, stainless steel.',
   24.00, NULL, 'c1000000-0000-0000-0000-000000000003', 'published', 'New'),
  ('a1000000-0000-0000-0000-000000000009', 'Ridgid 14 Gal Wet/Dry Vac',
   'Powerful dual-stage motor, fine dust filter included.',
   49.00, 99.00, 'c1000000-0000-0000-0000-000000000001', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000010', 'Ryobi 40V Brushless Mower',
   'Self-propelled, 20" cutting deck, no gas needed.',
   299.00, 549.00, 'c1000000-0000-0000-0000-000000000003', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000011', 'Smart Wi-Fi Thermostat',
   'Compatible with Alexa and Google Home. Easy DIY install.',
   89.00, NULL, 'c1000000-0000-0000-0000-000000000005', 'published', 'New'),
  ('a1000000-0000-0000-0000-000000000012', 'Weber Spirit II E-210 Gas Grill',
   '2-burner propane grill, GS4 grilling system, folding side tables.',
   349.00, 599.00, 'c1000000-0000-0000-0000-000000000004', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000013', 'Pressure Washer 2800 PSI',
   'Gas-powered, 2.3 GPM, ideal for driveways and decks.',
   189.00, 379.00, 'c1000000-0000-0000-0000-000000000001', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000014', 'Garden Hose 100ft Heavy Duty',
   'Kink-free, UV resistant expandable hose with spray nozzle.',
   35.00, NULL, 'c1000000-0000-0000-0000-000000000003', 'published', NULL),
  ('a1000000-0000-0000-0000-000000000015', 'Patio Umbrella 9ft',
   'Crank-open mechanism, weather-resistant fabric, steel pole.',
   79.00, 149.00, 'c1000000-0000-0000-0000-000000000002', 'published', 'Sale'),
  ('a1000000-0000-0000-0000-000000000016', 'Char-Broil Gas Grill 4-Burner',
   'Cabinet-style grill with side burner and 60,000 BTU total output.',
   249.00, 449.00, 'c1000000-0000-0000-0000-000000000004', 'published', 'Sale')
ON CONFLICT (id) DO NOTHING;

-- Product images: local assets must exist under public/images/catalog
INSERT INTO product_images (id, product_id, storage_path, alt_text, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   '/images/catalog/59444aeb-52d7-40e5-8f8f-1e89e8899d3c_jpg.jpg', '7-Piece Patio Dining Set', 0),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
   '/images/catalog/5ecd6b7e-2134-4677-8677-59865f7d2a3b_jpg.jpg', 'DeWalt 20V Max Drill Combo Kit', 0),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
   '/images/catalog/60b4b087-e634-44d5-af6f-6eed391d798e_png.png', 'Folding Adirondack Chair', 0),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
   '/images/catalog/aba2682c-92e7-426b-957d-a2ff23820361_png.png', 'Gorilla Carts Steel Utility Cart', 0),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007',
   '/images/catalog/8d8390a7-66bb-4ff2-a6ca-773ade88973d_png.png', 'Milwaukee M18 Fuel Sawzall', 0),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008',
   '/images/catalog/83cf087a-4136-4a1a-89f7-855f3f094568_jpg.jpg', 'Outdoor Solar Path Lights', 0),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009',
   '/images/catalog/de38cf64-2f38-4c1c-b540-87d7a2421f48_jpg.jpg', 'Ridgid 14 Gal Wet/Dry Vac', 0),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010',
   '/images/catalog/a712d9c6-82a0-4e68-bdf3-d82d7fdbd474_jpg.jpg', 'Ryobi 40V Brushless Mower', 0),
  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000011',
   '/images/catalog/5843b637-e17c-48a9-b5ab-30e4f828ae25_jpg.jpg', 'Smart Wi-Fi Thermostat', 0),
  ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000012',
   '/images/catalog/4e28cc10-881f-4aed-a8cf-4bc24d26d2d8_jpg.jpg', 'Weber Spirit II E-210 Gas Grill', 0)
ON CONFLICT (id) DO NOTHING;

-- Inventory: 10 units per demonstration product
INSERT INTO inventory (id, product_id, quantity) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 10),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 10),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 10),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 10),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 10),
  ('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 10),
  ('d1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 10),
  ('d1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 10),
  ('d1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 10),
  ('d1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 10),
  ('d1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000011', 10),
  ('d1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000012', 10),
  ('d1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000013', 10),
  ('d1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000014', 10),
  ('d1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000015', 10),
  ('d1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000016', 10)
ON CONFLICT (id) DO NOTHING;

-- Store settings: illustrative placeholders, not verified business contact details
INSERT INTO store_settings (key, value) VALUES
  ('store_name', '"JD Power Warehouse"'),
  ('announcement_bar_text', '"FREE LOCAL PICKUP — Plainfield & Homer Glen, IL — Open Daily 6AM-10PM — WhatsApp: (815) 555-0123"'),
  ('contact_phone', '"+1 (815) 555-0123"'),
  ('contact_email', '"info@jdpowerwarehouse.com"'),
  ('business_hours', '"Daily 6am–10pm"'),
  ('whatsapp_number', '"18155550123"')
ON CONFLICT (key) DO NOTHING;