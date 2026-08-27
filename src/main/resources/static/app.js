const authStoreKey = "campus-errand-auth";

function openAppDialog({ title = "Notice", message, type = "alert", confirmText, cancelText = "Cancel", multiline = false }) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "app-dialog";
        overlay.style.cssText = "position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:rgba(20,33,61,.42);backdrop-filter:blur(8px);";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const card = document.createElement("div");
        card.className = "app-dialog-card";
        card.style.cssText = "position:relative;width:min(520px,100%);max-height:calc(100vh - 48px);overflow:auto;padding:30px;border:1px solid rgba(20,33,61,.1);border-radius:24px;background:rgba(255,252,246,.99);box-shadow:0 30px 90px rgba(20,33,61,.28);box-sizing:border-box;";
        card.innerHTML = `
            <div class="app-dialog-heading">
                <span class="app-dialog-kicker">Campus Errand</span>
                <h2></h2>
            </div>
            <p class="app-dialog-message"></p>
            <div class="app-dialog-input-wrap"></div>
            <div class="app-dialog-actions"></div>
        `;
        overlay.append(card);
        card.querySelector("h2").textContent = title;
        card.querySelector(".app-dialog-message").textContent = message;

        const inputWrap = card.querySelector(".app-dialog-input-wrap");
        let input = null;
        if (type === "prompt") {
            input = document.createElement(multiline ? "textarea" : "input");
            input.className = "app-dialog-input";
            input.setAttribute("aria-label", message);
            if (multiline) {
                input.rows = 4;
            } else {
                input.type = "text";
            }
            inputWrap.append(input);
        } else {
            inputWrap.remove();
        }

        const actions = card.querySelector(".app-dialog-actions");
        let settled = false;
        const close = (value) => {
            if (settled) return;
            settled = true;
            document.removeEventListener("keydown", handleKeydown);
            overlay.remove();
            document.body.classList.remove("app-dialog-open");
            resolve(value);
        };
        const handleKeydown = (event) => {
            if (event.key === "Escape") close(type === "confirm" ? false : null);
            if (event.key === "Enter" && !multiline) close(type === "prompt" ? input.value : true);
        };

        if (type !== "alert") {
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.className = "app-dialog-btn app-dialog-btn-secondary";
            cancelButton.textContent = cancelText;
            cancelButton.addEventListener("click", () => close(type === "confirm" ? false : null));
            actions.append(cancelButton);
        }

        const confirmButton = document.createElement("button");
        confirmButton.type = "button";
        confirmButton.className = "app-dialog-btn app-dialog-btn-primary";
        confirmButton.textContent = confirmText || (type === "alert" ? "OK" : "Confirm");
        confirmButton.addEventListener("click", () => close(type === "prompt" ? input.value : true));
        actions.append(confirmButton);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay && type !== "alert") close(type === "confirm" ? false : null);
        });
        document.addEventListener("keydown", handleKeydown);
        document.body.append(overlay);
        document.body.classList.add("app-dialog-open");
        requestAnimationFrame(() => (input || confirmButton).focus());
    });
}

const appPrompt = (message, options = {}) => openAppDialog({ ...options, message, type: "prompt" });
const appConfirm = (message, options = {}) => openAppDialog({ ...options, message, type: "confirm" });
const appAlert = (message, options = {}) => openAppDialog({ ...options, message, type: "alert" });

function openPhotoProofDialog() {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "app-dialog";
        overlay.style.cssText = "position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:rgba(20,33,61,.42);backdrop-filter:blur(8px);";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.innerHTML = `
            <div class="app-dialog-card photo-proof-dialog-card" style="position:relative;width:min(560px,100%);max-height:calc(100vh - 48px);overflow:auto;padding:30px;border:1px solid rgba(20,33,61,.1);border-radius:24px;background:rgba(255,252,246,.99);box-shadow:0 30px 90px rgba(20,33,61,.28);box-sizing:border-box;">
                <div class="app-dialog-heading">
                    <span class="app-dialog-kicker">Campus Errand</span>
                    <h2>Upload Delivery Photo</h2>
                </div>
                <p class="app-dialog-message">Upload a clear photo showing where the order was left.</p>
                <label class="photo-proof-file-label">
                    <span>Select photo</span>
                    <span class="photo-proof-picker">
                        <input id="photo-proof-file" class="photo-proof-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
                        <span class="photo-proof-choose-btn">Choose File</span>
                        <span class="photo-proof-picker-name">No file chosen</span>
                    </span>
                </label>
                <div class="photo-proof-preview" hidden>
                    <img alt="Delivery proof preview">
                    <span class="photo-proof-file-name"></span>
                </div>
                <label class="photo-proof-note-label">
                    <span>Description (optional)</span>
                    <textarea class="app-dialog-input photo-proof-note" rows="3" maxlength="500" placeholder="For example: Left beside the front door"></textarea>
                </label>
                <p class="photo-proof-error" hidden></p>
                <div class="app-dialog-actions">
                    <button class="app-dialog-btn app-dialog-btn-secondary" type="button" data-photo-cancel>Cancel</button>
                    <button class="app-dialog-btn app-dialog-btn-primary" type="button" data-photo-submit disabled>Upload & Complete</button>
                </div>
            </div>
        `;

        const fileInput = overlay.querySelector(".photo-proof-file-input");
        const pickerFileName = overlay.querySelector(".photo-proof-picker-name");
        const preview = overlay.querySelector(".photo-proof-preview");
        const previewImage = preview.querySelector("img");
        const fileName = overlay.querySelector(".photo-proof-file-name");
        const noteInput = overlay.querySelector(".photo-proof-note");
        const errorBox = overlay.querySelector(".photo-proof-error");
        const submitButton = overlay.querySelector("[data-photo-submit]");
        let previewUrl = null;
        let settled = false;

        const close = (value) => {
            if (settled) return;
            settled = true;
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            document.removeEventListener("keydown", handleKeydown);
            overlay.remove();
            document.body.classList.remove("app-dialog-open");
            resolve(value);
        };
        const handleKeydown = (event) => {
            if (event.key === "Escape") close(null);
        };

        fileInput.addEventListener("change", () => {
            const file = fileInput.files?.[0];
            errorBox.hidden = true;
            submitButton.disabled = true;
            preview.hidden = true;
            pickerFileName.textContent = file ? file.name : "No file chosen";
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = null;
            if (!file) return;
            if (!(["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))) {
                errorBox.textContent = "Please choose a JPG, PNG, WebP, or GIF image.";
                errorBox.hidden = false;
                fileInput.value = "";
                pickerFileName.textContent = "No file chosen";
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                errorBox.textContent = "The image must be 5 MB or smaller.";
                errorBox.hidden = false;
                fileInput.value = "";
                pickerFileName.textContent = "No file chosen";
                return;
            }
            previewUrl = URL.createObjectURL(file);
            previewImage.src = previewUrl;
            fileName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            preview.hidden = false;
            submitButton.disabled = false;
        });
        overlay.querySelector("[data-photo-cancel]").addEventListener("click", () => close(null));
        submitButton.addEventListener("click", () => {
            const file = fileInput.files?.[0];
            if (file) close({ file, note: noteInput.value.trim() });
        });
        document.addEventListener("keydown", handleKeydown);
        document.body.append(overlay);
        document.body.classList.add("app-dialog-open");
        requestAnimationFrame(() => fileInput.focus());
    });
}

function showMessage(elementId, type, text) {
    const box = document.getElementById(elementId);
    if (!box) {
        return;
    }
    box.hidden = false;
    box.className = `message-box ${type}`;
    box.textContent = text;
}

function saveAuth(data) {
    sessionStorage.setItem(authStoreKey, JSON.stringify(data));
}

function clearAuth() {
    sessionStorage.removeItem(authStoreKey);
}

function getAuth() {
    const raw = sessionStorage.getItem(authStoreKey);
    return raw ? JSON.parse(raw) : null;
}

function maskPhone(phone) {
    if (!phone || phone.length < 7) {
        return phone || "Phone hidden";
    }
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function buildAvatarText(name) {
    if (!name) {
        return "LC";
    }
    const trimmed = name.trim();
    return trimmed.slice(0, 2).toUpperCase();
}

function formatWeeklyClaimStatus(user) {
    const weeklyStatus = document.getElementById("weekly-refresh-status");
    const claimButton = document.getElementById("claim-weekly-points-btn");
    if (!weeklyStatus && !claimButton) {
        return;
    }

    const now = new Date();
    const todayIsMonday = now.getDay() === 1;
    const lastClaim = user && user.lastWeeklyClaimAt ? new Date(user.lastWeeklyClaimAt.replace(" ", "T")) : null;
    const alreadyClaimedToday = Boolean(
        lastClaim
        && lastClaim.getFullYear() === now.getFullYear()
        && lastClaim.getMonth() === now.getMonth()
        && lastClaim.getDate() === now.getDate()
    );

    if (weeklyStatus) {
        if (!todayIsMonday) {
            weeklyStatus.textContent = "Weekly refresh is available on Monday only.";
        } else if (alreadyClaimedToday) {
            weeklyStatus.textContent = "You have already claimed this week's 15 points.";
        } else {
            weeklyStatus.textContent = "Today is Monday. You can claim 15 points once this week.";
        }
    }

    if (claimButton) {
        claimButton.disabled = !todayIsMonday || alreadyClaimedToday;
    }
}

function formatWeeklyCardStatus(user) {
    const status = document.getElementById("weekly-card-status");
    const button = document.getElementById("activate-weekly-card-btn");
    if (!status && !button) {
        return;
    }

    const expiresAt = user && user.weeklyCardExpiresAt ? new Date(user.weeklyCardExpiresAt.replace(" ", "T")) : null;
    const active = Boolean(expiresAt && expiresAt > new Date());

    if (status) {
        status.textContent = active
            ? `Weekly card active until ${expiresAt.toLocaleString()}. Each order gets 2 points off.`
            : "Open a weekly card for 10 points and save 2 points on each order for 7 days.";
    }
    if (button) {
        button.disabled = active;
        button.textContent = active ? "Weekly Card Active" : "Open Weekly Card";
    }
}

function applyProfileSummary(user) {
    const avatar = document.getElementById("profile-avatar");
    const summaryName = document.getElementById("profile-summary-name");
    const summaryEmail = document.getElementById("profile-summary-email");
    const summaryPhone = document.getElementById("profile-summary-phone");
    const emailPreview = document.getElementById("profile-email-preview");
    const addressPreview = document.getElementById("profile-address-preview");
    const phonePreview = document.getElementById("profile-phone-preview");
    const detailPreview = document.getElementById("profile-detail-preview");
    const addressPanelPreview = document.getElementById("profile-address-panel-preview");
    const detailPanelPreview = document.getElementById("profile-detail-panel-preview");
    const pointsPreview = document.getElementById("profile-points-preview");
    const ordersPreview = document.getElementById("profile-orders-preview");
    const pointsPanelTotal = document.getElementById("points-panel-total");
    const ordersPanelTotal = document.getElementById("orders-panel-total");
    const ordersPanelStatus = document.getElementById("orders-panel-status");
    const invitePreview = document.getElementById("profile-invite-preview");
    const invitePanelCode = document.getElementById("invite-panel-code");
    const rolePreview = document.getElementById("profile-role-preview");
    const runnerRoleStatus = document.getElementById("runner-role-status");
    const derivedPoints = String(user.points || 0);
    const normalizedRole = user.role ? String(user.role).toUpperCase() : "USER";
    const applicationStatus = String(user.runnerApplicationStatus || "NONE").toUpperCase();
    const roleLabel = normalizedRole === "ADMIN"
        ? "Admin"
        : (normalizedRole === "RUNNER" ? "Runner" : (applicationStatus === "PENDING" ? "Pending Runner Review" : "Customer"));

    if (avatar) {
        avatar.textContent = buildAvatarText(user.username);
    }
    if (summaryName) {
        summaryName.textContent = user.username || "Leeds User";
    }
    if (summaryEmail) {
        summaryEmail.textContent = user.email || "-";
    }
    if (summaryPhone) {
        summaryPhone.textContent = maskPhone(user.phone);
    }
    if (emailPreview) {
        emailPreview.textContent = user.email || "-";
    }
    if (addressPreview) {
        addressPreview.textContent = user.commonAddress || "Not set";
    }
    if (phonePreview) {
        phonePreview.textContent = user.phone || "-";
    }
    if (detailPreview) {
        detailPreview.textContent = user.detailAddress || "Not set";
    }
    if (addressPanelPreview) {
        addressPanelPreview.textContent = user.commonAddress || "Not set";
    }
    if (detailPanelPreview) {
        detailPanelPreview.textContent = user.detailAddress || "Not set";
    }
    if (pointsPreview) {
        pointsPreview.textContent = derivedPoints;
    }
    if (invitePreview) {
        invitePreview.textContent = user.inviteCode || "-";
    }
    if (rolePreview) {
        rolePreview.textContent = roleLabel;
    }
    if (pointsPanelTotal) {
        pointsPanelTotal.textContent = derivedPoints;
    }
    if (invitePanelCode) {
        invitePanelCode.textContent = user.inviteCode || "-";
    }
    if (ordersPreview) {
        ordersPreview.textContent = "0";
    }
    if (ordersPanelTotal) {
        ordersPanelTotal.textContent = "0";
    }
    if (ordersPanelStatus) {
        ordersPanelStatus.textContent = "No orders yet";
    }
    if (runnerRoleStatus) {
        runnerRoleStatus.textContent = roleLabel;
    }

    formatWeeklyClaimStatus(user);
    formatWeeklyCardStatus(user);
    applyRunnerAccessUi(user);
}

function applyProfileOrderStats(orders) {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const total = safeOrders.length;
    const accepted = safeOrders.filter((order) => order.status === "ACCEPTED").length;
    const pickedUp = safeOrders.filter((order) => order.status === "PICKED_UP").length;
    const waitingConfirmation = safeOrders.filter((order) => order.status === "AWAITING_CUSTOMER_CONFIRMATION").length;
    const delivered = safeOrders.filter((order) => order.status === "DELIVERED").length;
    const reviewedOrders = safeOrders.filter((order) => order.runnerReviewScore != null);
    const notReviewedOrders = safeOrders.filter((order) => order.status === "DELIVERED" && order.runnerReviewScore == null);
    const averageRunnerScoreGiven = reviewedOrders.length === 0
        ? null
        : reviewedOrders.reduce((sum, order) => sum + Number(order.runnerReviewScore || 0), 0) / reviewedOrders.length;
    const ordersPanelAccepted = document.getElementById("orders-panel-accepted");
    const ordersPanelPickedUp = document.getElementById("orders-panel-picked-up");
    const ordersPanelAwaiting = document.getElementById("orders-panel-awaiting");
    const ordersPanelCompleted = document.getElementById("orders-panel-completed");
    const ordersPanelReviewed = document.getElementById("orders-panel-reviewed");
    const ordersPanelNotReviewed = document.getElementById("orders-panel-not-reviewed");
    const ordersPanelAverageOrderScore = document.getElementById("orders-panel-average-order-score");
    const ordersPanelAverageRunnerScoreGiven = document.getElementById("orders-panel-average-runner-score-given");
    const ordersPanelNextAction = document.getElementById("orders-panel-next-action");
    const recentOrdersList = document.getElementById("profile-recent-orders-list");
    const ordersPreview = document.getElementById("profile-orders-preview");
    const ordersPanelTotal = document.getElementById("orders-panel-total");
    const ordersPanelStatus = document.getElementById("orders-panel-status");

    if (ordersPreview) {
        ordersPreview.textContent = String(total);
    }
    if (ordersPanelTotal) {
        ordersPanelTotal.textContent = String(total);
    }
    if (ordersPanelStatus) {
        ordersPanelStatus.textContent = total === 0
            ? "No orders yet"
            : `Accepted ${accepted} | Picked Up ${pickedUp} | Awaiting Confirmation ${waitingConfirmation} | Completed ${delivered}`;
    }
    if (ordersPanelAccepted) {
        ordersPanelAccepted.textContent = String(accepted);
    }
    if (ordersPanelPickedUp) {
        ordersPanelPickedUp.textContent = String(pickedUp);
    }
    if (ordersPanelAwaiting) {
        ordersPanelAwaiting.textContent = String(waitingConfirmation);
    }
    if (ordersPanelCompleted) {
        ordersPanelCompleted.textContent = String(delivered);
    }
    if (ordersPanelReviewed) {
        ordersPanelReviewed.textContent = String(reviewedOrders.length);
    }
    if (ordersPanelNotReviewed) {
        ordersPanelNotReviewed.textContent = String(notReviewedOrders.length);
    }
    if (ordersPanelAverageOrderScore) {
        ordersPanelAverageOrderScore.textContent = "-";
    }
    if (ordersPanelAverageRunnerScoreGiven) {
        ordersPanelAverageRunnerScoreGiven.textContent = averageRunnerScoreGiven == null ? "-" : `${averageRunnerScoreGiven.toFixed(1)} / 5`;
    }
    if (ordersPanelNextAction) {
        if (notReviewedOrders.length > 0) {
            ordersPanelNextAction.textContent = "You still have completed orders waiting for a review.";
        } else if (waitingConfirmation > 0) {
            ordersPanelNextAction.textContent = "You have deliveries waiting for confirmation.";
        } else if (pickedUp > 0) {
            ordersPanelNextAction.textContent = "A runner is currently on the way with one of your orders.";
        } else if (accepted > 0) {
            ordersPanelNextAction.textContent = "A runner has accepted your order and will pick it up soon.";
        } else if (delivered > 0) {
            ordersPanelNextAction.textContent = "Your latest completed orders are ready to review.";
        } else {
            ordersPanelNextAction.textContent = "No action needed right now.";
        }
    }
    if (recentOrdersList) {
        const recentOrders = safeOrders.slice(0, 4);
        recentOrdersList.innerHTML = recentOrders.length === 0
            ? '<div class="invite-record-empty">Your recent orders will appear here.</div>'
            : recentOrders.map((order) => `
                <a class="profile-recent-order-item" href="/orders.html">
                    <div>
                        <strong>${order.orderTypeLabel || "Campus Errand"}</strong>
                        <span>${order.orderNo || "-"} | ${formatOrderDate(order.createdAt)}</span>
                    </div>
                    <div class="profile-recent-order-meta">
                        <strong>${order.statusLabel || "Placed"}</strong>
                        <span>${getReviewStatusLabel(order)} | ${formatPoints(order.pointsCost || order.totalFee)}</span>
                    </div>
                </a>
            `).join("");
    }
}

function applyRunnerAccessUi(user) {
    const isRunner = user && user.role && String(user.role).toUpperCase() === "RUNNER";
    const isAdmin = user && user.role && String(user.role).toUpperCase() === "ADMIN";
    const applicationStatus = user && user.runnerApplicationStatus ? String(user.runnerApplicationStatus).toUpperCase() : "NONE";
    const applicationPending = applicationStatus === "PENDING";
    const applicationRejected = applicationStatus === "REJECTED";
    const runnerCenterLink = document.getElementById("runner-center-link");
    const runnerOrdersLink = document.getElementById("runner-orders-link");
    const runnerEntryButton = document.getElementById("runner-entry-btn");
    const runnerOrdersEntryButton = document.getElementById("runner-orders-entry-btn");
    const applyRunnerButton = document.getElementById("apply-runner-btn");
    const revokeRunnerButton = document.getElementById("revoke-runner-btn");
    const homeRunnerLink = document.getElementById("home-runner-link");
    const homeRunnerOrdersLink = document.getElementById("home-runner-orders-link");
    const adminCenterLink = document.getElementById("admin-center-link");

    if (runnerCenterLink) {
        runnerCenterLink.classList.toggle("hidden-panel", !isRunner);
    }
    if (runnerOrdersLink) {
        runnerOrdersLink.classList.toggle("hidden-panel", !isRunner);
    }
    if (homeRunnerLink) {
        homeRunnerLink.classList.toggle("hidden-panel", !isRunner);
    }
    if (homeRunnerOrdersLink) {
        homeRunnerOrdersLink.classList.toggle("hidden-panel", !isRunner);
    }
    if (runnerEntryButton) {
        runnerEntryButton.classList.toggle("hidden-panel", !isRunner);
    }
    if (runnerOrdersEntryButton) {
        runnerOrdersEntryButton.classList.toggle("hidden-panel", !isRunner);
    }
    if (applyRunnerButton) {
        applyRunnerButton.hidden = isRunner || isAdmin;
        applyRunnerButton.disabled = applicationPending;
        applyRunnerButton.textContent = applicationPending
            ? "Application Pending Review"
            : (applicationRejected ? "Apply Again as Runner" : "Apply to Become a Runner");
    }
    if (revokeRunnerButton) {
        revokeRunnerButton.classList.toggle("hidden-panel", !isRunner);
    }
    if (adminCenterLink) {
        adminCenterLink.classList.toggle("hidden-panel", !isAdmin);
    }
}

function activateProfilePanel(panelId) {
    document.querySelectorAll(".profile-content-panel").forEach((panel) => {
        panel.classList.toggle("hidden-panel", panel.id !== panelId);
    });
    document.querySelectorAll(".profile-menu-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.panel === panelId);
    });
}

