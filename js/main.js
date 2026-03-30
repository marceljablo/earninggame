// Main application controller
let currentView = 'landing';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (checkAuth()) {
        if (currentUser.username === 'admin') {
            await renderAdminDashboard();
            currentView = 'admin';
        } else {
            await renderUserDashboard();
            currentView = 'dashboard';
        }
    } else {
        await renderLandingPage();
        currentView = 'landing';
    }
    
    setupEventListeners();
});

// Render landing page
async function renderLandingPage() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="row justify-content-center fade-in">
            <div class="col-lg-8">
                <div class="card text-center">
                    <div class="card-body py-5">
                        <i class="fas fa-graduation-cap fa-4x text-primary mb-3"></i>
                        <h1 class="display-4">Welcome to <span class="text-primary">EduEarn</span></h1>
                        <p class="lead">Learn, Answer, and Earn Real Cash!</p>
                        <div class="row mt-4">
                            <div class="col-md-4 mb-3">
                                <div class="p-3 border rounded">
                                    <i class="fas fa-brain fa-2x text-info"></i>
                                    <h5>Science & Math & History</h5>
                                    <small>Answer questions from various subjects</small>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="p-3 border rounded">
                                    <i class="fas fa-coins fa-2x text-warning"></i>
                                    <h5>Earn Per Question</h5>
                                    <small>₱0.0001 - ₱0.001 per correct answer</small>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="p-3 border rounded">
                                    <i class="fas fa-users fa-2x text-success"></i>
                                    <h5>Referral Bonuses</h5>
                                    <small>₱50 per referral + milestone bonuses</small>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4">
                            <button class="btn btn-primary btn-lg me-2" onclick="showLoginModal()">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                            <button class="btn btn-success btn-lg" onclick="showRegisterModal()">
                                <i class="fas fa-user-plus"></i> Register
                            </button>
                        </div>
                        <div class="alert alert-info mt-4">
                            <i class="fas fa-info-circle"></i> New accounts require admin approval before earning.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load content based on navigation
async function loadContent(view) {
    if (!checkAuth()) {
        await renderLandingPage();
        currentView = 'landing';
        return;
    }
    
    if (view === 'dashboard' && currentUser.username !== 'admin') {
        await renderUserDashboard();
        currentView = 'dashboard';
    } else if (view === 'admin' && currentUser.username === 'admin') {
        await renderAdminDashboard();
        currentView = 'admin';
    } else if (view === 'quiz') {
        await startQuiz();
        const quizModal = new bootstrap.Modal(document.getElementById('quizModal'));
        quizModal.show();
    } else if (view === 'invite') {
        showInviteModal();
    } else if (view === 'withdraw') {
        const withdrawModal = new bootstrap.Modal(document.getElementById('withdrawModal'));
        withdrawModal.show();
    }
}

// Setup navigation event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            const success = await loginUser(username, password);
            if (success) {
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                if (currentUser.username === 'admin') {
                    await renderAdminDashboard();
                } else {
                    await renderUserDashboard();
                }
                updateNavigation();
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const fullName = document.getElementById('regFullName').value;
            const email = document.getElementById('regEmail').value;
            const referral = document.getElementById('regReferral').value;
            
            const success = await registerUser(username, password, fullName, email, referral);
            if (success) {
                bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
                registerForm.reset();
            }
        });
    }
    
    // Withdraw form
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', submitWithdrawal);
    }
}

// Update navigation menu
function updateNavigation() {
    const navMenu = document.getElementById('navMenu');
    
    if (!currentUser) {
        navMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showLoginModal()">
                    <i class="fas fa-sign-in-alt"></i> Login
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showRegisterModal()">
                    <i class="fas fa-user-plus"></i> Register
                </a>
            </li>
        `;
    } else if (currentUser.username === 'admin') {
        navMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadContent('admin')">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </li>
        `;
    } else {
        navMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadContent('dashboard')">
                    <i class="fas fa-home"></i> Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadContent('quiz')">
                    <i class="fas fa-brain"></i> Quick Quiz
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadContent('invite')">
                    <i class="fas fa-user-plus"></i> Invite Friend
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadContent('withdraw')">
                    <i class="fas fa-money-bill-wave"></i> Withdraw
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </li>
        `;
    }
}

// Modal functions
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

function showInviteModal() {
    const modalBody = document.getElementById('inviteModalBody');
    modalBody.innerHTML = `
        <i class="fas fa-share-alt fa-3x text-success mb-3"></i>
        <h5>Share Your Referral Code</h5>
        <div class="alert alert-info">
            <strong>Your Code:</strong> <code class="fs-4">${currentUser.referral_code}</code>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="copyReferralCode()">
                <i class="fas fa-copy"></i> Copy Code
            </button>
        </div>
        <p>Share this code with friends. When they register, you'll earn:</p>
        <ul class="text-start">
            <li>₱50 per successful referral</li>
            <li>₱30 bonus at 5 referrals</li>
            <li>₱50 bonus at 10 referrals</li>
            <li>₱100 bonus at 20 referrals</li>
        </ul>
        <hr>
        <h6>Share via:</h6>
        <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-primary" onclick="shareVia('facebook')">
                <i class="fab fa-facebook"></i> Facebook
            </button>
            <button class="btn btn-info" onclick="shareVia('messenger')">
                <i class="fab fa-facebook-messenger"></i> Messenger
            </button>
            <button class="btn btn-success" onclick="shareVia('whatsapp')">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('inviteModal'));
    modal.show();
}

function shareVia(platform) {
    const text = `Join EduEarn and start earning by answering quiz questions! Use my referral code: ${currentUser.referral_code}`;
    const url = window.location.href;
    
    let shareUrl = '';
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
            break;
        case 'messenger':
            shareUrl = `fb-messenger://share/?link=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// Make functions globally available
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.loadContent = loadContent;
window.logout = logout;
window.startQuiz = startQuiz;
window.copyReferralCode = copyReferralCode;
window.approveUser = approveUser;
window.toggleBan = toggleBan;
window.approveWithdrawal = approveWithdrawal;
window.updatePrizePool = updatePrizePool;
window.resetMonthlyReferrals = resetMonthlyReferrals;
window.showCreateQuestionModal = showCreateQuestionModal;
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
window.shareVia = shareVia;

// Update navigation on load
updateNavigation();