-- ReWear MySQL 8.0+ schema.
-- Run as a MySQL administrator. The application must use a least-privilege user.
-- MySQL has no Supabase-style Row Level Security: authorization is enforced by the API layer.

CREATE DATABASE IF NOT EXISTS rewear
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE rewear;

CREATE TABLE users (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(24) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NULL,
  avatar_url VARCHAR(2048) NULL,
  bio VARCHAR(500) NULL,
  location VARCHAR(120) NULL,
  email_verified_at DATETIME NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  UNIQUE KEY users_username_unique (username),
  CONSTRAINT users_username_length CHECK (CHAR_LENGTH(username) BETWEEN 3 AND 24),
  CONSTRAINT users_rating_range CHECK (rating >= 0 AND rating <= 5)
) ENGINE=InnoDB;

CREATE TABLE auth_sessions (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY auth_sessions_token_hash_unique (token_hash),
  KEY auth_sessions_user_id_idx (user_id),
  CONSTRAINT auth_sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_verification_tokens (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email_verification_tokens_hash_unique (token_hash),
  KEY email_verification_tokens_user_id_idx (user_id),
  CONSTRAINT email_verification_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY password_reset_tokens_hash_unique (token_hash),
  KEY password_reset_tokens_user_id_idx (user_id),
  CONSTRAINT password_reset_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description VARCHAR(500) NULL,
  image_url VARCHAR(2048) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_name_unique (name),
  UNIQUE KEY categories_slug_unique (slug),
  CONSTRAINT categories_slug_length CHECK (CHAR_LENGTH(slug) BETWEEN 2 AND 50)
) ENGINE=InnoDB;

CREATE TABLE products (
  id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  size VARCHAR(32) NOT NULL,
  brand VARCHAR(80) NULL,
  color VARCHAR(50) NULL,
  `condition` ENUM('new_with_tags', 'new_without_tags', 'very_good', 'good', 'satisfactory') NOT NULL,
  status ENUM('draft', 'active', 'reserved', 'sold', 'archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY products_seller_status_idx (seller_id, status),
  KEY products_category_status_idx (category_id, status),
  KEY products_active_published_at_idx (status, published_at),
  FULLTEXT KEY products_search_idx (title, description, brand),
  CONSTRAINT products_seller_fk FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT products_title_length CHECK (CHAR_LENGTH(title) BETWEEN 3 AND 120),
  CONSTRAINT products_description_length CHECK (CHAR_LENGTH(description) BETWEEN 10 AND 5000),
  CONSTRAINT products_price_range CHECK (price_cents BETWEEN 1 AND 100000000),
  CONSTRAINT products_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT products_active_requires_published_at CHECK (status <> 'active' OR published_at IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  storage_key VARCHAR(1024) NOT NULL,
  public_url VARCHAR(2048) NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY product_images_product_position_unique (product_id, position),
  UNIQUE KEY product_images_storage_key_unique (storage_key),
  CONSTRAINT product_images_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT product_images_position_range CHECK (position BETWEEN 1 AND 8)
) ENGINE=InnoDB;

CREATE TABLE product_shipping_methods (
  product_id CHAR(36) NOT NULL,
  shipping_method ENUM('standard', 'express', 'pickup') NOT NULL,
  PRIMARY KEY (product_id, shipping_method),
  CONSTRAINT product_shipping_methods_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE favorites (
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  KEY favorites_product_id_idx (product_id),
  CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT favorites_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE orders (
  id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  buyer_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  amount_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id VARCHAR(255) NULL,
  stripe_payment_intent_id VARCHAR(255) NULL,
  shipping_address JSON NULL,
  tracking_number VARCHAR(255) NULL,
  active_product_id CHAR(36) GENERATED ALWAYS AS (
    CASE WHEN status IN ('pending', 'paid', 'shipped', 'delivered') THEN product_id ELSE NULL END
  ) STORED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_one_open_order_per_product_unique (active_product_id),
  UNIQUE KEY orders_checkout_session_unique (stripe_checkout_session_id),
  UNIQUE KEY orders_payment_intent_unique (stripe_payment_intent_id),
  KEY orders_buyer_created_at_idx (buyer_id, created_at),
  KEY orders_seller_created_at_idx (seller_id, created_at),
  CONSTRAINT orders_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT orders_buyer_fk FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT orders_seller_fk FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT orders_buyer_not_seller CHECK (buyer_id <> seller_id),
  CONSTRAINT orders_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT orders_currency_uppercase CHECK (currency = UPPER(currency))
) ENGINE=InnoDB;

CREATE TABLE messages (
  id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  sender_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  body VARCHAR(2000) NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY messages_recipient_unread_idx (recipient_id, read_at, created_at),
  KEY messages_participants_created_at_idx (sender_id, recipient_id, created_at),
  CONSTRAINT messages_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT messages_recipient_fk FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_not_recipient CHECK (sender_id <> recipient_id),
  CONSTRAINT messages_body_length CHECK (CHAR_LENGTH(TRIM(body)) BETWEEN 1 AND 2000)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  reviewer_id CHAR(36) NOT NULL,
  reviewed_id CHAR(36) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY reviews_one_per_reviewer_order_unique (order_id, reviewer_id),
  KEY reviews_reviewed_id_idx (reviewed_id),
  CONSTRAINT reviews_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT reviews_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_reviewed_fk FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_reviewer_not_reviewed CHECK (reviewer_id <> reviewed_id),
  CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER orders_validate_before_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  DECLARE expected_seller_id CHAR(36);
  DECLARE expected_price_cents INT UNSIGNED;
  DECLARE expected_currency CHAR(3);
  DECLARE product_status VARCHAR(16);

  SELECT seller_id, price_cents, currency, status
  INTO expected_seller_id, expected_price_cents, expected_currency, product_status
  FROM products
  WHERE id = NEW.product_id;

  IF expected_seller_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found.';
  END IF;
  IF product_status <> 'active' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product is not available.';
  END IF;
  IF NEW.seller_id <> expected_seller_id OR NEW.buyer_id = expected_seller_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid buyer or seller for this product.';
  END IF;
  IF NEW.amount_cents <> expected_price_cents OR NEW.currency <> expected_currency THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order amount or currency does not match product.';
  END IF;
END$$

CREATE TRIGGER orders_reserve_product_after_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    UPDATE products SET status = 'reserved' WHERE id = NEW.product_id AND status = 'active';
  END IF;
END$$

CREATE TRIGGER messages_only_allow_read_receipt_update
BEFORE UPDATE ON messages
FOR EACH ROW
BEGIN
  IF NEW.sender_id <> OLD.sender_id
    OR NEW.recipient_id <> OLD.recipient_id
    OR NOT (NEW.product_id <=> OLD.product_id)
    OR NEW.body <> OLD.body
    OR NEW.created_at <> OLD.created_at THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Messages cannot be edited.';
  END IF;
END$$

CREATE TRIGGER reviews_validate_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
  DECLARE order_buyer_id CHAR(36);
  DECLARE order_seller_id CHAR(36);
  DECLARE order_status_value VARCHAR(16);

  SELECT buyer_id, seller_id, status
  INTO order_buyer_id, order_seller_id, order_status_value
  FROM orders
  WHERE id = NEW.order_id;

  IF order_buyer_id IS NULL OR order_status_value <> 'delivered' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reviews require a delivered order.';
  END IF;
  IF NOT ((NEW.reviewer_id = order_buyer_id AND NEW.reviewed_id = order_seller_id)
       OR (NEW.reviewer_id = order_seller_id AND NEW.reviewed_id = order_buyer_id)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Review participants do not match the order.';
  END IF;
END$$

CREATE TRIGGER reviews_keep_relationship_immutable
BEFORE UPDATE ON reviews
FOR EACH ROW
BEGIN
  IF NEW.order_id <> OLD.order_id
    OR NEW.reviewer_id <> OLD.reviewer_id
    OR NEW.reviewed_id <> OLD.reviewed_id
    OR NEW.created_at <> OLD.created_at THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A review cannot be moved to another order or user.';
  END IF;
END$$

CREATE TRIGGER reviews_rating_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE users
  SET rating = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews WHERE reviewed_id = NEW.reviewed_id),
      review_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE id = NEW.reviewed_id;
END$$

CREATE TRIGGER reviews_rating_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  UPDATE users
  SET rating = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews WHERE reviewed_id = NEW.reviewed_id),
      review_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE id = NEW.reviewed_id;
END$$

CREATE TRIGGER reviews_rating_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE users
  SET rating = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews WHERE reviewed_id = OLD.reviewed_id),
      review_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = OLD.reviewed_id)
  WHERE id = OLD.reviewed_id;
END$$

DELIMITER ;

INSERT INTO categories (id, name, slug, description, sort_order) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Donna', 'donna', 'Abbigliamento e accessori donna', 1),
  ('00000000-0000-4000-8000-000000000002', 'Uomo', 'uomo', 'Abbigliamento e accessori uomo', 2),
  ('00000000-0000-4000-8000-000000000003', 'Bambini', 'bambini', 'Moda per bambini e neonati', 3),
  ('00000000-0000-4000-8000-000000000004', 'Scarpe', 'scarpe', 'Scarpe, sneakers e stivali', 4),
  ('00000000-0000-4000-8000-000000000005', 'Accessori', 'accessori', 'Borse, gioielli e accessori', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  sort_order = VALUES(sort_order);