function renderInviteRecords(data) {
    const inviteCodePreview = document.getElementById("invite-panel-code");
    const totalCount = document.getElementById("invite-total-count");
    const totalPoints = document.getElementById("invite-total-points");
    const recordList = document.getElementById("invite-record-list");

    if (inviteCodePreview) {
        inviteCodePreview.textContent = data.inviteCode || "-";
    }
    if (totalCount) {
        totalCount.textContent = String(data.totalInvites || 0);
    }
    if (totalPoints) {
        totalPoints.textContent = String(data.totalRewardPoints || 0);
    }
    if (!recordList) {
        return;
    }

    if (!data.records || data.records.length === 0) {
        recordList.innerHTML = '<div class="invite-record-empty">No invite records yet.</div>';
        return;
    }

    recordList.innerHTML = data.records.map((record) => `
        <div class="invite-record-item">
            <div>
                <strong>${record.username || "New User"}</strong>
                <span>${record.email || "-"}</span>
            </div>
            <div class="invite-record-meta">
                <strong>+${record.rewardPoints || 0}</strong>
                <span>${record.registeredAt || "-"}</span>
            </div>
        </div>
    `).join("");
}

function formatPointHistoryType(type) {
    const labels = {
        OPENING_BALANCE: "Opening Balance",
        STARTER_POINTS: "Starter Points",
        INVITE_REWARD: "Invite Reward",
        WEEKLY_REFRESH: "Weekly Refresh",
        WEEKLY_CARD: "Weekly Card",
        ORDER_PAYMENT: "Order Payment",
        ORDER_REFUND: "Order Refund",
        RUNNER_SETTLEMENT: "Runner Settlement",
        CANCEL_PENALTY: "Cancel Penalty",
        GIVE_UP_PENALTY: "Give-up Penalty",
        ADMIN_INITIAL_POINTS: "Admin Initial Points",
        ADMIN_ADJUSTMENT: "Admin Adjustment",
        ADMIN_ORDER_REFUND: "Admin Refund"
    };
    return labels[String(type || "").toUpperCase()] || "Point Change";
}

function renderPointHistory(records) {
    const list = document.getElementById("point-history-list");
    if (!list) {
        return;
    }
    const safeRecords = Array.isArray(records) ? records : [];
    if (safeRecords.length === 0) {
        list.innerHTML = '<div class="invite-record-empty">No point history yet.</div>';
        return;
    }
    list.innerHTML = safeRecords.map((record) => {
        const change = Number(record.changeAmount || 0);
        const positive = change >= 0;
        const orderPart = record.orderNo ? ` | ${record.orderNo}` : "";
        return `
            <div class="point-history-item">
                <div class="point-history-main">
                    <strong>${formatPointHistoryType(record.transactionType)}</strong>
                    <span>${record.description || "Point balance changed."}${orderPart}</span>
                </div>
                <div class="point-history-meta">
                    <strong class="point-history-delta ${positive ? "positive" : "negative"}">${positive ? "+" : ""}${change} pts</strong>
                    <span>Balance ${record.balanceAfter || 0} | ${formatOrderDate(record.createdAt)}</span>
                </div>
            </div>
        `;
    }).join("");
}

function formatPoints(value) {
    const numeric = Number(value || 0);
    return `${Math.round(numeric)} pts`;
}

function formatOrderDate(value) {
    if (!value) {
        return "-";
    }
    return String(value).replace("T", " ").slice(0, 16);
}

function getReviewStatusLabel(order) {
    if (!order || order.status !== "DELIVERED") {
        return "Available after delivery";
    }
    return order.runnerReviewScore != null ? "Rated" : "Not Rated";
}

function computeRunnerPerformance(orders) {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const completedOrders = safeOrders.filter((order) => order.status === "DELIVERED");
    const ratedOrders = completedOrders.filter((order) => order.runnerReviewScore != null);
    const averageRunnerScore = ratedOrders.length === 0
        ? null
        : (ratedOrders.reduce((sum, order) => sum + Number(order.runnerReviewScore || 0), 0) / ratedOrders.length);
    return {
        completedCount: completedOrders.length,
        ratedCount: ratedOrders.length,
        averageRunnerScore
    };
}

function applyRunnerPerformanceSummary(orders) {
    const stats = computeRunnerPerformance(orders);
    const overviewAverage = document.getElementById("profile-runner-average-preview");
    const overviewCompleted = document.getElementById("profile-runner-completed-preview");
    const runnerAveragePanel = document.getElementById("runner-average-score-panel");
    const runnerCompletedPanel = document.getElementById("runner-completed-orders-panel");
    const formatAverage = stats.averageRunnerScore == null ? "-" : `${stats.averageRunnerScore.toFixed(1)} / 5`;

    if (overviewAverage) {
        overviewAverage.textContent = formatAverage;
    }
    if (overviewCompleted) {
        overviewCompleted.textContent = String(stats.completedCount);
    }
    if (runnerAveragePanel) {
        runnerAveragePanel.textContent = formatAverage;
    }
    if (runnerCompletedPanel) {
        runnerCompletedPanel.textContent = String(stats.completedCount);
    }
}

function renderRunnerReviewRecords(orders) {
    const reviewList = document.getElementById("runner-review-list");
    if (!reviewList) {
        return;
    }
    const reviewedOrders = (Array.isArray(orders) ? orders : [])
        .filter((order) => order.runnerReviewScore != null)
        .sort((left, right) => String(right.reviewedAt || "").localeCompare(String(left.reviewedAt || "")))
        .slice(0, 6);

    reviewList.innerHTML = reviewedOrders.length === 0
        ? '<div class="invite-record-empty">No customer reviews yet.</div>'
        : reviewedOrders.map((order) => `
            <div class="invite-record-item runner-review-item">
                <div>
                    <strong>${order.customerUsername || "Campus User"} | ${order.runnerReviewScore} / 5</strong>
                    <span>${order.orderTypeLabel || "Campus Errand"} | ${order.orderNo || "-"}</span>
                    <span>${order.reviewComment || "No written comment."}</span>
                </div>
                <div class="invite-record-meta">
                    <strong>Runner ${order.runnerReviewScore} / 5</strong>
                    <span>${formatOrderDate(order.reviewedAt || order.updatedAt)}</span>
                </div>
            </div>
        `).join("");
}

function openReviewPage(orderNo) {
    if (!orderNo) {
        return;
    }
    window.location.href = `/review.html?orderNo=${encodeURIComponent(orderNo)}`;
}

function describeRunnerState(order) {
    if (!order) {
        return "Waiting for pickup";
    }
    if (order.runnerUsername) {
        if (order.status === "DELIVERED") {
            return "Completed by runner";
        }
        return "Accepted by runner";
    }
    return "Waiting for pickup";
}

function describeVerificationState(order) {
    if (!order) {
        return "-";
    }
    if (order.deliveryMethod === "PIN_IN_PERSON") {
        return order.status === "DELIVERED"
            ? `PIN verified: ${order.deliveryPin || "-"}`
            : `PIN required on delivery: ${order.deliveryPin || "-"}`;
    }
    if (order.status === "DELIVERED") {
        return "Photo-proof delivery completed";
    }
    return "Photo proof pending upload";
}

function applyPinEmphasis(element, order) {
    if (!element) return;
    const showPin = order?.deliveryMethod === "PIN_IN_PERSON" && order?.deliveryPin;
    element.classList.toggle("delivery-pin-highlight", Boolean(showPin));
}

function describeRunnerVerificationState(order) {
    if (!order) {
        return "-";
    }
    if (order.deliveryMethod === "PIN_IN_PERSON") {
        return order.status === "DELIVERED"
            ? `PIN verified: ${order.deliveryPin || "-"}`
            : "PIN required on delivery. Hidden until the order is completed.";
    }
    if (order.status === "DELIVERED") {
        return "Photo-proof delivery completed";
    }
    return "Photo proof pending upload";
}

function describePhotoProof(order) {
    if (!order || (order.deliveryMethod !== "LEAVE_AND_PHOTO")) {
        return "No photo proof required";
    }
    if (order.photoProofUrl || order.photoProofNote) {
        return [order.photoProofUrl, order.photoProofNote].filter(Boolean).join(" | ");
    }
    return "No photo proof uploaded";
}

