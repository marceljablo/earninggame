// Quiz variables
let currentQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let quizCooldown = false;
let cooldownTimer = null;

// Load questions from Supabase
async function loadQuestions() {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('subject');
        
        if (error) throw error;
        currentQuestions = data || [];
        return currentQuestions;
    } catch (error) {
        console.error('Error loading questions:', error);
        return [];
    }
}

// Start quiz
async function startQuiz() {
    if (quizCooldown) {
        showToast('Please wait for cooldown (5 seconds)', 'warning');
        return;
    }
    
    await loadQuestions();
    
    if (currentQuestions.length === 0) {
        showToast('No questions available', 'error');
        return;
    }
    
    currentQuestionIndex = 0;
    showQuizQuestion();
}

// Show current question
function showQuizQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        // Quiz finished
        document.getElementById('quizModalBody').innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-trophy fa-3x text-warning mb-3"></i>
                <h4>Quiz Completed!</h4>
                <p>You've answered all questions. Come back later for more!</p>
                <button class="btn btn-primary" data-bs-dismiss="modal">Close</button>
            </div>
        `;
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const options = question.options || [];
    
    let optionsHtml = '';
    options.forEach((option, idx) => {
        optionsHtml += `
            <div class="quiz-option" data-answer="${option}">
                <i class="far fa-circle me-2"></i> ${option}
            </div>
        `;
    });
    
    document.getElementById('quizModalBody').innerHTML = `
        <div class="quiz-container">
            <div class="mb-4">
                <span class="badge bg-info">${question.subject}</span>
                <span class="badge bg-secondary ms-2">Reward: ₱${question.points_reward.toFixed(4)}</span>
                <span class="badge bg-warning ms-2">Question ${currentQuestionIndex + 1}/${currentQuestions.length}</span>
            </div>
            <h5 class="mb-4">${question.question_text}</h5>
            <div id="quizOptions">
                ${optionsHtml}
            </div>
            <button class="btn btn-success mt-4 w-100" id="submitAnswerBtn" ${quizCooldown ? 'disabled' : ''}>
                ${quizCooldown ? 'Cooldown Active...' : 'Submit Answer'}
            </button>
            ${quizCooldown ? '<div class="cooldown-timer mt-3"><i class="fas fa-hourglass-half"></i> Wait 5 seconds before next question</div>' : ''}
        </div>
    `;
    
    // Add click handlers for options
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedAnswer = this.dataset.answer;
        });
    });
    
    // Submit button handler
    document.getElementById('submitAnswerBtn').addEventListener('click', () => submitAnswer(question));
}

// Submit answer
async function submitAnswer(question) {
    if (!selectedAnswer) {
        showToast('Please select an answer', 'warning');
        return;
    }
    
    if (quizCooldown) {
        showToast('Cooldown active! Please wait 5 seconds.', 'warning');
        return;
    }
    
    const isCorrect = selectedAnswer === question.correct_answer;
    
    if (isCorrect) {
        // Update user balance
        const newBalance = currentUser.balance + question.points_reward;
        
        const { error } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', currentUser.id);
        
        if (!error) {
            currentUser.balance = newBalance;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showToast(`Correct! +₱${question.points_reward.toFixed(4)} earned!`, 'success');
        }
    } else {
        showToast('Wrong answer! Better luck next time.', 'error');
    }
    
    // Start cooldown
    quizCooldown = true;
    if (cooldownTimer) clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(() => {
        quizCooldown = false;
        currentQuestionIndex++;
        showQuizQuestion();
    }, 5000);
    
    // Refresh the display to show cooldown
    setTimeout(() => {
        if (currentQuestionIndex < currentQuestions.length) {
            showQuizQuestion();
        }
    }, 100);
}
