SET @has_image_data := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Item'
    AND COLUMN_NAME = 'imageData'
);

SET @sql_image_data := IF(
  @has_image_data = 0,
  'ALTER TABLE `Item` ADD COLUMN `imageData` LONGBLOB NULL',
  'SELECT 1'
);

PREPARE stmt_image_data FROM @sql_image_data;
EXECUTE stmt_image_data;
DEALLOCATE PREPARE stmt_image_data;

SET @has_image_mime_type := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Item'
    AND COLUMN_NAME = 'imageMimeType'
);

SET @sql_image_mime_type := IF(
  @has_image_mime_type = 0,
  'ALTER TABLE `Item` ADD COLUMN `imageMimeType` VARCHAR(191) NULL',
  'SELECT 1'
);

PREPARE stmt_image_mime_type FROM @sql_image_mime_type;
EXECUTE stmt_image_mime_type;
DEALLOCATE PREPARE stmt_image_mime_type;