function renderPhotoProof(elementId, order) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.replaceChildren();
    const proofUrl = order?.photoProofUrl || "";
    if (!proofUrl) {
        element.textContent = "No photo proof uploaded";
        return;
    }
    const link = document.createElement("a");
    link.className = "photo-proof-link";
    link.href = proofUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const image = document.createElement("img");
    image.className = "photo-proof-image";
    image.src = proofUrl;
    image.alt = "Uploaded delivery proof";
    link.append(image);
    element.append(link);
    if (order.photoProofNote) {
        const note = document.createElement("span");
        note.className = "photo-proof-saved-note";
        note.textContent = order.photoProofNote;
        element.append(note);
    }
}

function buildPhotoProofCardPreview(order) {
    const proofUrl = order?.photoProofUrl || "";
    if (!/^\/uploads\/photo-proofs\/[A-Za-z0-9._-]+$/.test(proofUrl)) {
        return "";
    }
    return `
        <div class="order-photo-proof-preview">
            <div class="order-photo-proof-heading">
                <strong>Delivery photo uploaded</strong>
                <span>Click this order to review and confirm delivery</span>
            </div>
            <img src="${proofUrl}" alt="Delivery proof for order ${order.orderNo || ""}">
        </div>
    `;
}

function formatAppealStatus(order) {
    const status = String(order?.appealStatus || "NONE").toUpperCase();
    if (status === "OPEN") {
        return "Open";
    }
    if (status === "RESOLVED") {
        return "Resolved";
    }
    return "None";
}

function buildAppealActionButton(order, datasetName) {
    if (String(order?.status || "").toUpperCase() !== "DELIVERED") {
        return "";
    }
    const status = String(order?.appealStatus || "NONE").toUpperCase();
    const disabled = status === "OPEN" || status === "RESOLVED";
    const label = status === "OPEN" ? "Appeal Open" : (status === "RESOLVED" ? "Appeal Resolved" : "Appeal");
    const orderNo = order?.orderNo || "";
    return `<button class="ghost-btn runner-action-btn" type="button" ${datasetName}="${orderNo}" ${disabled ? "disabled" : ""}>${label}</button>`;
}

function formatAppealDetail(order) {
    if (!order || !order.appealStatus || String(order.appealStatus).toUpperCase() === "NONE") {
        return "No appeal submitted";
    }
    const reason = order.appealReason || "No reason recorded";
    const resolution = order.appealResolution ? ` | Resolution: ${order.appealResolution}` : "";
    return `${reason}${resolution}`;
}

function buildStatusTimeline(status) {
    const stages = [
        { key: "PLACED", label: "Placed" },
        { key: "ACCEPTED", label: "Accepted" },
        { key: "PICKED_UP", label: "Picked Up" },
        { key: "DELIVERED", label: "Delivered" }
    ];
    if (status === "AWAITING_CUSTOMER_CONFIRMATION") {
        return `
            <span class="done">Placed</span>
            <span class="done">Accepted</span>
            <span class="done">Picked Up</span>
            <span class="active">Awaiting Confirmation</span>
        `;
    }
    if (status === "CANCELLED_BY_CUSTOMER") {
        return `
            <span class="done">Placed</span>
            <span class="active">Cancelled</span>
            <span>Picked Up</span>
            <span>Delivered</span>
        `;
    }
    const currentIndex = stages.findIndex((stage) => stage.key === status);
    return stages.map((stage, index) => {
        if (index < currentIndex) {
            return `<span class="done">${stage.label}</span>`;
        }
        if (index === currentIndex) {
            return `<span class="active">${stage.label}</span>`;
        }
        return `<span>${stage.label}</span>`;
    }).join("");
}

function computeOrderFeePreview(formState) {
    const auth = getAuth();
    const user = auth && auth.user ? auth.user : null;
    const expiresAt = user && user.weeklyCardExpiresAt ? new Date(user.weeklyCardExpiresAt.replace(" ", "T")) : null;
    const weeklyCardDiscountFee = expiresAt && expiresAt > new Date() ? 2 : 0;
    const baseFee = 3;
    const distanceFee = 2;
    const urgencyFee = formState.timeWindowType === "ASAP" ? 2 : formState.timeWindowType === "WITHIN_ONE_HOUR" ? 1 : 0;
    const tipFee = Math.max(0, Math.round(Number(formState.optionalTip || 0)));
    const totalFee = Math.max(1, baseFee + distanceFee + urgencyFee + tipFee - weeklyCardDiscountFee);
    return { baseFee, distanceFee, urgencyFee, tipFee, weeklyCardDiscountFee, totalFee };
}

async function reverseGeocode(latitude, longitude) {
    const url = new URL("/api/location/reverse", window.location.origin);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));

    try {
        const response = await fetch(url.toString());
        if (response.ok) {
            const data = await response.json();
            if (data.address && !data.address.startsWith("Current location:")) {
                return data.address;
            }
        }
    } catch (error) {
        // Continue with the browser-side fallback below.
    }

    try {
        const detailedUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        detailedUrl.searchParams.set("format", "jsonv2");
        detailedUrl.searchParams.set("lat", String(latitude));
        detailedUrl.searchParams.set("lon", String(longitude));
        detailedUrl.searchParams.set("zoom", "18");
        detailedUrl.searchParams.set("addressdetails", "1");
        detailedUrl.searchParams.set("accept-language", "en");
        const detailedResponse = await fetch(detailedUrl.toString(), {
            headers: { Accept: "application/json" }
        });
        if (detailedResponse.ok) {
            const detailedData = await detailedResponse.json();
            if (detailedData.display_name) {
                return detailedData.display_name;
            }
        }
    } catch (error) {
        // Continue with the locality-level fallback below.
    }

    try {
        const fallbackUrl = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
        fallbackUrl.searchParams.set("latitude", String(latitude));
        fallbackUrl.searchParams.set("longitude", String(longitude));
        fallbackUrl.searchParams.set("localityLanguage", "en");
        const response = await fetch(fallbackUrl.toString());
        if (response.ok) {
            const data = await response.json();
            const addressParts = [
                data.locality || data.city,
                data.postcode,
                data.principalSubdivision,
                data.countryName
            ].filter((value, index, values) => value && values.indexOf(value) === index);
            if (addressParts.length) {
                return addressParts.join(", ");
            }
        }
    } catch (error) {
        // The caller will show a clear address lookup failure message.
    }

    return "Location detected, but the address could not be resolved";
}

function applyFeePreview(preview) {
    const base = document.getElementById("fee-base");
    const distance = document.getElementById("fee-distance");
    const urgency = document.getElementById("fee-urgency");
    const tip = document.getElementById("fee-tip");
    const weeklyCard = document.getElementById("fee-weekly-card");
    const total = document.getElementById("order-total-preview");
    const modalTotal = document.getElementById("modal-order-total-preview");

    if (base) {
        base.textContent = formatPoints(preview.baseFee);
    }
    if (distance) {
        distance.textContent = formatPoints(preview.distanceFee);
    }
    if (urgency) {
        urgency.textContent = formatPoints(preview.urgencyFee);
    }
    if (tip) {
        tip.textContent = formatPoints(preview.tipFee);
    }
    if (weeklyCard) {
        weeklyCard.textContent = preview.weeklyCardDiscountFee > 0 ? `- ${formatPoints(preview.weeklyCardDiscountFee)}` : formatPoints(0);
    }
    if (total) {
        total.textContent = formatPoints(preview.totalFee);
    }
    if (modalTotal) {
        modalTotal.textContent = formatPoints(preview.totalFee);
    }
}

function renderOrders(orders, statusFilter = "ALL") {
    const orderList = document.getElementById("order-list");
    if (!orderList) {
        return;
    }
    const safeOrders = Array.isArray(orders) ? orders : [];
    const filteredOrders = statusFilter === "ALL"
        ? safeOrders
        : statusFilter === "REVIEWED"
            ? safeOrders.filter((order) => order.runnerReviewScore != null)
            : statusFilter === "NOT_REVIEWED"
                ? safeOrders.filter((order) => order.status === "DELIVERED" && order.runnerReviewScore == null)
                : safeOrders.filter((order) => order.status === statusFilter);
    if (filteredOrders.length === 0) {
        const emptyMessage = statusFilter === "REVIEWED"
            ? "No rated orders yet."
            : statusFilter === "NOT_REVIEWED"
                ? "No completed orders waiting for a runner rating."
                : "No orders yet. Place your first campus errand using the form.";
        orderList.innerHTML = `<div class="invite-record-empty">${emptyMessage}</div>`;
        return;
    }

      orderList.innerHTML = filteredOrders.map((order) => `
        <article class="live-order-card clickable-order-card" data-order-no="${order.orderNo || ""}">
            <div class="live-order-head">
                <div>
                    <span class="order-status-tag">${order.statusLabel || "Placed"}</span>
                    <h4>${order.orderTypeLabel || "Campus Errand"}</h4>
                    <p>${order.timeWindowLabel || "Flexible"}</p>
                </div>
                <strong>${formatPoints(order.pointsCost || order.totalFee)}</strong>
            </div>
            <div class="live-order-meta">
                <div><span>Order No</span><strong>${order.orderNo || "-"}</strong></div>
                <div><span>Runner</span><strong>${order.runnerUsername || "Waiting for pickup"}</strong></div>
                <div><span>Pickup</span><strong>${order.pickupLocation || "-"}</strong></div>
                <div><span>Drop-off</span><strong>${order.deliveryLocation || "-"}</strong></div>
                <div><span>Created</span><strong>${formatOrderDate(order.createdAt)}</strong></div>
                <div><span>Delivery</span><strong>${order.deliveryMethod === "PIN_IN_PERSON" ? "PIN in person" : "Leave and photo"}</strong></div>
                <div><span>Review</span><strong>${getReviewStatusLabel(order)}</strong></div>
            </div>
            ${buildPhotoProofCardPreview(order)}
            <div class="live-order-foot">
                <span>${describeRunnerState(order)}</span>
                <div class="runner-foot-actions">
                    <span>${describeVerificationState(order)}</span>
                    ${buildAppealActionButton(order, "data-appeal-order")}
                    ${order.status === "DELIVERED" ? `<button class="ghost-btn runner-action-btn" type="button" data-review-order="${order.orderNo || ""}">${order.runnerReviewScore == null ? "Review Runner" : "View Rating"}</button>` : ""}
                </div>
            </div>
        </article>
    `).join("");
}

function renderRunnerAvailableOrders(orders) {
    const list = document.getElementById("runner-available-list");
    const count = document.getElementById("runner-available-count");
    if (!list) {
        return;
    }
    if (count) {
        count.textContent = String((orders || []).length);
    }
    if (!orders || orders.length === 0) {
        list.innerHTML = '<div class="invite-record-empty">No available orders match the selected filters.</div>';
        return;
    }

      list.innerHTML = orders.map((order) => `
        <article class="live-order-card runner-order-card clickable-runner-card" data-runner-order-no="${order.orderNo || ""}">
              <div class="live-order-head">
                  <div>
                    <span class="order-status-tag">${order.statusLabel || "Placed"}</span>
                    <h4>${order.orderTypeLabel || "Campus Errand"}</h4>
                    <p>${order.orderNo || "-"}</p>
                </div>
                  <strong>${formatPoints(order.pointsCost || order.totalFee)}</strong>
              </div>
              <div class="live-order-meta">
                  <div><span>Customer</span><strong>${order.customerUsername || "-"}</strong></div>
                  <div><span>Pickup</span><strong>${order.pickupLocation || "-"}</strong></div>
                  <div><span>Drop-off</span><strong>${order.deliveryLocation || "-"}</strong></div>
                  <div><span>Window</span><strong>${order.timeWindowLabel || "-"}</strong></div>
                  <div><span>Verification</span><strong>${order.deliveryMethod === "PIN_IN_PERSON" ? "PIN in person" : "Photo proof"}</strong></div>
              </div>
            <div class="live-order-foot">
                <span>${order.pickupNotes || "-"}</span>
                <button class="primary-btn runner-action-btn" type="button" data-runner-accept="${order.orderNo || ""}">Accept Order</button>
            </div>
        </article>
    `).join("");
}

function filterRunnerAvailableOrders(orders) {
    const location = String(document.getElementById("runner-location-filter")?.value || "").trim().toLowerCase();
    const minimumPoints = Number(document.getElementById("runner-min-points-filter")?.value || 0);
    const time = document.getElementById("runner-time-filter")?.value || "ALL";
    const type = document.getElementById("runner-type-filter")?.value || "ALL";
    return (orders || []).filter((order) => {
        const locations = `${order.pickupLocation || ""} ${order.deliveryLocation || ""}`.toLowerCase();
        const points = Number(order.pointsCost || order.totalFee || 0);
        return (!location || locations.includes(location))
            && points >= minimumPoints
            && (time === "ALL" || order.timeWindowType === time)
            && (type === "ALL" || order.orderType === type);
    });
}

function applyRunnerAvailableFilters() {
    renderRunnerAvailableOrders(filterRunnerAvailableOrders(document.__runnerAvailableOrders || []));
}

