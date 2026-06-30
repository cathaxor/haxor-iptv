-- ============================================
-- Haxor IPTV - Seed Data
-- ============================================

USE `haxor_iptv`;

-- -------------------------------------------
-- Default Admin User
-- Password: Admin@Haxor2024! (bcrypt hashed)
-- -------------------------------------------
INSERT INTO `users` (`username`, `email`, `password`, `role`, `is_active`) VALUES
('admin', 'admin@cathaxor.com', '$2b$12$LJ3m4ys3LzHN6RYfVZGEOeJqHm3fNLGHdqvf5j5yXXwXz5j5mPJKi', 'admin', 1),
('demo', 'demo@cathaxor.com', '$2b$12$LJ3m4ys3LzHN6RYfVZGEOeJqHm3fNLGHdqvf5j5yXXwXz5j5mPJKi', 'user', 1);

-- -------------------------------------------
-- Default Categories
-- -------------------------------------------
INSERT INTO `categories` (`name`, `slug`, `icon`, `sort_order`) VALUES
('General', 'general', '📺', 1),
('News', 'news', '📰', 2),
('Sports', 'sports', '⚽', 3),
('Entertainment', 'entertainment', '🎬', 4),
('Movies', 'movies', '🎥', 5),
('Music', 'music', '🎵', 6),
('Kids', 'kids', '🧸', 7),
('Documentary', 'documentary', '🌍', 8),
('Science', 'science', '🔬', 9),
('Lifestyle', 'lifestyle', '🏠', 10),
('Cooking', 'cooking', '🍳', 11),
('Travel', 'travel', '✈️', 12),
('Religious', 'religious', '🕌', 13),
('Education', 'education', '📚', 14),
('Business', 'business', '💼', 15);

-- -------------------------------------------
-- Default Settings
-- -------------------------------------------
INSERT INTO `settings` (`key_name`, `value`, `type`, `description`) VALUES
('site_name', 'Haxor IPTV', 'string', 'Site display name'),
('site_description', 'Premium IPTV Content Management System', 'string', 'Site meta description'),
('default_player_volume', '80', 'number', 'Default player volume (0-100)'),
('max_history_items', '100', 'number', 'Maximum watch history entries per user'),
('playlist_auto_refresh', 'true', 'boolean', 'Enable automatic playlist refresh'),
('playlist_refresh_interval', '3600', 'number', 'Playlist refresh interval in seconds'),
('epg_auto_refresh', 'true', 'boolean', 'Enable automatic EPG refresh'),
('epg_refresh_interval', '86400', 'number', 'EPG refresh interval in seconds'),
('allow_registration', 'false', 'boolean', 'Allow public user registration'),
('max_login_attempts', '5', 'number', 'Maximum login attempts before lockout'),
('lockout_duration', '900', 'number', 'Account lockout duration in seconds'),
('cache_ttl', '300', 'number', 'Cache time-to-live in seconds'),
('logo_download', 'true', 'boolean', 'Download channel logos locally'),
('theme', 'dark', 'string', 'Default UI theme');
