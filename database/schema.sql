-- ============================================
-- Haxor IPTV - Database Schema
-- MariaDB 11+
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS `haxor_iptv`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `haxor_iptv`;

-- -------------------------------------------
-- Users Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `avatar` VARCHAR(512) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Playlists Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `source_type` ENUM('file', 'url') NOT NULL DEFAULT 'file',
  `source_url` TEXT DEFAULT NULL,
  `file_path` VARCHAR(512) DEFAULT NULL,
  `auto_refresh` TINYINT(1) NOT NULL DEFAULT 0,
  `refresh_interval` INT UNSIGNED DEFAULT 3600 COMMENT 'Seconds between refreshes',
  `last_refreshed` DATETIME DEFAULT NULL,
  `channel_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive', 'error') NOT NULL DEFAULT 'active',
  `error_message` TEXT DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_playlists_status` (`status`),
  INDEX `idx_playlists_auto_refresh` (`auto_refresh`),
  CONSTRAINT `fk_playlists_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Categories Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `icon` VARCHAR(512) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `channel_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categories_sort` (`sort_order`),
  INDEX `idx_categories_visible` (`is_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Channels Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `channels` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `playlist_id` INT UNSIGNED DEFAULT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `stream_url` TEXT NOT NULL,
  `logo_url` VARCHAR(1024) DEFAULT NULL,
  `logo_local` VARCHAR(512) DEFAULT NULL,
  `epg_id` VARCHAR(255) DEFAULT NULL,
  `tvg_name` VARCHAR(255) DEFAULT NULL,
  `tvg_language` VARCHAR(128) DEFAULT NULL,
  `tvg_country` VARCHAR(64) DEFAULT NULL,
  `group_title` VARCHAR(255) DEFAULT NULL,
  `quality` VARCHAR(32) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `last_checked` DATETIME DEFAULT NULL,
  `is_online` TINYINT(1) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_channels_playlist` (`playlist_id`),
  INDEX `idx_channels_category` (`category_id`),
  INDEX `idx_channels_active` (`is_active`),
  INDEX `idx_channels_epg` (`epg_id`),
  INDEX `idx_channels_name` (`name`),
  FULLTEXT INDEX `ft_channels_name` (`name`),
  CONSTRAINT `fk_channels_playlist` FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_channels_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- EPG Sources Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `epg_sources` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `auto_refresh` TINYINT(1) NOT NULL DEFAULT 0,
  `refresh_interval` INT UNSIGNED DEFAULT 86400 COMMENT 'Seconds between refreshes',
  `last_refreshed` DATETIME DEFAULT NULL,
  `program_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive', 'error') NOT NULL DEFAULT 'active',
  `error_message` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_epg_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- EPG Programs Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `epg_programs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `epg_source_id` INT UNSIGNED DEFAULT NULL,
  `channel_epg_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(512) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `category` VARCHAR(128) DEFAULT NULL,
  `icon` VARCHAR(1024) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_epg_programs_channel` (`channel_epg_id`),
  INDEX `idx_epg_programs_time` (`start_time`, `end_time`),
  INDEX `idx_epg_programs_source` (`epg_source_id`),
  CONSTRAINT `fk_epg_programs_source` FOREIGN KEY (`epg_source_id`) REFERENCES `epg_sources`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Favorites Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `channel_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_favorites` (`user_id`, `channel_id`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Watch History Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `watch_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `channel_id` INT UNSIGNED NOT NULL,
  `watched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration` INT UNSIGNED DEFAULT 0 COMMENT 'Watch duration in seconds',
  INDEX `idx_history_user` (`user_id`),
  INDEX `idx_history_channel` (`channel_id`),
  INDEX `idx_history_watched` (`watched_at`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_channel` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Settings Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key_name` VARCHAR(128) NOT NULL UNIQUE,
  `value` TEXT DEFAULT NULL,
  `type` ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  `description` VARCHAR(512) DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------
-- Logs Table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(128) NOT NULL,
  `entity_type` VARCHAR(64) DEFAULT NULL,
  `entity_id` INT UNSIGNED DEFAULT NULL,
  `details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_logs_user` (`user_id`),
  INDEX `idx_logs_action` (`action`),
  INDEX `idx_logs_created` (`created_at`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