function renderRunnerMyOrders(orders, statusFilter = "ALL") {
    const list = document.getElementById("runner-my-list");
    const completedList = document.getElementById("runner-completed-list");
    const count = document.getElementById("runner-accepted-count");
    if (!list) {
        return;
    }
    const safeOrders = Array.isArray(orders) ? orders : [];
    document.__runnerMyOrders = safeOrders;
    const activeOrders = safeOrders.filter((order) => order.status !== "DELIVERED");
    const completedOrders = safeOrders.filter((order) => order.status === "DELIVERED");
    const filteredOrders = statusFilter === "ALL"
        ? safeOrders
        : statusFilter === "REVIEWED"
            ? safeOrders.filter((order) => order.status === "DELIVERED" && order.runnerReviewScore != null)
            : statusFilter === "NOT_REVIEWED"
                ? safeOrders.filter((order) => order.status === "DELIVERED" && order.runnerReviewScore == null)
                : safeOrders.filter((order) => order.status === statusFilter);
    if (count) {
        count.textContent = String(activeOrders.length);
    }

    if (filteredOrders.length === 0) {
        const emptyMessage = statusFilter === "REVIEWED"
            ? "No rated orders yet."
            : statusFilter === "NOT_REVIEWED"
                ? "No completed orders are waiting for a rating."
                : statusFilter === "ALL"
                    ? "You have not accepted any orders yet."
                    : "No orders match this status.";
        list.innerHTML = `<div class="invite-record-empty">${emptyMessage}</div>`;
    } else {
          list.innerHTML = filteredOrders.map((order) => {
            const delivered = order.status === "DELIVERED";
            return `
                <article class="live-order-card runner-order-card clickable-runner-card ${delivered ? "completed-runner-card" : ""}" data-runner-order-no="${order.orderNo || ""}">
                    <div class="live-order-head">
                        <div>
                            <span class="order-status-tag">${order.statusLabel || "Accepted"}</span>
                            <h4>${order.orderTypeLabel || "Campus Errand"}</h4>
                            <p>${order.orderNo || "-"}</p>
                        </div>
                        <strong>${formatPoints(order.pointsCost || order.totalFee)}</strong>
                    </div>
                    <div class="live-order-meta">
                        <div><span>Customer</span><strong>${order.customerUsername || "-"}</strong></div>
                        <div><span>Pickup</span><strong>${order.pickupLocation || "-"}</strong></div>
                        <div><span>Drop-off</span><strong>${order.deliveryLocation || "-"}</strong></div>
                        <div><span>Window</span><strong>${order.timeWindowLabel || "-"}</strong></div>
                    </div>
                    <div class="order-progress-line detail-progress-line">${buildStatusTimeline(order.status)}</div>
                    <div class="live-order-foot">
                        <span>${delivered ? `Finished ${formatOrderDate(order.updatedAt)}` : (order.deliveryMethod === "PIN_IN_PERSON" ? "PIN verification required. PIN hidden until completion." : "Photo proof order")}</span>
                        <div class="runner-foot-actions">
                            ${order.status === "ACCEPTED" ? `<button class="ghost-btn runner-action-btn" type="button" data-runner-give-up="${order.orderNo || ""}">Give Up Order</button>` : ""}
                            ${delivered ? "" : `<button class="ghost-btn runner-action-btn" type="button" data-runner-advance="${order.orderNo || ""}">Advance Status</button>`}
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    if (completedList) {
        completedList.innerHTML = completedOrders.length === 0
            ? '<div class="invite-record-empty">No completed runner orders yet.</div>'
            : completedOrders.map((order) => `
                <article class="live-order-card runner-order-card completed-runner-card clickable-runner-card" data-runner-order-no="${order.orderNo || ""}">
                    <div class="live-order-head">
                        <div>
                            <span class="order-status-tag">${order.statusLabel || "Delivered"}</span>
                            <h4>${order.orderTypeLabel || "Campus Errand"}</h4>
                            <p>${order.orderNo || "-"}</p>
                        </div>
                    <strong>${formatPoints(order.pointsCost || order.totalFee)}</strong>
                    </div>
                    <div class="live-order-meta">
                        <div><span>Customer</span><strong>${order.customerUsername || "-"}</strong></div>
                        <div><span>Customer Phone</span><strong>${order.customerPhone || "-"}</strong></div>
                        <div><span>Pickup</span><strong>${order.pickupLocation || "-"}</strong></div>
                        <div><span>Drop-off</span><strong>${order.deliveryLocation || "-"}</strong></div>
                        <div><span>Window</span><strong>${order.timeWindowLabel || "-"}</strong></div>
                        <div><span>Finished</span><strong>${formatOrderDate(order.updatedAt)}</strong></div>
                        <div><span>Runner Score</span><strong>${order.runnerReviewScore != null ? `${order.runnerReviewScore} / 5` : "Not rated yet"}</strong></div>
                    </div>
                    <div class="order-progress-line detail-progress-line">${buildStatusTimeline(order.status)}</div>
                    <div class="live-order-foot">
                        <span>${formatAppealStatus(order)}</span>
                    </div>
                </article>
            `).join("");
    }
}

function applyRunnerDetail(order) {
    const emptyState = document.getElementById("runner-detail-empty");
    const panel = document.getElementById("runner-detail-panel");
    if (!emptyState || !panel) {
        return;
    }
    if (!order) {
        emptyState.classList.remove("hidden-panel");
        panel.classList.add("hidden-panel");
        return;
    }

    emptyState.classList.add("hidden-panel");
    panel.classList.remove("hidden-panel");
    document.getElementById("runner-detail-order-no").textContent = order.orderNo || "-";
    document.getElementById("runner-detail-status").textContent = order.statusLabel || "-";
    document.getElementById("runner-detail-customer-name").textContent = order.customerUsername || "-";
    document.getElementById("runner-detail-customer-phone").textContent = order.customerPhone || "-";
    document.getElementById("runner-detail-pickup-location").textContent = order.pickupLocation || "-";
    document.getElementById("runner-detail-delivery-location").textContent = order.deliveryLocation || "-";
    document.getElementById("runner-detail-delivery-method").textContent = order.deliveryMethod === "PIN_IN_PERSON" ? "PIN in person" : "Leave and photo";
    document.getElementById("runner-detail-time-window").textContent = order.timeWindowLabel || "-";
    document.getElementById("runner-detail-runner-score").textContent = order.runnerReviewScore != null ? `${order.runnerReviewScore} / 5` : "Not rated";
    document.getElementById("runner-detail-appeal-status").textContent = formatAppealStatus(order);
    document.getElementById("runner-detail-pickup-notes").textContent = order.pickupNotes || "-";
    const runnerVerification = document.getElementById("runner-detail-verification");
    runnerVerification.textContent = describeRunnerVerificationState(order) + (order.deliveryMethod === "LEAVE_AND_PHOTO" ? ` | ${describePhotoProof(order)}` : "");
    applyPinEmphasis(runnerVerification, order);
    document.getElementById("runner-detail-review-comment").textContent = order.reviewComment || "No review yet";
    document.getElementById("runner-detail-appeal-detail").textContent = formatAppealDetail(order);
    document.getElementById("runner-detail-status-line").innerHTML = buildStatusTimeline(order.status);
}

function applyOrderDetail(order) {
    const emptyState = document.getElementById("order-detail-empty");
    const panel = document.getElementById("order-detail-panel");
    const cancelButton = document.getElementById("cancel-order-btn");
    const confirmButton = document.getElementById("confirm-receipt-btn");
    const reviewButton = document.getElementById("review-order-btn");
    const appealButton = document.getElementById("appeal-order-btn");

    if (!order) {
        if (emptyState) {
            emptyState.classList.remove("hidden-panel");
        }
        if (panel) {
            panel.classList.add("hidden-panel");
        }
        if (cancelButton) {
            cancelButton.classList.add("hidden-panel");
            delete cancelButton.dataset.orderNo;
        }
        if (confirmButton) {
            confirmButton.classList.add("hidden-panel");
            delete confirmButton.dataset.orderNo;
        }
        if (reviewButton) {
            reviewButton.classList.add("hidden-panel");
            delete reviewButton.dataset.orderNo;
        }
        if (appealButton) {
            appealButton.classList.add("hidden-panel");
            delete appealButton.dataset.orderNo;
        }
        return;
    }

    if (emptyState) {
        emptyState.classList.add("hidden-panel");
    }
    if (panel) {
        panel.classList.remove("hidden-panel");
    }
    if (cancelButton) {
        const canCancel = order.status === "PLACED" || order.status === "ACCEPTED";
        cancelButton.classList.toggle("hidden-panel", !canCancel);
        cancelButton.dataset.orderNo = order.orderNo || "";
    }
    if (confirmButton) {
        const canConfirm = order.status === "AWAITING_CUSTOMER_CONFIRMATION";
        confirmButton.classList.toggle("hidden-panel", !canConfirm);
        confirmButton.dataset.orderNo = order.orderNo || "";
    }
    if (reviewButton) {
        const canOpenReview = order.status === "DELIVERED";
        reviewButton.classList.toggle("hidden-panel", !canOpenReview);
        reviewButton.textContent = order.runnerReviewScore == null ? "Review Runner" : "View Rating";
        reviewButton.dataset.orderNo = order.orderNo || "";
    }
    if (appealButton) {
        const appealStatus = String(order.appealStatus || "NONE").toUpperCase();
        const appealLocked = appealStatus === "OPEN" || appealStatus === "RESOLVED";
        const canAppeal = order.status === "DELIVERED";
        appealButton.classList.toggle("hidden-panel", !canAppeal);
        appealButton.disabled = appealLocked;
        appealButton.textContent = appealStatus === "OPEN" ? "Appeal Open" : (appealStatus === "RESOLVED" ? "Appeal Resolved" : "Appeal");
        appealButton.dataset.orderNo = order.orderNo || "";
    }

    document.getElementById("detail-order-no").textContent = order.orderNo || "-";
    document.getElementById("detail-status").textContent = order.statusLabel || "-";
    document.getElementById("detail-order-type").textContent = order.orderTypeLabel || "-";
    document.getElementById("detail-created-at").textContent = formatOrderDate(order.createdAt);
    document.getElementById("detail-runner-status").textContent = describeRunnerState(order);
    document.getElementById("detail-completed-at").textContent = order.status === "DELIVERED" ? formatOrderDate(order.updatedAt) : "In progress";
    document.getElementById("detail-runner-name").textContent = order.runnerUsername || "Not assigned yet";
    document.getElementById("detail-runner-phone").textContent = order.runnerPhone || "Visible after acceptance";
    document.getElementById("detail-pickup-location").textContent = order.pickupLocation || "-";
    document.getElementById("detail-delivery-location").textContent = order.deliveryLocation || "-";
    document.getElementById("detail-delivery-method").textContent = order.deliveryMethod === "PIN_IN_PERSON" ? "PIN in person" : "Leave and photo";
    document.getElementById("detail-time-window").textContent = order.timeWindowLabel || "-";
    document.getElementById("detail-review-status").textContent = getReviewStatusLabel(order);
    document.getElementById("detail-runner-review-score").textContent = order.runnerReviewScore != null ? `${order.runnerReviewScore} / 5` : "Not rated";
    document.getElementById("detail-pickup-notes").textContent = order.pickupNotes || "-";
    const customerVerification = document.getElementById("detail-verification");
    customerVerification.textContent = describeVerificationState(order);
    applyPinEmphasis(customerVerification, order);
    renderPhotoProof("detail-photo-proof", order);
    document.getElementById("detail-review-comment").textContent = order.reviewComment || "No review yet";
    document.getElementById("detail-cancel-reason").textContent = order.cancelReason || (order.status === "CANCELLED_BY_CUSTOMER" ? "Cancelled by customer" : "-");
    document.getElementById("detail-appeal-status").textContent = formatAppealStatus(order);
    document.getElementById("detail-appeal-detail").textContent = formatAppealDetail(order);
    document.getElementById("detail-status-line").innerHTML = buildStatusTimeline(order.status);
    document.getElementById("detail-fee-base").textContent = formatPoints(order.baseFee);
    document.getElementById("detail-fee-distance").textContent = formatPoints(order.distanceFee);
    document.getElementById("detail-fee-urgency").textContent = formatPoints(order.urgencyFee);
    document.getElementById("detail-fee-tip").textContent = formatPoints(order.tipFee);
    document.getElementById("detail-fee-weekly-card").textContent = Number(order.weeklyCardDiscountFee || 0) > 0
        ? `- ${formatPoints(order.weeklyCardDiscountFee)}`
        : formatPoints(0);
    document.getElementById("detail-fee-total").textContent = formatPoints(order.pointsCost || order.totalFee);
    const detailModalTotal = document.getElementById("detail-modal-order-total");
    if (detailModalTotal) {
        detailModalTotal.textContent = formatPoints(order.pointsCost || order.totalFee);
    }
}

async function request(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.message || "Request failed. Please try again.");
    }
    return payload;
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        try {
            const result = await request("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: formData.get("email"),
                    password: formData.get("password")
                })
            });
            saveAuth(result);
            showMessage("login-message", "success", result.message);
            setTimeout(() => {
                window.location.href = result.user && String(result.user.role).toUpperCase() === "ADMIN"
                    ? "/admin.html"
                    : "/home.html";
            }, 900);
        } catch (error) {
            showMessage("login-message", "error", error.message);
        }
    });
}

const sendCodeButton = document.getElementById("send-code-btn");
if (sendCodeButton) {
    sendCodeButton.addEventListener("click", async () => {
        const emailInput = document.querySelector('input[name="email"]');
        sendCodeButton.disabled = true;
        sendCodeButton.textContent = "Sending...";
        try {
            const result = await request("/api/auth/send-code", {
                method: "POST",
                body: JSON.stringify({ email: emailInput.value })
            });
            const verificationCodeInput = document.querySelector('input[name="verificationCode"]');
            if (result.demoMode && result.demoCode && verificationCodeInput) {
                verificationCodeInput.value = result.demoCode;
                verificationCodeInput.focus();
            }
            const codeDetails = result.demoMode && result.demoCode
                ? ` Use demo code ${result.demoCode}. It has been filled in automatically.`
                : "";
            showMessage("register-message", "success", `${result.message}${codeDetails} The code is valid for 10 minutes.`);
            let remainingSeconds = 60;
            sendCodeButton.textContent = `Resend in ${remainingSeconds}s`;
            const countdown = window.setInterval(() => {
                remainingSeconds -= 1;
                if (remainingSeconds <= 0) {
                    window.clearInterval(countdown);
                    sendCodeButton.disabled = false;
                    sendCodeButton.textContent = "Get Demo Code";
                    return;
                }
                sendCodeButton.textContent = `Resend in ${remainingSeconds}s`;
            }, 1000);
        } catch (error) {
            showMessage("register-message", "error", error.message);
            sendCodeButton.disabled = false;
            sendCodeButton.textContent = "Get Demo Code";
        }
    });
}

const registerForm = document.getElementById("register-form");
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        try {
            const result = await request("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    displayName: formData.get("displayName"),
                    email: formData.get("email"),
                    verificationCode: formData.get("verificationCode"),
                    phone: formData.get("phone"),
                    inviteCode: formData.get("inviteCode"),
                    password: formData.get("password"),
                    confirmPassword: formData.get("confirmPassword")
                })
            });
            saveAuth(result);
            showMessage("register-message", "success", result.message);
            setTimeout(() => {
                window.location.href = "/home.html";
            }, 900);
        } catch (error) {
            showMessage("register-message", "error", error.message);
        }
    });
}

const logoutButton = document.getElementById("logout-btn");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        clearAuth();
        window.location.href = "/index.html";
    });
}

async function fetchCurrentUser() {
    const auth = getAuth();
    if (!auth || !auth.token) {
        window.location.href = "/index.html";
        return null;
    }
    try {
        const result = await request("/api/auth/me", {
            headers: {
                Authorization: `Bearer ${auth.token}`
            }
        });
        saveAuth({ ...auth, user: result.user, expiresAt: result.expiresAt });
        return result;
    } catch (error) {
        clearAuth();
        window.location.href = "/index.html";
        return null;
    }
}

const welcomeTitle = document.getElementById("welcome-title");
if (welcomeTitle) {
    fetchCurrentUser().then((result) => {
        if (!result) {
            return;
        }
        document.getElementById("welcome-title").textContent = `Welcome back, ${result.user.username}`;
        document.getElementById("session-tip").textContent = `Session valid until ${result.expiresAt}`;
        document.getElementById("profile-email").textContent = result.user.email || "-";
        document.getElementById("profile-name").textContent = result.user.username || "-";
        document.getElementById("profile-phone").textContent = result.user.phone || "-";
        document.getElementById("profile-role").textContent = result.user.role || "-";
    });
}

const homeUserName = document.getElementById("home-user-name");
if (homeUserName && !document.getElementById("runner-guarded-content")) {
    fetchCurrentUser().then((result) => {
        if (!result) {
            return;
        }
        applyRunnerAccessUi(result.user);
        document.getElementById("home-user-name").textContent = result.user.username || "Campus User";
        const pageIsOrders = Boolean(document.getElementById("order-list"));
        const isBanned = Boolean(result.user.banned);
        document.getElementById("home-session-tip").textContent = isBanned
            ? result.message
            : pageIsOrders
            ? `Current account: ${result.user.email || "-"}. Review your saved orders, open detail, and present the order status flow here.`
            : `Current account: ${result.user.email || "-"}. You can create a new order from this page.`;
        if (isBanned) {
            showMessage("order-message", "error", result.message);
        }
    });
}

const orderForm = document.getElementById("order-form");
if (orderForm) {
    const pickupLocationInput = document.getElementById("pickup-location-input");
    const deliveryLocationInput = document.getElementById("delivery-location-input");
    const latestTimeField = document.getElementById("latest-time-field");
    const locateButton = document.getElementById("locate-btn");
    const amountDetailsButton = document.getElementById("amount-details-btn");
    const amountModal = document.getElementById("amount-modal");
    const closeAmountModalButton = document.getElementById("close-amount-modal-btn");
    const orderTypeInput = document.getElementById("order-type-input");
    const syncSelectableChoices = (selector, inputName) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                buttons.forEach((item) => item.classList.remove("active"));
                button.classList.add("active");
                if (inputName) {
                    document.getElementById(inputName).value = button.dataset.orderType;
                }
                applyFeePreview(computeOrderFeePreview(readOrderFormState()));
            });
        });
    };

    const syncRadioChoices = (name) => {
        document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
            input.addEventListener("change", () => {
                document.querySelectorAll(`input[name="${name}"]`).forEach((item) => {
                    item.closest(".choice-card")?.classList.toggle("active-choice", item.checked);
                });
                if (name === "timeWindowType" && latestTimeField) {
                    latestTimeField.classList.toggle("hidden-panel", document.querySelector('input[name="timeWindowType"]:checked').value !== "TODAY_BEFORE");
                }
                applyFeePreview(computeOrderFeePreview(readOrderFormState()));
            });
        });
    };

    const readOrderFormState = () => {
        const formData = new FormData(orderForm);
        return {
            orderType: orderTypeInput.value,
            pickupMethod: formData.get("pickupMethod"),
            pickupLocation: formData.get("pickupLocation"),
            pickupNotes: formData.get("pickupNotes"),
            deliveryLocation: formData.get("deliveryLocation"),
            deliveryMethod: formData.get("deliveryMethod"),
            timeWindowType: formData.get("timeWindowType"),
            preferredLatestTime: formData.get("preferredLatestTime"),
            optionalTip: formData.get("optionalTip")
        };
    };

    syncSelectableChoices(".selectable-order-card", "order-type-input");
    syncRadioChoices("deliveryMethod");
    syncRadioChoices("timeWindowType");

    document.querySelectorAll('input[name="pickupMethod"], input[name="deliveryMethod"], #optional-tip-input, #pickup-location-input, #delivery-location-input').forEach((element) => {
        element.addEventListener("input", () => applyFeePreview(computeOrderFeePreview(readOrderFormState())));
        element.addEventListener("change", () => applyFeePreview(computeOrderFeePreview(readOrderFormState())));
    });

    if (locateButton) {
        locateButton.addEventListener("click", () => {
            if (!navigator.geolocation) {
                showMessage("order-message", "error", "Geolocation is not supported in this browser.");
                return;
            }
            locateButton.disabled = true;
            locateButton.textContent = "Locating...";
            navigator.geolocation.getCurrentPosition(async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                deliveryLocationInput.value = `Current location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                showMessage("order-message", "success", "Location captured. Converting it to an address...");
                const address = await reverseGeocode(latitude, longitude);
                deliveryLocationInput.value = address;
                applyFeePreview(computeOrderFeePreview(readOrderFormState()));
                locateButton.disabled = false;
                locateButton.textContent = "Get Current Location";
                showMessage("order-message", address.startsWith("Location detected,") ? "error" : "success",
                    address.startsWith("Location detected,")
                        ? "Location was detected, but the place name lookup is temporarily unavailable."
                        : "Current location converted to an address.");
            }, () => {
                locateButton.disabled = false;
                locateButton.textContent = "Get Current Location";
                showMessage("order-message", "error", "Unable to get your current location. You can type the delivery place manually.");
            }, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 20000
            });
        });
    }

    if (amountDetailsButton && amountModal) {
        amountDetailsButton.addEventListener("click", () => {
            amountModal.classList.remove("hidden-panel");
        });
    }

    if (closeAmountModalButton && amountModal) {
        closeAmountModalButton.addEventListener("click", () => {
            amountModal.classList.add("hidden-panel");
        });
    }

    if (amountModal) {
        amountModal.addEventListener("click", (event) => {
            if (event.target.dataset.closeModal === "true") {
                amountModal.classList.add("hidden-panel");
            }
        });
    }

    orderForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const auth = getAuth();
        try {
            const result = await request("/api/orders", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify(readOrderFormState())
            });
            showMessage(
                "order-message",
                "success",
                result.order.deliveryPin
                    ? `${result.message} Order ${result.order.orderNo} created. Your delivery PIN is ${result.order.deliveryPin}.`
                    : `${result.message} Order ${result.order.orderNo} created with photo proof delivery.`
            );
            orderForm.reset();
            orderTypeInput.value = "COLLECTION_TASK";
            document.querySelectorAll(".selectable-order-card").forEach((button, index) => button.classList.toggle("active", index === 0));
            document.querySelectorAll('input[name="deliveryMethod"]').forEach((input, index) => {
                input.checked = index === 0;
                input.closest(".choice-card")?.classList.toggle("active-choice", index === 0);
            });
            document.querySelectorAll('input[name="timeWindowType"]').forEach((input, index) => {
                input.checked = index === 0;
                input.closest(".choice-card")?.classList.toggle("active-choice", index === 0);
            });
            latestTimeField?.classList.add("hidden-panel");
            applyFeePreview(computeOrderFeePreview(readOrderFormState()));
        } catch (error) {
            showMessage("order-message", "error", error.message);
        }
    });

    fetchCurrentUser().then((result) => {
        if (!result) {
            return;
        }
        if (!pickupLocationInput.value && result.user.commonAddress) {
            pickupLocationInput.value = result.user.commonAddress;
        }
        if (deliveryLocationInput && !deliveryLocationInput.value && result.user.detailAddress) {
            deliveryLocationInput.value = result.user.detailAddress;
        }
        if (result.user.banned) {
            orderForm.querySelector('button[type="submit"]').disabled = true;
            showMessage("order-message", "error", result.message);
        }
        applyFeePreview(computeOrderFeePreview(readOrderFormState()));
    });
}

