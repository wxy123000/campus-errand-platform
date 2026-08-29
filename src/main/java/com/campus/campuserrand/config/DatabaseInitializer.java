package com.campus.campuserrand.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Component
public class DatabaseInitializer {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initialize() {
        ensureUserTable();
        ensureVerificationCodeTable();
        ensureSessionTable();
        ensureOrderTable();
        ensurePointTransactionTable();
    }

    private void ensureUserTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS `user` (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50),
                    password VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    role VARCHAR(20),
                    email VARCHAR(120),
                    verified TINYINT(1) NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
                """);

        addColumnIfMissing("user", "email", "ALTER TABLE `user` ADD COLUMN email VARCHAR(120)");
        addColumnIfMissing("user", "verified", "ALTER TABLE `user` ADD COLUMN verified TINYINT(1) NOT NULL DEFAULT 0");
        addColumnIfMissing("user", "common_address", "ALTER TABLE `user` ADD COLUMN common_address VARCHAR(255)");
        addColumnIfMissing("user", "detail_address", "ALTER TABLE `user` ADD COLUMN detail_address VARCHAR(255)");
        addColumnIfMissing("user", "points", "ALTER TABLE `user` ADD COLUMN points INT NOT NULL DEFAULT 0");
        addColumnIfMissing("user", "starter_points_granted", "ALTER TABLE `user` ADD COLUMN starter_points_granted TINYINT(1) NOT NULL DEFAULT 0");
        addColumnIfMissing("user", "last_weekly_claim_at", "ALTER TABLE `user` ADD COLUMN last_weekly_claim_at DATETIME NULL");
        addColumnIfMissing("user", "weekly_card_expires_at", "ALTER TABLE `user` ADD COLUMN weekly_card_expires_at DATETIME NULL");
        addColumnIfMissing("user", "invite_code", "ALTER TABLE `user` ADD COLUMN invite_code VARCHAR(30)");
        addColumnIfMissing("user", "referred_by_user_id", "ALTER TABLE `user` ADD COLUMN referred_by_user_id BIGINT");
        addColumnIfMissing("user", "runner_application_status", "ALTER TABLE `user` ADD COLUMN runner_application_status VARCHAR(30) NOT NULL DEFAULT 'NONE'");
        addColumnIfMissing("user", "runner_application_requested_at", "ALTER TABLE `user` ADD COLUMN runner_application_requested_at DATETIME NULL");
        addColumnIfMissing("user", "runner_application_reviewed_at", "ALTER TABLE `user` ADD COLUMN runner_application_reviewed_at DATETIME NULL");
        addColumnIfMissing("user", "banned", "ALTER TABLE `user` ADD COLUMN banned TINYINT(1) NOT NULL DEFAULT 0");
        addColumnIfMissing("user", "ban_reason", "ALTER TABLE `user` ADD COLUMN ban_reason VARCHAR(255) NULL");
        addColumnIfMissing("user", "banned_at", "ALTER TABLE `user` ADD COLUMN banned_at DATETIME NULL");
        addColumnIfMissing("user", "cancellation_count", "ALTER TABLE `user` ADD COLUMN cancellation_count INT NOT NULL DEFAULT 0");
        addColumnIfMissing("user", "runner_give_up_count", "ALTER TABLE `user` ADD COLUMN runner_give_up_count INT NOT NULL DEFAULT 0");
        addColumnIfMissing("user", "created_at", "ALTER TABLE `user` ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        addColumnIfMissing("user", "updated_at", "ALTER TABLE `user` ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        jdbcTemplate.execute("""
                UPDATE `user`
                SET runner_application_status = 'APPROVED'
                WHERE UPPER(role) = 'RUNNER'
                  AND (runner_application_status IS NULL OR runner_application_status = 'NONE')
                """);

        createIndexIfMissing("user", "idx_user_email", "CREATE UNIQUE INDEX idx_user_email ON `user` (email)");
        createIndexIfMissing("user", "idx_user_invite_code", "CREATE UNIQUE INDEX idx_user_invite_code ON `user` (invite_code)");
    }

    private void ensureVerificationCodeTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS email_verification_code (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    email VARCHAR(120) NOT NULL,
                    code VARCHAR(6) NOT NULL,
                    purpose VARCHAR(30) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    used_at DATETIME NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
        createIndexIfMissing(
                "email_verification_code",
                "idx_email_code_lookup",
                "CREATE INDEX idx_email_code_lookup ON email_verification_code (email, purpose, created_at)"
        );
    }

    private void ensureSessionTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS user_session (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    token VARCHAR(80) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
                )
                """);
        createIndexIfMissing(
                "user_session",
                "idx_user_session_token",
                "CREATE UNIQUE INDEX idx_user_session_token ON user_session (token)"
        );
    }

    private void ensureOrderTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS errand_order (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    runner_id BIGINT NULL,
                    order_no VARCHAR(40) NOT NULL,
                    order_type VARCHAR(60) NOT NULL,
                    order_type_label VARCHAR(120) NOT NULL,
                    pickup_method VARCHAR(40) NOT NULL,
                    pickup_location VARCHAR(255) NOT NULL,
                    pickup_notes VARCHAR(500) NOT NULL,
                    delivery_location VARCHAR(255) NOT NULL,
                    delivery_method VARCHAR(40) NOT NULL,
                    delivery_pin VARCHAR(10),
                    delivery_proof_status VARCHAR(40) NOT NULL,
                    photo_proof_url VARCHAR(255) NULL,
                    photo_proof_note VARCHAR(500) NULL,
                    time_window_type VARCHAR(40) NOT NULL,
                    time_window_label VARCHAR(120) NOT NULL,
                    preferred_latest_time DATETIME NULL,
                    base_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    distance_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    urgency_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    tip_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    weekly_card_discount_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    total_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    points_cost INT NOT NULL DEFAULT 0,
                    status VARCHAR(30) NOT NULL,
                    status_label VARCHAR(40) NOT NULL,
                    cancel_reason VARCHAR(255) NULL,
                    cancelled_at DATETIME NULL,
                    customer_confirmed_at DATETIME NULL,
                    points_transferred_at DATETIME NULL,
                    runner_review_score INT NULL,
                    review_comment VARCHAR(1000) NULL,
                    reviewed_at DATETIME NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
                )
                """);

        addColumnIfMissing("errand_order", "delivery_location", "ALTER TABLE errand_order ADD COLUMN delivery_location VARCHAR(255) NOT NULL DEFAULT ''");
        addColumnIfMissing("errand_order", "runner_id", "ALTER TABLE errand_order ADD COLUMN runner_id BIGINT NULL");
        addColumnIfMissing("errand_order", "photo_proof_url", "ALTER TABLE errand_order ADD COLUMN photo_proof_url VARCHAR(255) NULL");
        addColumnIfMissing("errand_order", "photo_proof_note", "ALTER TABLE errand_order ADD COLUMN photo_proof_note VARCHAR(500) NULL");
        addColumnIfMissing("errand_order", "cancel_reason", "ALTER TABLE errand_order ADD COLUMN cancel_reason VARCHAR(255) NULL");
        addColumnIfMissing("errand_order", "cancelled_at", "ALTER TABLE errand_order ADD COLUMN cancelled_at DATETIME NULL");
        addColumnIfMissing("errand_order", "customer_confirmed_at", "ALTER TABLE errand_order ADD COLUMN customer_confirmed_at DATETIME NULL");
        addColumnIfMissing("errand_order", "points_cost", "ALTER TABLE errand_order ADD COLUMN points_cost INT NOT NULL DEFAULT 0");
        addColumnIfMissing("errand_order", "weekly_card_discount_fee", "ALTER TABLE errand_order ADD COLUMN weekly_card_discount_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00");
        addColumnIfMissing("errand_order", "points_transferred_at", "ALTER TABLE errand_order ADD COLUMN points_transferred_at DATETIME NULL");
        addColumnIfMissing("errand_order", "runner_review_score", "ALTER TABLE errand_order ADD COLUMN runner_review_score INT NULL");
        addColumnIfMissing("errand_order", "review_comment", "ALTER TABLE errand_order ADD COLUMN review_comment VARCHAR(1000) NULL");
        addColumnIfMissing("errand_order", "reviewed_at", "ALTER TABLE errand_order ADD COLUMN reviewed_at DATETIME NULL");
        addColumnIfMissing("errand_order", "appeal_status", "ALTER TABLE errand_order ADD COLUMN appeal_status VARCHAR(30) NOT NULL DEFAULT 'NONE'");
        addColumnIfMissing("errand_order", "appeal_reason", "ALTER TABLE errand_order ADD COLUMN appeal_reason VARCHAR(1000) NULL");
        addColumnIfMissing("errand_order", "appeal_resolution", "ALTER TABLE errand_order ADD COLUMN appeal_resolution VARCHAR(1000) NULL");
        addColumnIfMissing("errand_order", "appeal_created_at", "ALTER TABLE errand_order ADD COLUMN appeal_created_at DATETIME NULL");
        addColumnIfMissing("errand_order", "appeal_resolved_at", "ALTER TABLE errand_order ADD COLUMN appeal_resolved_at DATETIME NULL");

        createIndexIfMissing(
                "errand_order",
                "idx_errand_order_user_created",
                "CREATE INDEX idx_errand_order_user_created ON errand_order (user_id, created_at)"
        );
        createIndexIfMissing(
                "errand_order",
                "idx_errand_order_runner_created",
                "CREATE INDEX idx_errand_order_runner_created ON errand_order (runner_id, created_at)"
        );
        createIndexIfMissing(
                "errand_order",
                "idx_errand_order_order_no",
                "CREATE UNIQUE INDEX idx_errand_order_order_no ON errand_order (order_no)"
        );
    }

    private void ensurePointTransactionTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS point_transaction (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    change_amount INT NOT NULL,
                    balance_after INT NOT NULL,
                    transaction_type VARCHAR(40) NOT NULL,
                    description VARCHAR(255) NOT NULL,
                    order_no VARCHAR(40) NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_point_transaction_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
                )
                """);
        createIndexIfMissing(
                "point_transaction",
                "idx_point_transaction_user_created",
                "CREATE INDEX idx_point_transaction_user_created ON point_transaction (user_id, created_at)"
        );
        jdbcTemplate.execute("""
                INSERT INTO point_transaction (user_id, change_amount, balance_after, transaction_type, description, created_at)
                SELECT id, points, points, 'OPENING_BALANCE', 'Opening balance before point history was enabled.', NOW()
                FROM `user` u
                WHERE points > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM point_transaction pt
                      WHERE pt.user_id = u.id AND pt.transaction_type = 'OPENING_BALANCE'
                  )
                """);
    }

    private void addColumnIfMissing(String tableName, String columnName, String ddl) {
        List<String> matches = jdbcTemplate.queryForList(
                """
                SELECT COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                """,
                String.class,
                tableName,
                columnName
        );
        if (matches.isEmpty()) {
            jdbcTemplate.execute(ddl);
        }
    }

    private void createIndexIfMissing(String tableName, String indexName, String ddl) {
        List<String> matches = jdbcTemplate.queryForList(
                """
                SELECT INDEX_NAME
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
                """,
                String.class,
                tableName,
                indexName
        );
        if (matches.isEmpty()) {
            jdbcTemplate.execute(ddl);
        }
    }
}
