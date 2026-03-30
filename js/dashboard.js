// Render user dashboard
async function renderUserDashboard() {
    const container = document.getElementById('mainContent');
    
    // Load monthly contest data
    const { data: contestData } = await supabase
        .from('contest_settings')
        .select('*')
        .single();
    
    const contest = contestData || { prize_pool: 500 };
    
    // Get top referrers for contest
    const { data: topReferrers } = await supabase
        .from('users')
        .select('full_name, monthly_referrals')
        .eq('approved', true)
        .eq('banned', false)
        .order('monthly_referrals', { ascending: false })
        .limit(10);
    
    // Calculate winners
    let winnersHtml = '<p class="text-muted">No winners yet this month</p>';
    if (topReferrers && topReferrers.length > 0) {
        const prizePool = contest.prize_pool;
        const totalParticipants = topReferrers.filter(r => r.monthly_referrals > 0).length;
        
        if (totalParticipants > 0) {
            const firstPrize = prizePool * 0.6;
            const secondThirdPrize = prizePool * 0.3;
            const fourthSixthPrize = prizePool * 0.1;
            
            winnersHtml = `
                <div class="list-group">
                    ${topReferrers[0] && topReferrers[0].monthly_referrals > 0 ? `
                        <div class="list-group-item">
                            <i class="fas fa-crown text-warning"></i>
                            <strong>1st Place:</strong> ${topReferrers[0].full_name} - ₱${firstPrize.toFixed(2)} (${topReferrers[0].monthly_referrals} referrals)
                        </div>
                    ` : ''}
                    ${topReferrers[1] && topReferrers[1].monthly_referrals > 0 ? `
                        <div class="list-group-item">
                            <i class="fas fa-medal text-secondary"></i>
                            <strong>2nd-3rd Place:</strong> ${topReferrers[1].full_name} - ₱${(secondThirdPrize/2).toFixed(2)} (${topReferrers[1].monthly_referrals} referrals)
                        </div>
                    ` : ''}
                    ${topReferrers[2] && topReferrers[2].monthly_referrals > 0 ? `
                        <div class="list-group-item">
                            <i class="fas fa-medal text-bronze"></i>
                            <strong>4th-6th Place:</strong> ${topReferrers[2].full_name} - ₱${(fourthSixthPrize/3).toFixed(2)} (${topReferrers[2].monthly_referrals} referrals)
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }
    
    container.innerHTML = `
        <div class="row fade-in">
            <div class="col-md-4 mb-4">
                <div class="stat-card">
                    <i class="fas fa-wallet"></i>
                    <h3>₱${currentUser.balance.toFixed(4)}</h3>
                    <p class="text-muted">Your Balance</p>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <h3>${currentUser.referrals_count || 0}</h3>
                    <p class="text-muted">Total Referrals</p>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <h3>${currentUser.monthly_referrals || 0}</h3>
                    <p class="text-muted">Monthly Referrals</p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-gift"></i> Referral Program</h4>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <i class="fas fa-link"></i> <strong>Your Referral Code:</strong> 
                            <code class="fs-5">${currentUser.referral_code}</code>
                            <button class="btn btn-sm btn-outline-primary ms-2" onclick="copyReferralCode()">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <div class="border rounded p-3 text-center">
                                    <i class="fas fa-phone-alt fa-2x text-primary"></i>
                                    <h5 class="mt-2">Per Referral</h5>
                                    <h3 class="text-success">₱50</h3>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="border rounded p-3 text-center">
                                    <i class="fas fa-trophy fa-2x text-warning"></i>
                                    <h5 class="mt-2">Milestone Bonuses</h5>
                                    <p>5 invites: +₱30<br>10 invites: +₱50<br>20 invites: +₱100</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-chart-simple"></i> Monthly Contest</h4>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <h5>Prize Pool: <span class="text-success">₱${contest.prize_pool}</span></h5>
                            <small>Top referrers win big!</small>
                        </div>
                        ${winnersHtml}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mt-3">
            <div class="card-header">
                <h4><i class="fas fa-history"></i> Recent Activity</h4>
            </div>
            <div class="card-body">
                <p>Answer questions to earn instantly. Each correct answer rewards you with ₱0.0001-₱0.001!</p>
                <div class="alert alert-secondary">
                    <i class="fas fa-clock"></i> <strong>5-Second Cooldown</strong> between questions to prevent spam.
                </div>
            </div>
        </div>
    `;
}

// Copy referral code
function copyReferralCode() {
    navigator.clipboard.writeText(currentUser.referral_code);
    showToast('Referral code copied!', 'success');
}

// Submit withdrawal request
async function submitWithdrawal(event) {
    event.preventDefault();
    
    const method = document.getElementById('withdrawMethod').value;
    const fullName = document.getElementById('withdrawFullName').value;
    const accountNumber = document.getElementById('withdrawAccountNumber').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if (amount <= 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    if (amount > currentUser.balance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('withdrawals')
            .insert([{
                user_id: currentUser.id,
                method: method,
                account_name: fullName,
                account_number: accountNumber,
                amount: amount,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        showToast('Withdrawal request submitted for admin approval', 'success');
        bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
        document.getElementById('withdrawForm').reset();
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast('Failed to submit withdrawal', 'error');
    }
}