const orderList = document.getElementById("order-list");
if (orderList) {
    const refreshOrdersButton = document.getElementById("refresh-orders-btn");
    const cancelOrderButton = document.getElementById("cancel-order-btn");
    const appealOrderButton = document.getElementById("appeal-order-btn");
    const confirmReceiptButton = document.getElementById("confirm-receipt-btn");
    const reviewOrderButton = document.getElementById("review-order-btn");
    const detailAmountButton = document.getElementById("detail-amount-details-btn");
    const detailAmountModal = document.getElementById("detail-amount-modal");
    const closeDetailAmountModalButton = document.getElementById("close-detail-amount-modal-btn");
    const reviewPromptModal = document.getElementById("review-prompt-modal");
    const closeReviewPromptButton = document.getElementById("close-review-prompt-btn");
    const reviewNowButton = document.getElementById("review-now-btn");
    const reviewLaterButton = document.getElementById("review-later-btn");
    let currentOrderFilter = "ALL";
    let selectedOrderNo = null;
    let pendingReviewOrderNo = null;

    const loadOrders = async () => {
        const auth = getAuth();
        if (!auth || !auth.token) {
            return;
        }
        try {
            const orders = await request("/api/orders", {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            document.__customerOrders = orders;
            renderOrders(orders, currentOrderFilter);
            if (selectedOrderNo) {
                const matched = orders.find((item) => item.orderNo === selectedOrderNo);
                if (matched) {
                    await loadOrderDetail(selectedOrderNo);
                } else {
                    selectedOrderNo = null;
                    applyOrderDetail(null);
                }
            } else {
                applyOrderDetail(null);
            }
        } catch (error) {
            renderOrders([]);
            showMessage("order-message", "error", error.message);
        }
    };

    const loadOrderDetail = async (orderNo) => {
        const auth = getAuth();
        const order = await request(`/api/orders/${orderNo}`, {
            headers: {
                Authorization: `Bearer ${auth.token}`
            }
        });
        selectedOrderNo = orderNo;
        applyOrderDetail(order);
        document.querySelectorAll(".clickable-order-card").forEach((card) => {
            card.classList.toggle("active-order-card", card.dataset.orderNo === orderNo);
        });
    };

    const submitAppealForOrder = async (orderNo) => {
        const auth = getAuth();
        if (!orderNo) {
            return;
        }
        const reason = await appPrompt("Enter the appeal or after-sales reason:", { title: "Submit an Appeal", multiline: true, confirmText: "Submit Appeal" });
        if (reason === null || reason.trim() === "") {
            return;
        }
        try {
            const result = await request(`/api/orders/${orderNo}/appeal`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify({ reason: reason.trim() })
            });
            showMessage("order-message", "success", result.message);
            await loadOrders();
            await loadOrderDetail(orderNo);
        } catch (error) {
            showMessage("order-message", "error", error.message);
        }
    };

    if (refreshOrdersButton) {
        refreshOrdersButton.addEventListener("click", loadOrders);
    }

    if (detailAmountButton && detailAmountModal) {
        detailAmountButton.addEventListener("click", () => {
            detailAmountModal.classList.remove("hidden-panel");
        });
    }

    if (closeDetailAmountModalButton && detailAmountModal) {
        closeDetailAmountModalButton.addEventListener("click", () => {
            detailAmountModal.classList.add("hidden-panel");
        });
    }

    if (detailAmountModal) {
        detailAmountModal.addEventListener("click", (event) => {
            if (event.target.dataset.closeDetailModal === "true") {
                detailAmountModal.classList.add("hidden-panel");
            }
        });
    }

    if (closeReviewPromptButton && reviewPromptModal) {
        closeReviewPromptButton.addEventListener("click", () => {
            reviewPromptModal.classList.add("hidden-panel");
        });
    }

    if (reviewPromptModal) {
        reviewPromptModal.addEventListener("click", (event) => {
            if (event.target.dataset.closeReviewPrompt === "true") {
                reviewPromptModal.classList.add("hidden-panel");
            }
        });
    }

    if (reviewNowButton) {
        reviewNowButton.addEventListener("click", () => {
            if (reviewPromptModal) {
                reviewPromptModal.classList.add("hidden-panel");
            }
            openReviewPage(pendingReviewOrderNo);
        });
    }

    if (reviewLaterButton) {
        reviewLaterButton.addEventListener("click", async () => {
            if (reviewPromptModal) {
                reviewPromptModal.classList.add("hidden-panel");
            }
            await loadOrders();
            if (pendingReviewOrderNo) {
                await loadOrderDetail(pendingReviewOrderNo);
            }
        });
    }

    document.querySelectorAll("[data-order-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            currentOrderFilter = button.dataset.orderFilter || "ALL";
            document.querySelectorAll("[data-order-filter]").forEach((item) => {
                item.classList.toggle("active", item === button);
            });
            renderOrders(document.__customerOrders || [], currentOrderFilter);
        });
    });

    if (cancelOrderButton) {
        cancelOrderButton.addEventListener("click", async () => {
            const auth = getAuth();
            const orderNo = cancelOrderButton.dataset.orderNo;
            if (!orderNo) {
                return;
            }
            const reason = await appPrompt("Optional: enter a short cancellation reason:", { title: "Cancel Order", multiline: true, confirmText: "Continue" });
            if (reason === null) {
                return;
            }
            try {
                const result = await request(`/api/orders/${orderNo}/cancel`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: JSON.stringify({ reason: reason || "" })
                });
                showMessage("order-message", "success", result.message);
                await loadOrders();
                await loadOrderDetail(orderNo);
            } catch (error) {
                showMessage("order-message", "error", error.message);
            }
        });
    }

    if (appealOrderButton) {
        appealOrderButton.addEventListener("click", async () => {
            await submitAppealForOrder(appealOrderButton.dataset.orderNo);
        });
    }

    if (confirmReceiptButton) {
        confirmReceiptButton.addEventListener("click", async () => {
            const auth = getAuth();
            const orderNo = confirmReceiptButton.dataset.orderNo;
            if (!orderNo) {
                return;
            }
            try {
                const result = await request(`/api/orders/${orderNo}/confirm-receipt`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                });
                showMessage("order-message", "success", result.message);
                pendingReviewOrderNo = orderNo;
                await loadOrders();
                await loadOrderDetail(orderNo);
                if (reviewPromptModal) {
                    reviewPromptModal.classList.remove("hidden-panel");
                }
            } catch (error) {
                showMessage("order-message", "error", error.message);
            }
        });
    }

    if (reviewOrderButton) {
        reviewOrderButton.addEventListener("click", () => {
            openReviewPage(reviewOrderButton.dataset.orderNo);
        });
    }

    document.addEventListener("click", (event) => {
        const reviewActionButton = event.target.closest("[data-review-order]");
        if (reviewActionButton) {
            event.stopPropagation();
            openReviewPage(reviewActionButton.dataset.reviewOrder);
            return;
        }
        const appealActionButton = event.target.closest("[data-appeal-order]");
        if (appealActionButton) {
            event.stopPropagation();
            submitAppealForOrder(appealActionButton.dataset.appealOrder);
            return;
        }
        const card = event.target.closest(".clickable-order-card");
        if (!card || !document.getElementById("order-list")?.contains(card)) {
            return;
        }
        loadOrderDetail(card.dataset.orderNo).catch((error) => {
            showMessage("order-message", "error", error.message);
        });
    });

      fetchCurrentUser().then((result) => {
        if (!result) {
            return;
        }
        loadOrders();
    });
}

