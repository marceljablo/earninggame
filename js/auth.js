// Supabase Configuration
const SUPABASE_URL = 'https://dvuqobpljptruhwkqflz.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dXFvYnBsanB0cnVod2txZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzA5MDEsImV4cCI6MjA5MDI0NjkwMX0.cNKAOTp3KdBYf1JaQpoxjaWlMlLAKSkzl5Rzs0fSHsY'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user state
let currentUser = null;

// Authentication Functions
async function loginUser(username, password) {
    try {
        // First, get user from users table
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password); // In production, use proper password hashing!

        if (error) throw error;

        if (!users || users.length === 0) {
            showToast('Invalid credentials', 'error');
            return false;
        }

        const user = users[0];

        if (!user.approved) {
            showToast('Account not approved by admin', 'error');
            return false;
        }

        if (user.banned) {
            showToast('Account is banned', 'error');
            return false;
        }

        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showToast(`Welcome back, ${user.full_name}!`, 'success');
        return true;
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed', 'error');
        return false;
    }
}

async function registerUser(username, password, fullName, email, referralCode) {
    try {
        // Check if username exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            showToast('Username already exists', 'error');
            return false;
        }

        // Generate unique user ID
        const userId = 'U' + Date.now();
        const referralCode_gen = username.toUpperCase() + Math.floor(Math.random() * 1000);

        // Insert new user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                id: userId,
                username: username,
                password: password,
                full_name: fullName,
                email: email,
                referral_code: referralCode_gen,
                balance: 0,
                approved: false,
                banned: false,
                referrals_count: 0,
                monthly_referrals: 0,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Process referral if provided
        if (referralCode && referralCode.trim()) {
            await processReferral(newUser.id, referralCode);
        }

        showToast('Registration successful! Wait for admin approval.', 'success');
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed', 'error');
        return false;
    }
}

async function processReferral(newUserId, referralCode) {
    try {
        // Find referrer
        const { data: referrer } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', referralCode)
            .single();

        if (referrer && !referrer.banned) {
            // Add referral bonus
            const newBalance = referrer.balance + 50;
            
            await supabase
                .from('users')
                .update({
                    balance: newBalance,
                    referrals_count: referrer.referrals_count + 1,
                    monthly_referrals: referrer.monthly_referrals + 1
                })
                .eq('id', referrer.id);

            // Check milestone bonuses
            const newCount = referrer.referrals_count + 1;
            let milestoneBonus = 0;
            
            if (newCount === 5) milestoneBonus = 30;
            else if (newCount === 10) milestoneBonus = 50;
            else if (newCount === 20) milestoneBonus = 100;
            else if (newCount > 20 && newCount % 10 === 0) milestoneBonus = 100;

            if (milestoneBonus > 0) {
                await supabase
                    .from('users')
                    .update({
                        balance: referrer.balance + 50 + milestoneBonus
                    })
                    .eq('id', referrer.id);
            }

            // Update new user's referred_by
            await supabase
                .from('users')
                .update({ referred_by: referralCode })
                .eq('id', newUserId);
        }
    } catch (error) {
        console.error('Referral processing error:', error);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'info');
    loadContent('landing');
}

function checkAuth() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        return true;
    }
    return false;
}

// Helper function to show toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'}" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
