// Admin Dashboard
async function renderAdminDashboard() {
    // Fetch all users
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    
    // Fetch pending withdrawals
    const { data: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*, users(full_name, username)')
        .eq('status', 'pending');
    
    // Fetch contest settings
    const { data: contest } = await supabase
        .from('contest_settings')
        .select('*')
        .single();
    
    const pendingApprovals = users.filter(u => !u.approved && u.username !== 'admin').length;
    const totalUsers = users.length;
    
    const container = document.getElementById('mainContent');
    container.innerHTML = `
        <div class="fade-in">
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="stat-card bg-white">
                        <i class="fas fa-users fa-2x text-primary"></i>
                        <h3>${totalUsers}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card bg-white">
                        <i class="fas fa-clock fa-2x text-warning"></i>
                        <h3>${pendingApprovals}</h3>
                        <p>Pending Approvals</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card bg-white">
                        <i class="fas fa-money-bill-wave fa-2x text-success"></i>
                        <h3>${pendingWithdrawals?.length || 0}</h3>
                        <p>Pending Withdrawals</p>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <h4><i class="fas fa-trophy"></i> Contest Management</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <label>Current Prize Pool: ₱${contest?.prize_pool || 500}</label>
                            <input type="number" id="prizePoolInput" class="form-control mt-2" value="${contest?.prize_pool || 500}">
                        </div>
                        <div class="col-md-6">
                            <button class="btn btn-primary mt-4" onclick="updatePrizePool()">
                                <i class="fas fa-save"></i> Update Prize Pool
                            </button>
                            <button class="btn btn-warning mt-4 ms-2" onclick="resetMonthlyReferrals()">
                                <i class="fas fa-redo"></i> Reset Monthly Referrals
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h4><i class="fas fa-users"></i> User Management</h4>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Balance</th>
                                    <th>Referrals</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.filter(u => u.username !== 'admin').map(user => `
                                    <tr>
                                        <td>${user.id}</td>
                                        <td>${user.username}</td>
                                        <td>${user.full_name}</td>
                                        <td>₱${user.balance?.toFixed(4) || 0}</td>
                                        <td>${user.referrals_count || 0}</td>
                                        <td>
                                            <span class="badge ${user.approved ? 'badge-approved' : 'badge-pending'}">
                                                ${user.approved ? (user.banned ? 'Banned' : 'Active') : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            ${!user.approved ? `
                                                <button class="btn btn-sm btn-success" onclick="approveUser('${user.id}')">
                                                    <i class="fas fa-check"></i> Approve
                                                </button>
                                            ` : `
                                                <button class="btn btn-sm btn-${user.banned ? 'success' : 'danger'}" onclick="toggleBan('${user.id}', ${!user.banned})">
                                                    <i class="fas fa-${user.banned ? 'check' : 'ban'}"></i> ${user.banned ? 'Unban' : 'Ban'}
                                                </button>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header">
                    <h4><i class="fas fa-money-bill"></i> Withdrawal Requests</h4>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Method</th>
                                    <th>Account</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingWithdrawals?.map(w => `
                                    <tr>
                                        <td>${w.users?.full_name}</td>
                                        <td>${w.method}</td>
                                        <td>${w.account_name}<br><small>${w.account_number}</small></td>
                                        <td>₱${w.amount}</td>
                                        <td>${new Date(w.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button class="btn btn-sm btn-success" onclick="approveWithdrawal('${w.id}', ${w.amount}, '${w.user_id}')">
                                                <i class="fas fa-check"></i> Approve
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="6" class="text-center">No pending withdrawals</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header">
                    <h4><i class="fas fa-question-circle"></i> Question Management</h4>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary mb-3" onclick="showCreateQuestionModal()">
                        <i class="fas fa-plus"></i> Create New Question
                    </button>
                    <div id="questionsList" class="row">
                        <!-- Questions will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load questions
    loadQuestionsList();
}

// Load questions for admin
async function loadQuestionsList() {
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
    
    const container = document.getElementById('questionsList');
    if (!container) return;
    
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p class="text-muted">No questions yet. Create your first question!</p>';
        return;
    }
    
    container.innerHTML = questions.map(q => `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h6 class="badge bg-info">${q.subject}</h6>
                        <div>
                            <button class="btn btn-sm btn-warning" onclick="editQuestion('${q.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${q.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="mt-2">${q.question_text}</p>
                    <small class="text-muted">Reward: ₱${q.points_reward.toFixed(4)}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// Admin actions
async function approveUser(userId) {
    const { error } = await supabase
        .from('users')
        .update({ approved: true })
        .eq('id', userId);
    
    if (!error) {
        showToast('User approved', 'success');
        renderAdminDashboard();
    }
}

async function toggleBan(userId, ban) {
    const { error } = await supabase
        .from('users')
        .update({ banned: ban })
        .eq('id', userId);
    
    if (!error) {
        showToast(ban ? 'User banned' : 'User unbanned', 'success');
        renderAdminDashboard();
    }
}

async function approveWithdrawal(withdrawalId, amount, userId) {
    // First, deduct from user balance
    const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();
    
    if (user && user.balance >= amount) {
        const newBalance = user.balance - amount;
        
        await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);
        
        // Update withdrawal status
        await supabase
            .from('withdrawals')
            .update({ status: 'approved' })
            .eq('id', withdrawalId);
        
        showToast('Withdrawal approved', 'success');
        renderAdminDashboard();
    } else {
        showToast('Insufficient balance', 'error');
    }
}

async function updatePrizePool() {
    const prizePool = parseFloat(document.getElementById('prizePoolInput').value);
    
    const { error } = await supabase
        .from('contest_settings')
        .upsert({ id: 1, prize_pool: prizePool });
    
    if (!error) {
        showToast('Prize pool updated', 'success');
    }
}

async function resetMonthlyReferrals() {
    const { error } = await supabase
        .from('users')
        .update({ monthly_referrals: 0 });
    
    if (!error) {
        showToast('Monthly referrals reset', 'success');
        renderAdminDashboard();
    }
}

async function showCreateQuestionModal() {
    const subject = prompt('Enter subject (Science/Math/History):');
    if (!subject) return;
    
    const questionText = prompt('Enter question:');
    if (!questionText) return;
    
    const optionsInput = prompt('Enter options (comma separated):');
    const options = optionsInput.split(',').map(o => o.trim());
    
    const correctAnswer = prompt('Enter correct answer:');
    const pointsReward = parseFloat(prompt('Enter reward amount (0.0001-0.001):'));
    
    if (options.length > 0 && correctAnswer && pointsReward) {
        const { error } = await supabase
            .from('questions')
            .insert([{
                subject: subject,
                question_text: questionText,
                options: options,
                correct_answer: correctAnswer,
                points_reward: pointsReward,
                created_at: new Date().toISOString()
            }]);
        
        if (!error) {
            showToast('Question created', 'success');
            loadQuestionsList();
        }
    }
}

async function editQuestion(questionId) {
    const newPoints = parseFloat(prompt('Enter new reward amount:'));
    if (newPoints) {
        const { error } = await supabase
            .from('questions')
            .update({ points_reward: newPoints })
            .eq('id', questionId);
        
        if (!error) {
            showToast('Question updated', 'success');
            loadQuestionsList();
        }
    }
}

async function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId);
        
        if (!error) {
            showToast('Question deleted', 'success');
            loadQuestionsList();
        }
    }
}