const reviewForm = document.getElementById("review-form");
if (reviewForm) {
    const query = new URLSearchParams(window.location.search);
    const reviewOrderNo = query.get("orderNo");
    const scoreLabels = Array.from(document.querySelectorAll('.review-score-row .filter-chip'));
    const reviewCommentInput = document.getElementById("review-comment-input");
    const reviewSubmitButton = reviewForm.querySelector('button[type="submit"]');
    const reviewSubmitRow = document.getElementById("review-submit-row");

    const setReviewFormDisabled = (disabled) => {
        scoreLabels.forEach((label) => {
                const input = label.querySelector('input');
                if (input) {
                    input.disabled = disabled;
                }
            label.classList.toggle("disabled-chip", disabled);
        });
        if (reviewCommentInput) {
            reviewCommentInput.disabled = disabled;
        }
        if (reviewSubmitButton) {
            reviewSubmitButton.disabled = disabled;
        }
    };

    scoreLabels.forEach((label) => {
        const input = label.querySelector("input");
        label.addEventListener("click", () => {
            if (input && input.disabled) {
                return;
            }
            const groupName = input ? input.name : "";
            scoreLabels
                .filter((item) => item.querySelector("input")?.name === groupName)
                .forEach((item) => item.classList.remove("active"));
            label.classList.add("active");
            if (input) {
                input.checked = true;
            }
        });
    });

    fetchCurrentUser().then(async (result) => {
        if (!result) {
            return;
        }
        if (!reviewOrderNo) {
            showMessage("review-message", "error", "Order number is missing.");
            setReviewFormDisabled(true);
            return;
        }
        try {
            const order = await request(`/api/orders/${reviewOrderNo}`, {
                headers: {
                    Authorization: `Bearer ${getAuth().token}`
                }
            });
            document.getElementById("review-order-no").textContent = order.orderNo || "-";
            document.getElementById("review-runner-name").textContent = order.runnerUsername || "Not assigned";
            document.getElementById("review-order-type").textContent = order.orderTypeLabel || "-";
            document.getElementById("review-completed-at").textContent = order.status === "DELIVERED"
                ? formatOrderDate(order.customerConfirmedAt || order.updatedAt)
                : "-";
            if (order.status !== "DELIVERED") {
                setReviewFormDisabled(true);
                showMessage("review-message", "error", "Only completed orders can be reviewed.");
                return;
            }
            if (order.runnerReviewScore != null) {
                const matchedRunnerScore = reviewForm.querySelector(`input[name="runnerScore"][value="${order.runnerReviewScore}"]`);
                if (matchedRunnerScore) {
                    matchedRunnerScore.checked = true;
                    matchedRunnerScore.closest(".filter-chip")?.classList.add("active");
                }
                if (reviewCommentInput) {
                    reviewCommentInput.value = order.reviewComment || "";
                }
                setReviewFormDisabled(true);
                if (reviewSubmitRow) {
                    reviewSubmitRow.hidden = true;
                }
            } else if (reviewSubmitRow) {
                reviewSubmitRow.hidden = false;
            }
        } catch (error) {
            setReviewFormDisabled(true);
            showMessage("review-message", "error", error.message);
        }
    });

    reviewForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const auth = getAuth();
        if (!reviewOrderNo) {
            showMessage("review-message", "error", "Order number is missing.");
            return;
        }
        const formData = new FormData(reviewForm);
        try {
                const result = await request(`/api/orders/${reviewOrderNo}/review`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: JSON.stringify({
                        runnerScore: Number(formData.get("runnerScore")),
                        comment: formData.get("comment")
                    })
                });
            showMessage("review-message", "success", result.message);
            setTimeout(() => {
                window.location.href = "/orders.html";
            }, 800);
        } catch (error) {
            showMessage("review-message", "error", error.message);
        }
    });
}

const profileForm = document.getElementById("profile-form");
if (profileForm) {
    document.querySelectorAll(".profile-menu-button").forEach((button) => {
        button.addEventListener("click", () => {
            activateProfilePanel(button.dataset.panel);
        });
    });

    fetchCurrentUser().then((result) => {
        if (!result) {
            return;
        }
        document.getElementById("profile-email-input").value = result.user.email || "";
        document.getElementById("profile-username-input").value = result.user.username || "";
        document.getElementById("profile-phone-input").value = result.user.phone || "";
        document.getElementById("profile-common-address-input").value = result.user.commonAddress || "";
        document.getElementById("profile-detail-address-input").value = result.user.detailAddress || "";
        applyProfileSummary(result.user);
        request("/api/orders", {
            headers: {
                Authorization: `Bearer ${getAuth().token}`
            }
        }).then((orders) => {
            applyProfileOrderStats(orders);
        }).catch(() => {
            applyProfileOrderStats([]);
        });
        if (result.user.role && String(result.user.role).toUpperCase() === "RUNNER") {
            request("/api/orders/runner/my", {
                headers: {
                    Authorization: `Bearer ${getAuth().token}`
                }
            }).then((runnerOrders) => {
                applyRunnerPerformanceSummary(runnerOrders);
            }).catch(() => {
                applyRunnerPerformanceSummary([]);
            });
        } else {
            applyRunnerPerformanceSummary([]);
        }
    });

    request("/api/auth/invite-records", {
        headers: {
            Authorization: `Bearer ${getAuth().token}`
        }
    }).then((result) => {
        renderInviteRecords(result);
    }).catch(() => {
        renderInviteRecords({ inviteCode: "-", totalInvites: 0, totalRewardPoints: 0, records: [] });
    });

    const applyRunnerButton = document.getElementById("apply-runner-btn");
    const revokeRunnerButton = document.getElementById("revoke-runner-btn");
    const claimWeeklyPointsButton = document.getElementById("claim-weekly-points-btn");
    const activateWeeklyCardButton = document.getElementById("activate-weekly-card-btn");
    const refreshPointHistoryButton = document.getElementById("refresh-point-history-btn");
    const weeklyCardModal = document.getElementById("weekly-card-modal");
    const closeWeeklyCardModalButton = document.getElementById("close-weekly-card-modal-btn");
    const confirmWeeklyCardButton = document.getElementById("confirm-weekly-card-btn");
    const loadPointHistory = async () => {
        const auth = getAuth();
        if (!auth || !auth.token) {
            renderPointHistory([]);
            return;
        }
        try {
            const records = await request("/api/auth/point-history", {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            renderPointHistory(records);
        } catch (error) {
            renderPointHistory([]);
        }
    };

    loadPointHistory();

    if (refreshPointHistoryButton) {
        refreshPointHistoryButton.addEventListener("click", () => {
            loadPointHistory();
        });
    }

    if (claimWeeklyPointsButton) {
        claimWeeklyPointsButton.addEventListener("click", async () => {
            const auth = getAuth();
            try {
                const result = await request("/api/auth/claim-weekly-points", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                });
                saveAuth({ ...auth, user: result.user, expiresAt: result.expiresAt });
                applyProfileSummary(result.user);
                showMessage("profile-message", "success", result.message);
                activateProfilePanel("points-panel");
                await loadPointHistory();
            } catch (error) {
                if (String(error.message || "").includes("already claimed")) {
                    await appAlert(error.message, { title: "Points Claim" });
                }
                showMessage("profile-message", "error", error.message);
            }
        });
    }

    if (activateWeeklyCardButton) {
        activateWeeklyCardButton.addEventListener("click", () => {
            if (weeklyCardModal) {
                weeklyCardModal.classList.remove("hidden-panel");
            }
        });
    }

    if (closeWeeklyCardModalButton && weeklyCardModal) {
        closeWeeklyCardModalButton.addEventListener("click", () => {
            weeklyCardModal.classList.add("hidden-panel");
        });
    }

    if (weeklyCardModal) {
        weeklyCardModal.addEventListener("click", (event) => {
            if (event.target.dataset.closeWeeklyCardModal === "true") {
                weeklyCardModal.classList.add("hidden-panel");
            }
        });
    }

    if (confirmWeeklyCardButton) {
        confirmWeeklyCardButton.addEventListener("click", async () => {
            const auth = getAuth();
            try {
                const result = await request("/api/auth/activate-weekly-card", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                });
                saveAuth({ ...auth, user: result.user, expiresAt: result.expiresAt });
                applyProfileSummary(result.user);
                if (weeklyCardModal) {
                    weeklyCardModal.classList.add("hidden-panel");
                }
                showMessage("profile-message", "success", result.message);
                activateProfilePanel("points-panel");
                await loadPointHistory();
            } catch (error) {
                showMessage("profile-message", "error", error.message);
            }
        });
    }

    if (applyRunnerButton) {
        applyRunnerButton.addEventListener("click", async () => {
            const auth = getAuth();
            try {
                const result = await request("/api/auth/apply-runner", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                });
                saveAuth({ ...auth, user: result.user, expiresAt: result.expiresAt });
                applyProfileSummary(result.user);
                showMessage("profile-message", "success", result.message);
                activateProfilePanel("runner-panel");
            } catch (error) {
                showMessage("profile-message", "error", error.message);
            }
        });
    }

    if (revokeRunnerButton) {
        revokeRunnerButton.addEventListener("click", async () => {
            const auth = getAuth();
            try {
                const result = await request("/api/auth/revoke-runner", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                });
                saveAuth({ ...auth, user: result.user, expiresAt: result.expiresAt });
                applyProfileSummary(result.user);
                showMessage("profile-message", "success", result.message);
                activateProfilePanel("overview-panel");
            } catch (error) {
                showMessage("profile-message", "error", error.message);
            }
        });
    }

    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const auth = getAuth();
        const formData = new FormData(profileForm);
        try {
            const result = await request("/api/auth/profile", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    username: formData.get("username"),
                    phone: formData.get("phone"),
                    commonAddress: formData.get("commonAddress"),
                    detailAddress: formData.get("detailAddress")
                })
            });
            saveAuth({ ...auth, user: result.user, expiresAt: result.expiresAt });
            applyProfileSummary(result.user);
            showMessage("profile-message", "success", result.message);
            activateProfilePanel("overview-panel");
        } catch (error) {
            showMessage("profile-message", "error", error.message);
        }
    });
}

