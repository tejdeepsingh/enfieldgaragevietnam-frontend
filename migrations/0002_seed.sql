INSERT OR IGNORE INTO products (id, sku, category, name_en, name_vi, description_en, description_vi, condition, compatibility, price_vnd, price_usd, price_inr, status, featured, image_url)
VALUES
('re500-clutch-kit','RE500-CL-001','Clutch','Royal Enfield 500cc Clutch Plate Set','Bộ lá côn Royal Enfield 500cc','Complete clutch plate set for Classic 500 and Bullet 500.','Bộ lá côn cho Classic 500 và Bullet 500.','new','["Classic 500","Bullet 500","Electra 500"]',1250000,50,4200,'available',1,'/assets/images/part-clutch.svg'),
('re500-fuel-pump','RE500-FU-002','Fuel','EFI Fuel Pump Assembly','Cụm bơm xăng EFI','Fuel pump assembly for Royal Enfield 500 EFI models.','Cụm bơm xăng cho các mẫu Royal Enfield 500 EFI.','new','["Classic 500 EFI","Bullet 500 EFI"]',2100000,84,7000,'available',1,'/assets/images/part-fuelpump.svg'),
('re500-throttle-cable','RE500-CB-003','Cables','Throttle Cable','Dây ga','Durable throttle cable for RE 500cc motorcycles.','Dây ga bền cho xe Royal Enfield 500cc.','new','["Classic 500","Bullet 500"]',320000,13,1100,'available',0,'/assets/images/part-cable.svg'),
('re500-front-brake','RE500-BR-004','Brakes','Front Brake Pad Set','Bố thắng trước','Front brake pad set for daily riding and touring.','Bố thắng trước cho đi phố và đi tour.','new','["Classic 500","Bullet 500","Thunderbird 500"]',450000,18,1500,'available',1,'/assets/images/part-brake.svg'),
('re500-air-filter','RE500-AF-005','Service','Air Filter Element','Lọc gió','Air filter for regular service replacement.','Lọc gió thay thế định kỳ.','new','["Classic 500","Bullet 500"]',280000,11,950,'available',0,'/assets/images/part-filter.svg'),
('re500-exhaust','RE500-EX-006','Exhaust','Classic Exhaust Silencer','Ống pô Classic','Classic style silencer for 500cc models.','Ống pô kiểu Classic cho dòng 500cc.','used','["Classic 500","Bullet 500"]',1750000,70,5900,'available',1,'/assets/images/part-exhaust.svg');
INSERT OR IGNORE INTO inventory (product_id, stock, reserved, location) VALUES
('re500-clutch-kit',4,0,'Ho Chi Minh City'),
('re500-fuel-pump',2,0,'Ho Chi Minh City'),
('re500-throttle-cable',12,0,'Ho Chi Minh City'),
('re500-front-brake',8,0,'Ho Chi Minh City'),
('re500-air-filter',10,0,'Ho Chi Minh City'),
('re500-exhaust',1,0,'Ho Chi Minh City');
INSERT OR IGNORE INTO settings (key, value) VALUES
('zalo_phone','+84xxxxxxxxx'),
('whatsapp_phone','+84xxxxxxxxx'),
('email','parts@enfieldgaragevietnam.vn'),
('address_en','Vietnam'),
('address_vi','Việt Nam');
