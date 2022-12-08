-- User
CREATE TABLE `f_users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'auto increment primary key',
  `fid` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT 'FID of the user',
  `username` varchar (127) NOT NULL DEFAULT '' COMMENT 'display_name',
  `display_name` varchar (127) NOT NULL DEFAULT '' COMMENT 'display_name',
  `pfp_url` text NOT NULL DEFAULT '' COMMENT 'pfp_url',
  `pfp_verified` tinyint (1) NOT NULL DEFAULT 0 COMMENT 'pfp_verified',
  `profile_bio_text` text NOT NULL DEFAULT '' COMMENT 'profile_bio_text',
  `follower_count` int NOT NULL DEFAULT 0 COMMENT 'follower_count',
  `following_count` int NOT NULL DEFAULT 0 COMMENT 'following_count',
  `mtime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'modify time',
  `ctime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  PRIMARY KEY (`id`),
  key `ix_mtime` USING btree (`mtime`),
  unique key `fid` USING btree (`fid`)
) ENGINE = innodb DEFAULT CHARACTER SET = "utf8mb4" COLLATE = "utf8mb4_general_ci" COMMENT = 'User Table';

-- Cast
CREATE TABLE `f_casts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'auto increment primary key',
  `hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'hash',
  `thread_hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'thread_hash',
  `parent_hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'parent_hash',
  `parent_author_fid` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT 'parent_author_fid',
  `author_fid` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT 'author_fid',
  `text` text NOT NULL DEFAULT '' COMMENT 'text',  
  `timestamp` datetime NOT NULL DEFAULT '0001-01-01 00:00:00' COMMENT 'timestamp',
  `attachments` text NOT NULL DEFAULT '' COMMENT 'json string of attachments',
  `mtime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'modify time',
  `ctime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  PRIMARY KEY (`id`),
  key `ix_mtime` USING btree (`mtime`),
  unique key `hash` USING btree (`hash`),
  key `thread_hash` USING btree (`thread_hash`),
  key `parent_hash` USING btree (`parent_hash`),
  key `parent_author_fid` USING btree (`parent_author_fid`),
  key `author_fid` USING btree (`author_fid`)
) ENGINE = innodb DEFAULT CHARACTER SET = "utf8mb4" COLLATE = "utf8mb4_general_ci" COMMENT = 'Cast Table';

-- Recast
CREATE TABLE `f_recasts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'auto increment primary key',
  `hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'hash',
  `thread_hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'thread_hash',
  `parent_hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'parent_hash',
  `recast_hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'recast_hash',
  `fid` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT 'fid who recast',
  `mtime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'modify time',
  `ctime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  PRIMARY KEY (`id`),
  key `ix_mtime` USING btree (`mtime`),
  key `hash` USING btree (`hash`),
  key `thread_hash` USING btree (`thread_hash`),
  key `parent_hash` USING btree (`parent_hash`),
  unique key `recast_hash` USING btree (`recast_hash`),
  key `fid` USING btree (`fid`)
) ENGINE = innodb DEFAULT CHARACTER SET = "utf8mb4" COLLATE = "utf8mb4_general_ci" COMMENT = 'Recast Table';

-- Reaction
CREATE TABLE `f_reactions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'auto increment primary key',
  `hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'hash',
  `cast_hash` varchar (255) NOT NULL DEFAULT '' COMMENT 'cast_hash',
  `fid` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT 'fid who react',
  `reaction_type` varchar (255) NOT NULL DEFAULT '' COMMENT 'reaction_type',
  `timestamp` datetime NOT NULL DEFAULT '0001-01-01 00:00:00' COMMENT 'timestamp',
  `mtime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'modify time',
  `ctime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  PRIMARY KEY (`id`),
  key `ix_mtime` USING btree (`mtime`),
  key `cast_hash` USING btree (`cast_hash`),
  key `fid` USING btree (`fid`),
  unique key `hash` USING btree (`hash`)
) ENGINE = innodb DEFAULT CHARACTER SET = "utf8mb4" COLLATE = "utf8mb4_general_ci" COMMENT = 'Reaction Table';