const runnerAvailableList = document.getElementById("runner-available-list");
const runnerMyList = document.getElementById("runner-my-list");
if (runnerAvailableList || runnerMyList) {
    const refreshRunnerOrdersButton = document.getElementById("refresh-runner-orders-btn");
    const runnerSortSelect = document.getElementById("runner-sort-select");
    const runnerFilterControls = [
        document.getElementById("runner-location-filter"),
        document.getElementById("runner-min-points-filter"),
        document.getElementById("runner-time-filter"),
        document.getElementById("runner-type-filter")
    ].filter(Boolean);
    const clearRunnerFiltersButton = document.getElementById("runner-clear-filters");
    const isRunnerHallPage = Boolean(runnerAvailableList);
    const isRunnerOrdersPage = Boolean(runnerMyList);
    let selectedRunnerOrderNo = null;
    let currentRunnerOrderFilter = "ALL";

    const loadRunnerData = async () => {
        const auth = getAuth();
        const current = await fetchCurrentUser();
        if (!current) {
            return;
        }
        if (!current.user.role || String(current.user.role).toUpperCase() !== "RUNNER") {
            showMessage("runner-message", "error", "Runner access has not been activated for this account.");
            setTimeout(() => {
                window.location.href = "/profile.html";
            }, 1000);
            return;
        }

        const guardedRunnerContent = document.getElementById("runner-guarded-content");
        if (guardedRunnerContent) {
            guardedRunnerContent.classList.remove("hidden-panel");
        }

        const runnerHomeUserName = document.getElementById("home-user-name");
        const runnerSessionTip = document.getElementById("home-session-tip");
        if (runnerHomeUserName) {
            runnerHomeUserName.textContent = current.user.username || "Campus Runner";
        }
        if (isRunnerHallPage) {
            if (runnerSessionTip) {
                runnerSessionTip.textContent = `Runner account: ${current.user.email || "-"}. Browse open orders and accept tasks from this hall.`;
            }
            const availableOrders = await request(`/api/orders/runner/available?sort=${encodeURIComponent(runnerSortSelect?.value || "NEWEST")}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            document.__runnerAvailableOrders = availableOrders || [];
            applyRunnerAvailableFilters();
        }

        if (isRunnerOrdersPage) {
            if (runnerSessionTip) {
                runnerSessionTip.textContent = `Runner account: ${current.user.email || "-"}. Manage orders you have already accepted here.`;
            }
            const myOrders = await request("/api/orders/runner/my", {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            renderRunnerMyOrders(myOrders, currentRunnerOrderFilter);
            renderRunnerReviewRecords(myOrders);
            const runnerStats = computeRunnerPerformance(myOrders);
            const completedCount = document.getElementById("runner-completed-count");
            const averageRating = document.getElementById("runner-average-rating");
            if (completedCount) {
                completedCount.textContent = String(runnerStats.completedCount);
            }
            if (averageRating) {
                averageRating.textContent = runnerStats.averageRunnerScore == null ? "-" : `${runnerStats.averageRunnerScore.toFixed(1)} / 5`;
            }
            if (selectedRunnerOrderNo) {
                const selected = myOrders.find((item) => item.orderNo === selectedRunnerOrderNo);
                applyRunnerDetail(selected || null);
            } else {
                applyRunnerDetail(null);
            }
            document.querySelectorAll(".clickable-runner-card").forEach((card) => {
                card.classList.toggle("active-order-card", card.dataset.runnerOrderNo === selectedRunnerOrderNo);
            });
        }
    };

    if (refreshRunnerOrdersButton) {
        refreshRunnerOrdersButton.addEventListener("click", () => {
            loadRunnerData().catch((error) => {
                showMessage("runner-message", "error", error.message);
            });
        });
    }

    document.querySelectorAll("[data-runner-order-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            currentRunnerOrderFilter = button.dataset.runnerOrderFilter || "ALL";
            document.querySelectorAll("[data-runner-order-filter]").forEach((item) => {
                item.classList.toggle("active", item === button);
            });
            renderRunnerMyOrders(document.__runnerMyOrders || [], currentRunnerOrderFilter);
            document.querySelectorAll(".clickable-runner-card").forEach((card) => {
                card.classList.toggle("active-order-card", card.dataset.runnerOrderNo === selectedRunnerOrderNo);
            });
        });
    });

    if (runnerSortSelect) {
        runnerSortSelect.addEventListener("change", () => {
            loadRunnerData().catch((error) => {
                showMessage("runner-message", "error", error.message);
            });
        });
    }

    runnerFilterControls.forEach((control) => {
        control.addEventListener(control.tagName === "INPUT" ? "input" : "change", applyRunnerAvailableFilters);
    });

    if (clearRunnerFiltersButton) {
        clearRunnerFiltersButton.addEventListener("click", () => {
            const locationFilter = document.getElementById("runner-location-filter");
            const pointsFilter = document.getElementById("runner-min-points-filter");
            const timeFilter = document.getElementById("runner-time-filter");
            const typeFilter = document.getElementById("runner-type-filter");
            if (locationFilter) locationFilter.value = "";
            if (pointsFilter) pointsFilter.value = "";
            if (timeFilter) timeFilter.value = "ALL";
            if (typeFilter) typeFilter.value = "ALL";
            applyRunnerAvailableFilters();
        });
    }

    document.addEventListener("click", async (event) => {
        const acceptButton = event.target.closest("[data-runner-accept]");
        const advanceButton = event.target.closest("[data-runner-advance]");
        const auth = getAuth();

        if (acceptButton) {
            event.stopPropagation();
            try {
                const result = await request(`/api/orders/${acceptButton.dataset.runnerAccept}/accept`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                });
                showMessage("runner-message", "success", `${result.message} ${result.order.orderNo}. Open My Accepted Orders to manage it.`);
                selectedRunnerOrderNo = null;
                await loadRunnerData();
            } catch (error) {
                showMessage("runner-message", "error", error.message);
            }
        }

        if (advanceButton && isRunnerOrdersPage) {
            event.stopPropagation();
            try {
                let requestBody;
                let requestUrl = `/api/orders/${advanceButton.dataset.runnerAdvance}/runner-advance`;
                const runnerOrders = Array.isArray(document.__runnerMyOrders) ? document.__runnerMyOrders : [];
                const targetOrder = runnerOrders.find((item) => item.orderNo === advanceButton.dataset.runnerAdvance);
                if (targetOrder && targetOrder.status === "PICKED_UP" && targetOrder.deliveryMethod === "PIN_IN_PERSON") {
                    const enteredPin = await appPrompt("Enter the customer's delivery PIN to complete this order:", { title: "Confirm Delivery", confirmText: "Complete Order" });
                    if (enteredPin === null) {
                        return;
                    }
                    requestBody = JSON.stringify({ pin: enteredPin.trim() });
                } else if (targetOrder && targetOrder.status === "PICKED_UP" && targetOrder.deliveryMethod === "LEAVE_AND_PHOTO") {
                    const proof = await openPhotoProofDialog();
                    if (!proof) return;
                    const formData = new FormData();
                    formData.append("file", proof.file);
                    formData.append("note", proof.note);
                    requestBody = formData;
                    requestUrl = `/api/orders/${advanceButton.dataset.runnerAdvance}/photo-proof`;
                }
                const result = await request(requestUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: requestBody
                });
                showMessage("runner-message", "success", `${result.message} ${result.order.statusLabel}`);
                selectedRunnerOrderNo = result.order.orderNo;
                await loadRunnerData();
            } catch (error) {
                showMessage("runner-message", "error", error.message);
            }
        }

        const giveUpButton = event.target.closest("[data-runner-give-up]");
        if (giveUpButton && isRunnerOrdersPage) {
            event.stopPropagation();
            const reason = await appPrompt("Optional: enter a short give-up reason:", { title: "Give Up Order", multiline: true, confirmText: "Continue" });
            if (reason === null) {
                return;
            }
            try {
                const result = await request(`/api/orders/${giveUpButton.dataset.runnerGiveUp}/give-up`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: JSON.stringify({ reason: reason || "" })
                });
                showMessage("runner-message", "success", result.message);
                selectedRunnerOrderNo = null;
                try {
                    await loadRunnerData();
                } catch (loadError) {
                    showMessage("runner-message", "error", `${result.message} ${loadError.message}`);
                }
            } catch (error) {
                showMessage("runner-message", "error", error.message);
            }
        }
    });

    document.addEventListener("click", (event) => {
        if (!isRunnerOrdersPage) {
            return;
        }
        const card = event.target.closest(".clickable-runner-card");
        if (!card) {
            return;
        }
        selectedRunnerOrderNo = card.dataset.runnerOrderNo;
        const runnerOrders = Array.isArray(document.__runnerMyOrders) ? document.__runnerMyOrders : [];
        const completedCards = document.getElementById("runner-completed-list");
        const activeCards = document.getElementById("runner-my-list");
        const selected = runnerOrders.find((item) => item.orderNo === selectedRunnerOrderNo);
        applyRunnerDetail(selected || null);
        [...(activeCards?.querySelectorAll(".clickable-runner-card") || []), ...(completedCards?.querySelectorAll(".clickable-runner-card") || [])]
            .forEach((node) => node.classList.toggle("active-order-card", node.dataset.runnerOrderNo === selectedRunnerOrderNo));
    });

    loadRunnerData().catch((error) => {
        showMessage("runner-message", "error", error.message);
    });
}

const adminLayout = document.querySelector(".admin-layout");
if (adminLayout) {
    let adminCurrentView = "dashboard";
    let adminUsers = [];
    let adminOrders = [];
    let adminReviews = [];
    const adminModal = document.getElementById("admin-modal");
    const adminModalForm = document.getElementById("admin-modal-form");
    const authHeaders = () => ({ Authorization: `Bearer ${getAuth().token}` });

    const escapeAdminText = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    const isAdminActiveOrder = (order) => ["PLACED", "ACCEPTED", "PICKED_UP", "AWAITING_CUSTOMER_CONFIRMATION"].includes(order.status);
    const roleLabel = (role) => {
        const normalized = String(role || "USER").toUpperCase();
        if (normalized === "ADMIN") return "Admin";
        if (normalized === "RUNNER") return "Runner";
        return "User";
    };
    const runnerApplicationLabel = (status) => {
        const normalized = String(status || "NONE").toUpperCase();
        if (normalized === "PENDING") return "Pending";
        if (normalized === "APPROVED") return "Approved";
        if (normalized === "REJECTED") return "Rejected";
        return "None";
    };
    const statusLabel = (order) => order.statusLabel || order.status || "-";
    const userOptions = (selectedId, includeBlank = false) => `${includeBlank ? '<option value="">Unassigned</option>' : ""}${adminUsers.map((user) => `<option value="${user.id}" ${String(selectedId || "") === String(user.id) ? "selected" : ""}>${escapeAdminText(user.username || user.email || user.id)}</option>`).join("")}`;

    const renderAdminStats = (stats) => {
        document.getElementById("admin-total-users").textContent = String(stats.totalUsers || 0);
        document.getElementById("admin-runner-users").textContent = String(stats.runnerUsers || 0);
        document.getElementById("admin-admin-users").textContent = String(stats.adminUsers || 0);
        document.getElementById("admin-total-orders").textContent = String(stats.totalOrders || 0);
        document.getElementById("admin-active-orders").textContent = String(stats.activeOrders || 0);
        document.getElementById("admin-completed-orders").textContent = String(stats.completedOrders || 0);
        document.getElementById("admin-cancelled-orders").textContent = String(stats.cancelledOrders || 0);
        document.getElementById("admin-banned-users").textContent = String(stats.bannedUsers || 0);
        document.getElementById("admin-open-appeals").textContent = String(stats.openAppeals || 0);
        document.getElementById("admin-points-spent").textContent = formatPoints(stats.totalPointsSpent || 0);
    };

    const switchAdminView = (view) => {
        adminCurrentView = view;
        const titleMap = { dashboard: "Dashboard", users: "User Management", orders: "Order Management", reviews: "Rating Management" };
        document.getElementById("admin-page-title").textContent = titleMap[view];
        document.getElementById("admin-section-title").textContent = titleMap[view];
        document.getElementById("admin-create-btn").hidden = view === "dashboard" || view === "reviews";
        document.querySelectorAll(".admin-view").forEach((panel) => panel.classList.toggle("hidden-panel", panel.id !== `admin-${view}-view`));
        document.querySelectorAll(".admin-nav-item").forEach((button) => button.classList.toggle("active", button.dataset.adminView === view));
    };

    const renderAdminUsers = () => {
        const keyword = (document.getElementById("admin-user-search").value || "").trim().toLowerCase();
        const roleFilter = document.getElementById("admin-user-role-filter").value;
        const filtered = adminUsers.filter((user) => {
            const role = String(user.role || "USER").toUpperCase();
            const haystack = `${user.id} ${user.username || ""} ${user.email || ""} ${user.phone || ""}`.toLowerCase();
            return (!keyword || haystack.includes(keyword)) && (roleFilter === "ALL" || role === roleFilter);
        });
        document.getElementById("admin-user-list").innerHTML = filtered.length === 0
            ? '<tr><td colspan="11" class="admin-empty-cell">No user records.</td></tr>'
            : filtered.map((user) => `
                <tr>
                    <td><input type="checkbox" data-admin-user-select="${user.id}"></td>
                    <td>${user.id}</td>
                    <td>${escapeAdminText(user.username || "-")}</td>
                    <td>${escapeAdminText(user.email || "-")}</td>
                    <td>${escapeAdminText(user.phone || "-")}</td>
                    <td><span class="admin-badge admin-badge-blue">${roleLabel(user.role)}</span></td>
                    <td><span class="admin-badge admin-badge-pink">${runnerApplicationLabel(user.runnerApplicationStatus)}</span></td>
                    <td>${Number(user.points || 0)}</td>
                    <td><span class="admin-badge ${user.banned ? "admin-badge-pink" : "admin-badge-green"}">${user.banned ? "Banned" : (user.verified ? "Active" : "Unverified")}</span></td>
                    <td>${Number(user.cancellationCount || 0)} cancel / ${Number(user.runnerGiveUpCount || 0)} give-up</td>
                    <td class="admin-row-actions">
                        <button type="button" data-admin-detail-user="${user.id}">Details</button>
                        ${String(user.runnerApplicationStatus || "").toUpperCase() === "PENDING" ? `
                            <button type="button" data-admin-approve-runner="${user.id}">Approve</button>
                            <button type="button" data-admin-reject-runner="${user.id}">Reject</button>
                        ` : ""}
                        <button type="button" data-admin-edit-user="${user.id}">Edit</button>
                        <button type="button" data-admin-delete-user="${user.id}">Delete</button>
                    </td>
                </tr>
            `).join("");
    };

    const renderAdminOrders = () => {
        const keyword = (document.getElementById("admin-order-search").value || "").trim().toLowerCase();
        const filter = document.getElementById("admin-order-filter").value;
        const filtered = adminOrders.filter((order) => {
            const haystack = `${order.orderNo || ""} ${order.customerUsername || ""} ${order.runnerUsername || ""} ${order.pickupLocation || ""} ${order.deliveryLocation || ""}`.toLowerCase();
            const statusOk = filter === "ALL"
                || (filter === "ACTIVE" && isAdminActiveOrder(order))
                || (filter === "CANCELLED" && String(order.status || "").startsWith("CANCELLED"))
                || (filter === "APPEAL_OPEN" && String(order.appealStatus || "").toUpperCase() === "OPEN")
                || order.status === filter;
            return (!keyword || haystack.includes(keyword)) && statusOk;
        });
        document.getElementById("admin-order-list").innerHTML = filtered.length === 0
            ? '<tr><td colspan="11" class="admin-empty-cell">No order records.</td></tr>'
            : filtered.map((order) => `
                <tr>
                    <td><input type="checkbox" data-admin-order-select="${escapeAdminText(order.orderNo || "")}"></td>
                    <td>${escapeAdminText(order.orderNo || "-")}</td>
                    <td>${escapeAdminText(order.orderTypeLabel || "-")}</td>
                    <td>${escapeAdminText(order.customerUsername || "-")}</td>
                    <td>${escapeAdminText(order.runnerUsername || "Unassigned")}</td>
                    <td>${escapeAdminText(order.pickupLocation || "-")}</td>
                    <td>${escapeAdminText(order.deliveryLocation || "-")}</td>
                    <td>${Number(order.pointsCost || 0)}</td>
                    <td><span class="admin-badge admin-badge-green">${escapeAdminText(statusLabel(order))}</span></td>
                    <td><span class="admin-badge ${String(order.appealStatus || "NONE").toUpperCase() === "OPEN" ? "admin-badge-pink" : "admin-badge-blue"}">${formatAppealStatus(order)}</span></td>
                    <td class="admin-row-actions">
                        <button type="button" data-admin-detail-order="${escapeAdminText(order.orderNo)}">Details</button>
                        ${String(order.appealStatus || "NONE").toUpperCase() === "OPEN" ? `<button type="button" data-admin-resolve-appeal="${escapeAdminText(order.orderNo)}">Resolve Appeal</button>` : ""}
                        <button type="button" data-admin-edit-order="${escapeAdminText(order.orderNo)}">Edit</button>
                        <button type="button" data-admin-delete-order="${escapeAdminText(order.orderNo)}">Delete</button>
                    </td>
                </tr>
            `).join("");
    };

    const renderAdminReviews = () => {
        const keyword = (document.getElementById("admin-review-search").value || "").trim().toLowerCase();
        const filter = document.getElementById("admin-review-filter").value;
        const filtered = adminReviews.filter((order) => {
            const hasScore = order.runnerReviewScore != null;
            const haystack = `${order.orderNo || ""} ${order.customerUsername || ""} ${order.runnerUsername || ""} ${order.reviewComment || ""}`.toLowerCase();
            return (!keyword || haystack.includes(keyword))
                && (filter === "ALL" || (filter === "RATED" && hasScore) || (filter === "UNRATED" && !hasScore));
        });
        document.getElementById("admin-review-list").innerHTML = filtered.length === 0
            ? '<tr><td colspan="7" class="admin-empty-cell">No rating records.</td></tr>'
            : filtered.map((order) => `
                <tr>
                    <td>${escapeAdminText(order.orderNo || "-")}</td>
                    <td>${escapeAdminText(order.customerUsername || "-")}</td>
                    <td>${escapeAdminText(order.runnerUsername || "Unassigned")}</td>
                    <td>${escapeAdminText(order.orderTypeLabel || "-")}</td>
                    <td><span class="admin-badge admin-badge-pink">${order.runnerReviewScore == null ? "Unrated" : `${order.runnerReviewScore} / 5`}</span></td>
                    <td>${escapeAdminText(order.reviewComment || "-")}</td>
                    <td>${formatOrderDate(order.reviewedAt)}</td>
                </tr>
            `).join("");
    };

    const openAdminModal = (title, html, onSubmit) => {
        document.getElementById("admin-modal-title").textContent = title;
        adminModalForm.innerHTML = html;
        adminModalForm.onsubmit = async (event) => {
            event.preventDefault();
            try {
                await onSubmit(new FormData(adminModalForm));
                adminModal.classList.add("hidden-panel");
                showMessage("admin-message", "success", "Operation completed.");
                await loadAdminData();
            } catch (error) {
                showMessage("admin-message", "error", error.message);
            }
        };
        adminModal.classList.remove("hidden-panel");
    };

    const readonlyDetail = (title, rows) => openAdminModal(title, rows.map(([label, value]) => `
        <label><span>${label}</span><input value="${escapeAdminText(value || "-")}" readonly></label>
    `).join("") + '<button class="primary-btn" type="submit">Close</button>', async () => adminModal.classList.add("hidden-panel"));

    const adminOrderDetail = (order) => {
        const proofUrl = String(order.photoProofUrl || "");
        const safeProofUrl = /^\/uploads\/photo-proofs\/[A-Za-z0-9._-]+$/.test(proofUrl) ? proofUrl : "";
        const rows = [
            ["Order No.", order.orderNo],
            ["Type", order.orderTypeLabel],
            ["Customer", order.customerUsername],
            ["Runner", order.runnerUsername || "Unassigned"],
            ["Pickup", order.pickupLocation],
            ["Delivery", order.deliveryLocation],
            ["Delivery Method", order.deliveryMethod === "PIN_IN_PERSON" ? "PIN in person" : order.deliveryMethod === "LEAVE_AND_PHOTO" ? "Photo proof" : order.deliveryMethod],
            ["Delivery PIN", order.deliveryPin || "Not applicable"],
            ["Proof Status", order.deliveryProofStatus],
            ["Points", order.pointsCost],
            ["Status", statusLabel(order)],
            ["Appeal Status", formatAppealStatus(order)],
            ["Appeal Detail", formatAppealDetail(order)],
            ["Notes", order.pickupNotes]
        ];
        const proofHtml = `
            <div class="admin-order-proof">
                <span>Delivery Photo</span>
                ${safeProofUrl
                    ? `<a href="${safeProofUrl}" target="_blank" rel="noopener noreferrer"><img src="${safeProofUrl}" alt="Delivery proof for order ${escapeAdminText(order.orderNo || "")}"></a>`
                    : '<div class="admin-order-proof-empty">No photo proof uploaded</div>'}
                ${order.photoProofNote ? `<small>${escapeAdminText(order.photoProofNote)}</small>` : ""}
            </div>`;
        openAdminModal("Order Details", rows.map(([label, value]) => `
            <label><span>${label}</span><input value="${escapeAdminText(value ?? "-")}" readonly></label>
        `).join("") + proofHtml + '<button class="primary-btn" type="submit">Close</button>', async () => adminModal.classList.add("hidden-panel"));
    };

    const userFormHtml = (user = {}) => `
        <label><span>Name</span><input name="username" value="${escapeAdminText(user.username || "")}" required></label>
        <label><span>Email</span><input name="email" type="email" value="${escapeAdminText(user.email || "")}" ${user.id ? "readonly" : "required"}></label>
        <label><span>Phone</span><input name="phone" value="${escapeAdminText(user.phone || "")}" required></label>
        ${user.id ? "" : '<label><span>Password</span><input name="password" type="password" value="123456" required></label>'}
        <label><span>Role</span><select name="role">
            <option value="user" ${String(user.role || "").toUpperCase() === "USER" ? "selected" : ""}>User</option>
            <option value="RUNNER" ${String(user.role || "").toUpperCase() === "RUNNER" ? "selected" : ""}>Runner</option>
            <option value="ADMIN" ${String(user.role || "").toUpperCase() === "ADMIN" ? "selected" : ""}>Admin</option>
        </select></label>
        <label><span>Points</span><input name="points" type="number" min="0" step="1" value="${Number(user.points || 0)}"></label>
        ${user.id ? `<label><span>Status</span><select name="verified"><option value="true" ${user.verified ? "selected" : ""}>Active</option><option value="false" ${!user.verified ? "selected" : ""}>Unverified</option></select></label>` : ""}
        <button class="primary-btn" type="submit">Save</button>
    `;

    const orderFormHtml = (order = {}) => `
        <label><span>Customer</span><select name="userId" required>${userOptions(order.userId)}</select></label>
        <label><span>Runner</span><select name="runnerId">${userOptions(order.runnerId, true)}</select></label>
        <label><span>Order Type</span><input name="orderTypeLabel" value="${escapeAdminText(order.orderTypeLabel || "Parcel Collect")}" required></label>
        <label><span>Type Code</span><input name="orderType" value="${escapeAdminText(order.orderType || "COLLECTION_TASK")}" required></label>
        <label><span>Pickup Location</span><input name="pickupLocation" value="${escapeAdminText(order.pickupLocation || "")}" required></label>
        <label><span>Pickup Notes</span><input name="pickupNotes" value="${escapeAdminText(order.pickupNotes || "")}"></label>
        <label><span>Delivery Location</span><input name="deliveryLocation" value="${escapeAdminText(order.deliveryLocation || "")}" required></label>
        <label><span>Delivery Method</span><select name="deliveryMethod"><option value="PIN_IN_PERSON" ${order.deliveryMethod !== "LEAVE_AND_PHOTO" ? "selected" : ""}>PIN In Person</option><option value="LEAVE_AND_PHOTO" ${order.deliveryMethod === "LEAVE_AND_PHOTO" ? "selected" : ""}>Leave and Photo</option></select></label>
        <label><span>Time Window</span><input name="timeWindowLabel" value="${escapeAdminText(order.timeWindowLabel || "Admin scheduled")}"></label>
        <label><span>Points</span><input name="pointsCost" type="number" min="0" step="1" value="${Number(order.pointsCost || 0)}"></label>
        <label><span>Status</span><select name="status">
            ${["PLACED", "ACCEPTED", "PICKED_UP", "AWAITING_CUSTOMER_CONFIRMATION", "DELIVERED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN"].map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select></label>
        <button class="primary-btn" type="submit">Save</button>
    `;

    const formToOrderPayload = (formData) => ({
        userId: Number(formData.get("userId")),
        runnerId: formData.get("runnerId") ? Number(formData.get("runnerId")) : null,
        orderType: formData.get("orderType"),
        orderTypeLabel: formData.get("orderTypeLabel"),
        pickupLocation: formData.get("pickupLocation"),
        pickupNotes: formData.get("pickupNotes"),
        deliveryLocation: formData.get("deliveryLocation"),
        deliveryMethod: formData.get("deliveryMethod"),
        timeWindowLabel: formData.get("timeWindowLabel"),
        pointsCost: Number(formData.get("pointsCost") || 0),
        status: formData.get("status")
    });

    const selectedAdminUserIds = () => Array.from(document.querySelectorAll("[data-admin-user-select]:checked"))
        .map((node) => Number(node.dataset.adminUserSelect))
        .filter((value) => Number.isFinite(value));

    const selectedAdminOrderNos = () => Array.from(document.querySelectorAll("[data-admin-order-select]:checked"))
        .map((node) => node.dataset.adminOrderSelect)
        .filter(Boolean);

    const runBulkUserAction = async (action) => {
        const userIds = selectedAdminUserIds();
        if (userIds.length === 0) {
            showMessage("admin-message", "error", "Please choose at least one user.");
            return;
        }
        const reason = action === "BAN" ? await appPrompt("Enter the reason for banning the selected users:", { title: "Ban Users", multiline: true, confirmText: "Ban Users" }) : "";
        if (action === "BAN" && (reason === null || reason.trim() === "")) {
            return;
        }
        if (action === "DELETE" && !await appConfirm("Delete the selected users? Their related orders will also be deleted.", { title: "Delete Users", confirmText: "Delete" })) {
            return;
        }
        await request("/api/admin/users/bulk", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ action, reason: reason || "", userIds })
        });
        showMessage("admin-message", "success", "Bulk user action completed.");
        await loadAdminData();
    };

    const runBulkOrderAction = async (action) => {
        const orderNos = selectedAdminOrderNos();
        if (orderNos.length === 0) {
            showMessage("admin-message", "error", "Please choose at least one order.");
            return;
        }
        const reason = action === "CANCEL" ? await appPrompt("Enter the cancellation reason:", { title: "Cancel Orders", multiline: true, confirmText: "Cancel Orders" }) : "";
        if (action === "CANCEL" && reason === null) {
            return;
        }
        if (action === "DELETE" && !await appConfirm("Delete the selected orders?", { title: "Delete Orders", confirmText: "Delete" })) {
            return;
        }
        await request("/api/admin/orders/bulk", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ action, reason: reason || "", orderNos })
        });
        showMessage("admin-message", "success", "Bulk order action completed.");
        await loadAdminData();
    };

    const loadAdminData = async () => {
        const current = await fetchCurrentUser();
        if (!current) return;
        if (!current.user.role || String(current.user.role).toUpperCase() !== "ADMIN") {
            showMessage("admin-message", "error", "Admin access is required.");
            setTimeout(() => { window.location.href = "/home.html"; }, 900);
            return;
        }
        document.getElementById("admin-user-name").textContent = buildAvatarText(current.user.username);
        const [stats, users, orders, reviews] = await Promise.all([
            request("/api/admin/stats", { headers: authHeaders() }),
            request("/api/admin/users", { headers: authHeaders() }),
            request("/api/admin/orders", { headers: authHeaders() }),
            request("/api/admin/reviews", { headers: authHeaders() })
        ]);
        adminUsers = users;
        adminOrders = orders;
        adminReviews = reviews;
        renderAdminStats(stats);
        renderAdminUsers();
        renderAdminOrders();
        renderAdminReviews();
    };

    document.querySelectorAll(".admin-nav-item").forEach((button) => {
        button.addEventListener("click", () => switchAdminView(button.dataset.adminView));
    });
    document.getElementById("refresh-admin-btn").addEventListener("click", () => loadAdminData().catch((error) => showMessage("admin-message", "error", error.message)));
    ["admin-user-search", "admin-user-role-filter"].forEach((id) => document.getElementById(id).addEventListener("input", renderAdminUsers));
    ["admin-order-search", "admin-order-filter"].forEach((id) => document.getElementById(id).addEventListener("input", renderAdminOrders));
    ["admin-review-search", "admin-review-filter"].forEach((id) => document.getElementById(id).addEventListener("input", renderAdminReviews));
    document.getElementById("admin-bulk-ban-users").addEventListener("click", () => runBulkUserAction("BAN").catch((error) => showMessage("admin-message", "error", error.message)));
    document.getElementById("admin-bulk-unban-users").addEventListener("click", () => runBulkUserAction("UNBAN").catch((error) => showMessage("admin-message", "error", error.message)));
    document.getElementById("admin-bulk-delete-users").addEventListener("click", () => runBulkUserAction("DELETE").catch((error) => showMessage("admin-message", "error", error.message)));
    document.getElementById("admin-bulk-cancel-orders").addEventListener("click", () => runBulkOrderAction("CANCEL").catch((error) => showMessage("admin-message", "error", error.message)));
    document.getElementById("admin-bulk-delete-orders").addEventListener("click", () => runBulkOrderAction("DELETE").catch((error) => showMessage("admin-message", "error", error.message)));
    document.querySelectorAll("[data-admin-close-modal]").forEach((node) => node.addEventListener("click", () => adminModal.classList.add("hidden-panel")));

    document.getElementById("admin-create-btn").addEventListener("click", () => {
        if (adminCurrentView === "users") {
            openAdminModal("Create User", userFormHtml(), async (formData) => {
                await request("/api/admin/users", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        username: formData.get("username"),
                        email: formData.get("email"),
                        phone: formData.get("phone"),
                        password: formData.get("password"),
                        role: formData.get("role"),
                        points: Number(formData.get("points") || 0)
                    })
                });
            });
        } else if (adminCurrentView === "orders") {
            openAdminModal("Create Order", orderFormHtml(), async (formData) => {
                await request("/api/admin/orders", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(formToOrderPayload(formData))
                });
            });
        }
    });

    document.addEventListener("click", async (event) => {
        const userId = event.target.closest("[data-admin-detail-user], [data-admin-edit-user], [data-admin-delete-user], [data-admin-approve-runner], [data-admin-reject-runner]")?.dataset;
        const orderDataset = event.target.closest("[data-admin-detail-order], [data-admin-edit-order], [data-admin-delete-order], [data-admin-resolve-appeal]")?.dataset;

        if (userId?.adminDetailUser) {
            const user = adminUsers.find((item) => String(item.id) === userId.adminDetailUser);
            readonlyDetail("User Details", [
                ["User ID", user.id],
                ["Name", user.username],
                ["Email", user.email],
                ["Phone", user.phone],
                ["Role", roleLabel(user.role)],
                ["Runner Application", runnerApplicationLabel(user.runnerApplicationStatus)],
                ["Application Requested At", formatOrderDate(user.runnerApplicationRequestedAt)],
                ["Application Reviewed At", formatOrderDate(user.runnerApplicationReviewedAt)],
                ["Points", user.points],
                ["Status", user.banned ? "Banned" : (user.verified ? "Active" : "Unverified")],
                ["Ban Reason", user.banReason || "-"],
                ["Cancellation Count", user.cancellationCount || 0],
                ["Runner Give-up Count", user.runnerGiveUpCount || 0]
            ]);
        } else if (userId?.adminApproveRunner) {
            await request(`/api/admin/users/${userId.adminApproveRunner}/runner-application/approve`, { method: "POST", headers: authHeaders() });
            showMessage("admin-message", "success", "Runner application approved.");
            await loadAdminData();
        } else if (userId?.adminRejectRunner) {
            await request(`/api/admin/users/${userId.adminRejectRunner}/runner-application/reject`, { method: "POST", headers: authHeaders() });
            showMessage("admin-message", "success", "Runner application rejected.");
            await loadAdminData();
        } else if (userId?.adminEditUser) {
            const user = adminUsers.find((item) => String(item.id) === userId.adminEditUser);
            openAdminModal("Edit User", userFormHtml(user), async (formData) => {
                await request(`/api/admin/users/${user.id}`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        username: formData.get("username"),
                        phone: formData.get("phone"),
                        role: formData.get("role"),
                        points: Number(formData.get("points") || 0),
                        verified: formData.get("verified") === "true"
                    })
                });
            });
        } else if (userId?.adminDeleteUser) {
            if (await appConfirm("Delete this user? Their related orders will also be deleted.", { title: "Delete User", confirmText: "Delete" })) {
                await request(`/api/admin/users/${userId.adminDeleteUser}`, { method: "DELETE", headers: authHeaders() });
                await loadAdminData();
            }
        } else if (orderDataset?.adminDetailOrder) {
            const order = adminOrders.find((item) => item.orderNo === orderDataset.adminDetailOrder);
            adminOrderDetail(order);
        } else if (orderDataset?.adminResolveAppeal) {
            const resolution = await appPrompt("Enter the appeal resolution:", { title: "Resolve Appeal", multiline: true, confirmText: "Resolve Appeal" });
            if (resolution === null || resolution.trim() === "") {
                return;
            }
            await request(`/api/admin/orders/${encodeURIComponent(orderDataset.adminResolveAppeal)}/appeal/resolve`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ resolution: resolution.trim() })
            });
            showMessage("admin-message", "success", "Appeal resolved.");
            await loadAdminData();
        } else if (orderDataset?.adminEditOrder) {
            const order = adminOrders.find((item) => item.orderNo === orderDataset.adminEditOrder);
            openAdminModal("Edit Order", orderFormHtml(order), async (formData) => {
                await request(`/api/admin/orders/${encodeURIComponent(order.orderNo)}`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(formToOrderPayload(formData))
                });
            });
        } else if (orderDataset?.adminDeleteOrder) {
            if (await appConfirm("Delete this order?", { title: "Delete Order", confirmText: "Delete" })) {
                await request(`/api/admin/orders/${encodeURIComponent(orderDataset.adminDeleteOrder)}`, { method: "DELETE", headers: authHeaders() });
                await loadAdminData();
            }
        }
    });

    switchAdminView("dashboard");
    loadAdminData().catch((error) => showMessage("admin-message", "error", error.message));
}
