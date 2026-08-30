/*
 Navicat Premium Dump SQL

 Source Server         : abc
 Source Server Type    : MySQL
 Source Server Version : 90600 (9.6.0)
 Source Host           : localhost:3306
 Source Schema         : testdb

 Target Server Type    : MySQL
 Target Server Version : 90600 (9.6.0)
 File Encoding         : 65001

 Date: 30/08/2026 18:30:48
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for email_verification_code
-- ----------------------------
DROP TABLE IF EXISTS `email_verification_code`;
CREATE TABLE `email_verification_code`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `purpose` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_email_code_lookup`(`email` ASC, `purpose` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 70 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of email_verification_code
-- ----------------------------
INSERT INTO `email_verification_code` VALUES (41, 'lczz0712@leeds.ac.uk', '626375', 'REGISTER', '2026-08-09 21:38:42', NULL, '2026-08-09 21:28:41');
INSERT INTO `email_verification_code` VALUES (64, 'pftd9999@leeds.ac.uk', '043208', 'REGISTER', '2026-08-17 21:11:15', NULL, '2026-08-17 21:01:15');
INSERT INTO `email_verification_code` VALUES (66, 'pprr0842@leeds.ac.uk', '028112', 'REGISTER', '2026-08-20 15:29:30', '2026-08-20 15:19:55', '2026-08-20 15:19:30');
INSERT INTO `email_verification_code` VALUES (67, 'pftd0755@leeds.ac.uk', '363728', 'REGISTER', '2026-08-26 00:41:46', '2026-08-26 00:32:07', '2026-08-26 00:31:45');
INSERT INTO `email_verification_code` VALUES (68, 'pftt0840@leeds.ac.uk', '787817', 'REGISTER', '2026-08-26 00:43:15', '2026-08-26 00:33:31', '2026-08-26 00:33:14');
INSERT INTO `email_verification_code` VALUES (69, 'prdl0410@leeds.ac.uk', '870493', 'REGISTER', '2026-08-26 21:49:36', NULL, '2026-08-26 21:39:35');

-- ----------------------------
-- Table structure for errand_order
-- ----------------------------
DROP TABLE IF EXISTS `errand_order`;
CREATE TABLE `errand_order`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `order_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `order_type` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `order_type_label` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `pickup_method` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `pickup_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `pickup_notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `delivery_method` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `delivery_pin` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delivery_proof_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `time_window_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `time_window_label` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `preferred_latest_time` datetime NULL DEFAULT NULL,
  `base_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `distance_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `urgency_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `complexity_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `tip_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `total_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status_label` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `delivery_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `runner_id` bigint NULL DEFAULT NULL,
  `photo_proof_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `photo_proof_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `cancel_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `cancelled_at` datetime NULL DEFAULT NULL,
  `customer_confirmed_at` datetime NULL DEFAULT NULL,
  `points_cost` int NOT NULL DEFAULT 0,
  `points_transferred_at` datetime NULL DEFAULT NULL,
  `weekly_card_discount_fee` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `review_comment` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reviewed_at` datetime NULL DEFAULT NULL,
  `runner_review_score` int NULL DEFAULT NULL,
  `appeal_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'NONE',
  `appeal_reason` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `appeal_resolution` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `appeal_created_at` datetime NULL DEFAULT NULL,
  `appeal_resolved_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_errand_order_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_errand_order_user_created`(`user_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_errand_order_runner_created`(`runner_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 69 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of errand_order
-- ----------------------------
INSERT INTO `errand_order` VALUES (35, 26, 'CE1786296917753', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'still water', 'PIN_IN_PERSON', '4232', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 1.00, 2.00, 0.00, 0.00, 6.00, 'DELIVERED', 'Delivered', '2026-08-09 18:35:17', '2026-08-30 18:26:38', 'Test', 3, NULL, NULL, NULL, NULL, '2026-08-30 18:26:39', 6, '2026-08-09 18:36:21', 0.00, 'good', '2026-08-18 22:54:15', 5, 'RESOLVED', 'Too slow.', 'Give you 5 points.', '2026-08-18 22:57:49', '2026-08-18 22:59:33');
INSERT INTO `errand_order` VALUES (48, 26, 'CE1787003185620', 'DELIVERY_DROPOFF_TASK', 'Item Pickup', 'CURRENT_LOCATION', 'Test', 'vape', 'LEAVE_AND_PHOTO', NULL, 'PHOTO_REQUIRED', 'WITHIN_ONE_HOUR', 'Within 1 hour', NULL, 3.00, 2.00, 1.00, 0.00, 0.00, 6.00, 'ACCEPTED', 'Accepted', '2026-08-17 22:46:25', '2026-08-30 18:26:54', 'Test', 3, NULL, NULL, NULL, NULL, NULL, 6, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (49, 26, 'CE1787003193847', 'DELIVERY_DROPOFF_TASK', 'Item Pickup', 'CURRENT_LOCATION', 'Test', 'vape', 'PIN_IN_PERSON', '5001', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 5.00, 12.00, 'ACCEPTED', 'Accepted', '2026-08-17 22:46:33', '2026-08-30 18:26:25', 'Test', 3, NULL, NULL, NULL, NULL, NULL, 12, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (52, 3, 'CE1787071974549', 'COLLECTION_TASK', 'Item Pickup', 'CURRENT_LOCATION', 'Test', 'cola', 'PIN_IN_PERSON', '4554', 'PIN_VERIFIED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'DELIVERED', 'Delivered', '2026-08-18 17:52:54', '2026-08-26 22:51:53', 'Test', 26, NULL, NULL, NULL, NULL, '2026-08-26 21:55:27', 7, '2026-08-26 21:55:27', 0.00, NULL, NULL, NULL, 'OPEN', 'Too slow.', NULL, '2026-08-26 22:51:53', NULL);
INSERT INTO `errand_order` VALUES (58, 26, 'CE1787405091803', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'bread', 'PIN_IN_PERSON', '6493', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'PICKED_UP', 'Picked Up', '2026-08-22 14:24:51', '2026-08-30 18:25:59', 'Test', 47, NULL, NULL, NULL, NULL, NULL, 7, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (59, 46, 'CE1787701393100', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'bread', 'LEAVE_AND_PHOTO', NULL, 'PHOTO_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 2.00, 7.00, 'PICKED_UP', 'Picked Up', '2026-08-26 00:43:13', '2026-08-26 00:57:59', 'Test', 47, NULL, NULL, NULL, NULL, NULL, 7, NULL, 2.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (60, 47, 'CE1787701498654', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'bread', 'PIN_IN_PERSON', '5004', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'DELIVERED', 'Delivered', '2026-08-26 00:44:58', '2026-08-26 00:58:20', 'Test', 47, NULL, NULL, NULL, NULL, '2026-08-26 00:58:20', 7, '2026-08-26 00:45:09', 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (62, 46, 'CE1787777120717', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'PIN_IN_PERSON', '6325', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'ACCEPTED', 'Accepted', '2026-08-26 21:45:20', '2026-08-26 22:03:43', 'Test', 3, NULL, NULL, NULL, NULL, NULL, 7, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (63, 46, 'CE1787778110468', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'PIN_IN_PERSON', '5126', 'PIN_VERIFIED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 5.00, 'DELIVERED', 'Delivered', '2026-08-26 22:01:50', '2026-08-26 22:08:59', 'Test', 3, NULL, NULL, NULL, NULL, '2026-08-26 22:08:59', 5, '2026-08-26 22:08:59', 2.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (64, 46, 'CE1787779021894', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'LEAVE_AND_PHOTO', NULL, 'CUSTOMER_CONFIRMED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 5.00, 'DELIVERED', 'Delivered', '2026-08-26 22:17:01', '2026-08-26 22:27:19', 'Test', 3, '/uploads/photo-proofs/CE1787779021894-14ef3f8f-a0a3-4be7-b61b-ee0a08c073ce.jpg', NULL, NULL, NULL, '2026-08-26 22:18:49', 5, '2026-08-26 22:18:49', 2.00, 'good.', '2026-08-26 22:27:19', 5, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (65, 26, 'CE1787780289377', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'PIN_IN_PERSON', '6361', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'CANCELLED_BY_CUSTOMER', 'Cancelled by Customer', '2026-08-26 22:38:09', '2026-08-26 22:39:12', 'Test', NULL, NULL, NULL, 'No reason.', '2026-08-26 22:39:12', NULL, 7, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (66, 26, 'CE1787780383250', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'PIN_IN_PERSON', '0432', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'PICKED_UP', 'Picked Up', '2026-08-26 22:39:43', '2026-08-26 22:41:03', 'Test', 3, NULL, NULL, NULL, NULL, NULL, 7, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (67, 26, 'CE1787780449732', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'PIN_IN_PERSON', '9302', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'PICKED_UP', 'Picked Up', '2026-08-26 22:40:49', '2026-08-26 22:41:01', 'Test', 3, NULL, NULL, NULL, NULL, NULL, 7, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);
INSERT INTO `errand_order` VALUES (68, 26, 'CE1787780490584', 'COLLECTION_TASK', 'Parcel Collect', 'CURRENT_LOCATION', 'Test', 'Test', 'PIN_IN_PERSON', '4730', 'PIN_REQUIRED', 'ASAP', 'ASAP', NULL, 3.00, 2.00, 2.00, 0.00, 0.00, 7.00, 'CANCELLED_BY_CUSTOMER', 'Cancelled by Customer', '2026-08-26 22:41:30', '2026-08-26 22:41:51', 'Test', NULL, NULL, NULL, 'No reason.', '2026-08-26 22:41:51', NULL, 7, NULL, 0.00, NULL, NULL, NULL, 'NONE', NULL, NULL, NULL, NULL);

-- ----------------------------
-- Table structure for point_transaction
-- ----------------------------
DROP TABLE IF EXISTS `point_transaction`;
CREATE TABLE `point_transaction`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `change_amount` int NOT NULL,
  `balance_after` int NOT NULL,
  `transaction_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `order_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_point_transaction_user_created`(`user_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_point_transaction_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 195 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of point_transaction
-- ----------------------------
INSERT INTO `point_transaction` VALUES (1, 3, 149, 149, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NULL, '2026-07-08 19:51:23');
INSERT INTO `point_transaction` VALUES (3, 11, 999, 999, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NULL, '2026-07-08 19:51:23');
INSERT INTO `point_transaction` VALUES (10, 3, 25, 174, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-09 14:37:49');
INSERT INTO `point_transaction` VALUES (12, 3, 25, 199, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-09 14:44:52');
INSERT INTO `point_transaction` VALUES (18, 3, 25, 224, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-09 23:01:05');
INSERT INTO `point_transaction` VALUES (21, 3, -2, 222, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-07-09 23:07:31');
INSERT INTO `point_transaction` VALUES (23, 3, -2, 220, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-07-09 23:14:01');
INSERT INTO `point_transaction` VALUES (24, 3, 6, 226, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1783634692635.', 'CE1783634692635', '2026-07-09 23:15:10');
INSERT INTO `point_transaction` VALUES (29, 3, 4, 230, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1783636294202.', 'CE1783636294202', '2026-07-09 23:34:49');
INSERT INTO `point_transaction` VALUES (30, 3, 25, 255, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-21 00:20:11');
INSERT INTO `point_transaction` VALUES (33, 3, 6, 261, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1784589799687.', 'CE1784589799687', '2026-07-21 00:27:01');
INSERT INTO `point_transaction` VALUES (37, 3, 25, 286, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-21 23:59:29');
INSERT INTO `point_transaction` VALUES (40, 3, 6, 292, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1784675033388.', 'CE1784675033388', '2026-07-22 00:05:37');
INSERT INTO `point_transaction` VALUES (43, 3, 25, 317, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-22 10:42:36');
INSERT INTO `point_transaction` VALUES (46, 3, 6, 323, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1784713531122.', 'CE1784713531122', '2026-07-22 10:48:07');
INSERT INTO `point_transaction` VALUES (48, 3, -223, 100, 'ADMIN_ADJUSTMENT', 'Points adjusted by administrator.', NULL, '2026-07-22 13:07:10');
INSERT INTO `point_transaction` VALUES (49, 3, 25, 125, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-07-22 14:29:16');
INSERT INTO `point_transaction` VALUES (52, 3, -25, 100, 'ADMIN_ADJUSTMENT', 'Points adjusted by administrator.', NULL, '2026-07-22 14:34:45');
INSERT INTO `point_transaction` VALUES (57, 3, 6, 106, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1785173454982.', 'CE1785173454982', '2026-07-27 18:34:40');
INSERT INTO `point_transaction` VALUES (59, 3, -6, 100, 'ORDER_PAYMENT', 'Points deducted for order CE1785931214748.', 'CE1785931214748', '2026-08-05 13:00:14');
INSERT INTO `point_transaction` VALUES (61, 3, 6, 106, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1785931268543.', 'CE1785931268543', '2026-08-05 13:06:02');
INSERT INTO `point_transaction` VALUES (62, 3, 25, 131, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-08-05 13:27:06');
INSERT INTO `point_transaction` VALUES (70, 26, 68, 68, 'ADMIN_INITIAL_POINTS', 'Initial points set by administrator.', NULL, '2026-08-09 18:24:23');
INSERT INTO `point_transaction` VALUES (71, 26, 68, 68, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NULL, '2026-08-09 18:30:42');
INSERT INTO `point_transaction` VALUES (72, 26, -6, 62, 'ORDER_PAYMENT', 'Points deducted for order CE1786296917753.', 'CE1786296917753', '2026-08-09 18:35:17');
INSERT INTO `point_transaction` VALUES (73, 3, 6, 149, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1786296917753.', 'CE1786296917753', '2026-08-09 18:36:21');
INSERT INTO `point_transaction` VALUES (147, 26, -6, 56, 'ORDER_PAYMENT', 'Points deducted for order CE1787003185620.', 'CE1787003185620', '2026-08-17 22:46:25');
INSERT INTO `point_transaction` VALUES (148, 26, -12, 44, 'ORDER_PAYMENT', 'Points deducted for order CE1787003193847.', 'CE1787003193847', '2026-08-17 22:46:33');
INSERT INTO `point_transaction` VALUES (149, 26, -9, 35, 'ORDER_PAYMENT', 'Points deducted for order CE1787003239205.', 'CE1787003239205', '2026-08-17 22:47:19');
INSERT INTO `point_transaction` VALUES (150, 3, -7, 170, 'ORDER_PAYMENT', 'Points deducted for order CE1787071274476.', 'CE1787071274476', '2026-08-18 17:41:14');
INSERT INTO `point_transaction` VALUES (151, 3, -7, 163, 'ORDER_PAYMENT', 'Points deducted for order CE1787071974549.', 'CE1787071974549', '2026-08-18 17:52:54');
INSERT INTO `point_transaction` VALUES (152, 3, -162, 1, 'ADMIN_ADJUSTMENT', 'Points adjusted by administrator.', NULL, '2026-08-18 17:59:28');
INSERT INTO `point_transaction` VALUES (161, 3, 25, 33, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-08-20 15:19:55');
INSERT INTO `point_transaction` VALUES (162, 45, 20, 20, 'STARTER_POINTS', 'Starter points for a new account.', NULL, '2026-08-20 15:19:55');
INSERT INTO `point_transaction` VALUES (163, 45, 20, 20, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NULL, '2026-08-20 15:26:58');
INSERT INTO `point_transaction` VALUES (164, 26, -7, 35, 'ORDER_PAYMENT', 'Points deducted for order CE1787405091803.', 'CE1787405091803', '2026-08-22 14:24:51');
INSERT INTO `point_transaction` VALUES (165, 26, -2, 33, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-08-25 23:53:49');
INSERT INTO `point_transaction` VALUES (166, 26, -2, 31, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-08-25 23:53:53');
INSERT INTO `point_transaction` VALUES (167, 26, -2, 29, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-08-25 23:53:58');
INSERT INTO `point_transaction` VALUES (168, 26, -2, 27, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-08-25 23:54:02');
INSERT INTO `point_transaction` VALUES (169, 46, 20, 20, 'STARTER_POINTS', 'Starter points for a new account.', NULL, '2026-08-26 00:32:07');
INSERT INTO `point_transaction` VALUES (170, 46, 25, 45, 'INVITE_REWARD', 'Invite reward for a successful registration.', NULL, '2026-08-26 00:33:31');
INSERT INTO `point_transaction` VALUES (171, 47, 20, 20, 'STARTER_POINTS', 'Starter points for a new account.', NULL, '2026-08-26 00:33:31');
INSERT INTO `point_transaction` VALUES (172, 46, -10, 35, 'WEEKLY_CARD', 'Opened weekly card for 7 days.', NULL, '2026-08-26 00:33:46');
INSERT INTO `point_transaction` VALUES (173, 46, -7, 28, 'ORDER_PAYMENT', 'Points deducted for order CE1787701393100.', 'CE1787701393100', '2026-08-26 00:43:13');
INSERT INTO `point_transaction` VALUES (174, 47, -7, 13, 'ORDER_PAYMENT', 'Points deducted for order CE1787701498654.', 'CE1787701498654', '2026-08-26 00:44:58');
INSERT INTO `point_transaction` VALUES (175, 46, 7, 35, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1787701498654.', 'CE1787701498654', '2026-08-26 00:45:09');
INSERT INTO `point_transaction` VALUES (176, 47, -7, 6, 'ORDER_PAYMENT', 'Points deducted for order CE1787701930441.', 'CE1787701930441', '2026-08-26 00:52:10');
INSERT INTO `point_transaction` VALUES (177, 46, 35, 35, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NULL, '2026-08-26 21:38:58');
INSERT INTO `point_transaction` VALUES (178, 47, 6, 6, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NULL, '2026-08-26 21:38:58');
INSERT INTO `point_transaction` VALUES (180, 3, -7, 26, 'ORDER_PAYMENT', 'Points deducted for order CE1787777120717.', 'CE1787777120717', '2026-08-26 21:45:20');
INSERT INTO `point_transaction` VALUES (181, 3, -26, 0, 'ADMIN_ADJUSTMENT', 'Points adjusted by administrator.', NULL, '2026-08-26 21:50:36');
INSERT INTO `point_transaction` VALUES (182, 26, 7, 34, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1787071974549.', 'CE1787071974549', '2026-08-26 21:55:27');
INSERT INTO `point_transaction` VALUES (183, 46, -5, 30, 'ORDER_PAYMENT', 'Points deducted for order CE1787778110468.', 'CE1787778110468', '2026-08-26 22:01:50');
INSERT INTO `point_transaction` VALUES (184, 3, 5, 5, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1787778110468.', 'CE1787778110468', '2026-08-26 22:08:59');
INSERT INTO `point_transaction` VALUES (185, 46, -5, 25, 'ORDER_PAYMENT', 'Points deducted for order CE1787779021894.', 'CE1787779021894', '2026-08-26 22:17:01');
INSERT INTO `point_transaction` VALUES (186, 3, 5, 10, 'RUNNER_SETTLEMENT', 'Runner settlement for completed order CE1787779021894.', 'CE1787779021894', '2026-08-26 22:18:49');
INSERT INTO `point_transaction` VALUES (187, 26, -7, 27, 'ORDER_PAYMENT', 'Points deducted for order CE1787780289377.', 'CE1787780289377', '2026-08-26 22:38:09');
INSERT INTO `point_transaction` VALUES (188, 26, 7, 34, 'ORDER_REFUND', 'Refund for cancelled order CE1787780289377.', 'CE1787780289377', '2026-08-26 22:39:12');
INSERT INTO `point_transaction` VALUES (189, 26, -7, 27, 'ORDER_PAYMENT', 'Points deducted for order CE1787780383250.', 'CE1787780383250', '2026-08-26 22:39:43');
INSERT INTO `point_transaction` VALUES (190, 3, -2, 8, 'GIVE_UP_PENALTY', 'Penalty for giving up an accepted order.', NULL, '2026-08-26 22:40:15');
INSERT INTO `point_transaction` VALUES (191, 26, -7, 20, 'ORDER_PAYMENT', 'Points deducted for order CE1787780449732.', 'CE1787780449732', '2026-08-26 22:40:49');
INSERT INTO `point_transaction` VALUES (192, 26, -7, 13, 'ORDER_PAYMENT', 'Points deducted for order CE1787780490584.', 'CE1787780490584', '2026-08-26 22:41:30');
INSERT INTO `point_transaction` VALUES (193, 26, -1, 12, 'CANCEL_PENALTY', 'Penalty for cancelling an accepted order.', 'CE1787780490584', '2026-08-26 22:41:51');
INSERT INTO `point_transaction` VALUES (194, 26, 7, 19, 'ORDER_REFUND', 'Refund for cancelled order CE1787780490584.', 'CE1787780490584', '2026-08-26 22:41:51');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user',
  `email` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `common_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `detail_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `points` int NOT NULL DEFAULT 0,
  `invite_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `referred_by_user_id` bigint NULL DEFAULT NULL,
  `last_weekly_claim_at` datetime NULL DEFAULT NULL,
  `starter_points_granted` tinyint(1) NOT NULL DEFAULT 0,
  `weekly_card_expires_at` datetime NULL DEFAULT NULL,
  `runner_application_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'NONE',
  `runner_application_requested_at` datetime NULL DEFAULT NULL,
  `runner_application_reviewed_at` datetime NULL DEFAULT NULL,
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `ban_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `banned_at` datetime NULL DEFAULT NULL,
  `cancellation_count` int NOT NULL DEFAULT 0,
  `runner_give_up_count` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `idx_user_invite_code`(`invite_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (3, 'Xinyi Wang', '123456', 'Test', 'RUNNER', 'pftd0810@leeds.ac.uk', 1, '2026-03-17 00:40:52', '2026-08-30 18:27:39', NULL, NULL, 8, 'XINYI6849', NULL, NULL, 1, '2026-07-15 18:39:59', 'APPROVED', '2026-08-18 22:02:30', '2026-08-30 18:27:40', 0, NULL, NULL, 0, 2);
INSERT INTO `user` VALUES (11, 'Admin', '123456', '00000000000', 'ADMIN', 'admin@leeds.ac.uk', 1, '2026-06-09 16:26:02', '2026-08-15 16:09:19', NULL, NULL, 999, 'ADMIN0001', NULL, NULL, 1, NULL, 'NONE', NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO `user` VALUES (26, 'Elena', '123456', 'Test', 'RUNNER', 'pftd0811@leeds.ac.uk', 1, '2026-08-09 18:24:23', '2026-08-30 18:28:29', NULL, NULL, 19, 'ZHANG8015', NULL, NULL, 1, NULL, 'APPROVED', '2026-08-26 21:55:36', '2026-08-30 18:28:09', 0, NULL, NULL, 0, 0);
INSERT INTO `user` VALUES (45, 'San Zhang', '123456', 'Test', 'user', 'pprr0842@leeds.ac.uk', 1, '2026-08-20 15:19:55', '2026-08-30 18:28:03', NULL, NULL, 20, 'SANZH2259', 3, NULL, 1, NULL, 'NONE', NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO `user` VALUES (46, 'Clara', '123456', 'Test', 'RUNNER', 'pftd0755@leeds.ac.uk', 1, '2026-08-26 00:32:07', '2026-08-30 18:27:57', NULL, NULL, 25, 'CLARA8436', NULL, NULL, 1, '2026-09-02 00:33:46', 'APPROVED', '2026-08-26 00:44:35', '2026-08-30 18:27:58', 0, NULL, NULL, 0, 0);
INSERT INTO `user` VALUES (47, 'Stella', '123456', 'Test', 'RUNNER', 'pftt0840@leeds.ac.uk', 1, '2026-08-26 00:33:31', '2026-08-30 18:27:52', NULL, NULL, 6, 'STELL6637', 46, NULL, 1, NULL, 'APPROVED', '2026-08-26 00:59:27', '2026-08-30 18:27:53', 0, NULL, NULL, 0, 0);

-- ----------------------------
-- Table structure for user_session
-- ----------------------------
DROP TABLE IF EXISTS `user_session`;
CREATE TABLE `user_session`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_session_token`(`token` ASC) USING BTREE,
  INDEX `fk_session_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 181 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_session
-- ----------------------------
INSERT INTO `user_session` VALUES (166, 45, 'ad2494f1eb5b49db882e253a40fe9199', '2026-08-21 15:19:56', '2026-08-20 15:19:55');
INSERT INTO `user_session` VALUES (174, 47, '18665f81629c4572a26a459e023663be', '2026-08-27 00:33:32', '2026-08-26 00:33:31');
INSERT INTO `user_session` VALUES (176, 3, '58ea36a1705f4adba22da03292bb077d', '2026-08-27 21:45:06', '2026-08-26 21:45:05');
INSERT INTO `user_session` VALUES (177, 26, 'c45e1d72af1e4152b6cb07544ffa9d26', '2026-08-27 21:46:22', '2026-08-26 21:46:21');
INSERT INTO `user_session` VALUES (179, 46, '0437130bc49c4ec6b793a0bfe221ae97', '2026-08-27 22:01:46', '2026-08-26 22:01:45');
INSERT INTO `user_session` VALUES (180, 11, '89da2fc9f1cc4262ab60b0809384805f', '2026-08-31 18:25:29', '2026-08-30 18:25:29');

SET FOREIGN_KEY_CHECKS = 1;
