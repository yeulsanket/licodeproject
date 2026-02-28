/**
 * AI Analysis Module — Resume analyzer, Skill gap, Salary predictor, Roadmap
 */
const AIModule = {
    async init() {
        this.loadStudentDropdowns();
    },

    async loadStudentDropdowns() {
        try {
            const data = await API.getStudents({ per_page: 500 });
            const students = data.students || [];
            ['skillgap-student', 'roadmap-student', 'jobmatch-student'].forEach(id => {
                const select = document.getElementById(id);
                if (!select) return;
                select.innerHTML = '<option value="">-- Select Student --</option>';
                students.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = `${s.name} (${s.branch})`;
                    select.appendChild(opt);
                });
            });
        } catch (e) { console.error(e); }
    },

    showLoading(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = '<div class="loading"><div class="spinner"></div><span>AI is analyzing...</span></div>';
        el.classList.add('visible');
    },

    // ─── Resume Analyzer ──────────────────────────────────────────
    async analyzeResume() {
        const resumeText = document.getElementById('resume-text')?.value;
        const targetRole = document.getElementById('resume-target-role')?.value || 'Software Engineer';

        if (!resumeText) { showNotification('Please paste your resume text.', 'error'); return; }

        this.showLoading('resume-result');

        try {
            const result = await API.analyzeResume({ resume_text: resumeText, target_role: targetRole });
            this.renderResumeResult(result);
        } catch (e) {
            document.getElementById('resume-result').innerHTML = '<p style="color:var(--accent-rose)">⚠ Error analyzing resume. Check backend connection.</p>';
        }
    },

    renderResumeResult(r) {
        const el = document.getElementById('resume-result');
        el.innerHTML = `
            <h4><i class="fas fa-chart-bar"></i> Analysis Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <div class="label">Match Score</div>
                    <div class="value" style="color:${r.match_score >= 70 ? 'var(--accent-emerald)' : r.match_score >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'}">${r.match_score}%</div>
                    <div class="score-meter"><div class="fill" style="width:${r.match_score}%"></div></div>
                </div>
                <div class="result-item">
                    <div class="label">Experience</div>
                    <div class="value">${r.experience_years} years</div>
                </div>
            </div>
            <h4><i class="fas fa-code"></i> Skills Found</h4>
            <div style="margin-bottom:1rem">${(r.skills_found || []).map(s => `<span class="skill-tag">${s}</span>`).join(' ')}</div>
            <h4 style="color:var(--accent-emerald)"><i class="fas fa-check-circle"></i> Strengths</h4>
            <ul class="result-list">${(r.strengths || []).map(s => `<li><i class="fas fa-plus-circle"></i> ${s}</li>`).join('')}</ul>
            <h4 style="color:var(--accent-rose)"><i class="fas fa-exclamation-circle"></i> Weaknesses</h4>
            <ul class="result-list">${(r.weaknesses || []).map(w => `<li><i class="fas fa-minus-circle"></i> ${w}</li>`).join('')}</ul>
            <h4 style="color:var(--accent-amber)"><i class="fas fa-lightbulb"></i> Recommendations</h4>
            <ul class="result-list">${(r.recommendations || []).map(rec => `<li><i class="fas fa-arrow-right"></i> ${rec}</li>`).join('')}</ul>
        `;
        el.classList.add('visible');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ─── Skill Gap Analysis ───────────────────────────────────────
    async skillGapAnalysis() {
        const studentId = document.getElementById('skillgap-student')?.value;
        const targetRole = document.getElementById('skillgap-role')?.value || 'Software Engineer';

        if (!studentId) { showNotification('Please select a student.', 'error'); return; }

        this.showLoading('skillgap-result');

        try {
            const result = await API.skillGap({ student_id: parseInt(studentId), target_role: targetRole });
            this.renderSkillGapResult(result);
        } catch (e) {
            document.getElementById('skillgap-result').innerHTML = '<p style="color:var(--accent-rose)">⚠ Error analyzing skills. Check backend.</p>';
        }
    },

    renderSkillGapResult(r) {
        const el = document.getElementById('skillgap-result');
        el.innerHTML = `
            <h4><i class="fas fa-bullseye"></i> Skill Gap Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <div class="label">Match Percentage</div>
                    <div class="value" style="color:${r.match_percentage >= 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">${r.match_percentage}%</div>
                    <div class="score-meter"><div class="fill" style="width:${r.match_percentage}%"></div></div>
                </div>
                <div class="result-item">
                    <div class="label">Time to Ready</div>
                    <div class="value">${r.estimated_time_to_ready}</div>
                </div>
            </div>
            <h4 style="color:var(--accent-rose)"><i class="fas fa-times-circle"></i> Missing Skills</h4>
            <div style="margin-bottom:1rem">${(r.missing_skills || []).map(s => `<span class="skill-tag" style="background:rgba(251,113,133,0.12);color:var(--accent-rose);border-color:rgba(251,113,133,0.2)">${s}</span>`).join(' ')}</div>
            <h4 style="color:var(--accent-amber)"><i class="fas fa-arrow-up"></i> Skills to Improve</h4>
            <div style="margin-bottom:1rem">${(r.skills_to_improve || []).map(s => `<span class="skill-tag" style="background:rgba(251,191,36,0.12);color:var(--accent-amber);border-color:rgba(251,191,36,0.2)">${s}</span>`).join(' ')}</div>
            <h4 style="color:var(--accent-teal)"><i class="fas fa-graduation-cap"></i> Learning Path</h4>
            <ul class="result-list">
                ${(r.learning_path || []).map(lp => `<li><i class="fas fa-book"></i> <strong>${lp.skill}</strong> — ${lp.resource} <span style="color:var(--text-muted)">(${lp.duration}, ${lp.priority} priority)</span></li>`).join('')}
            </ul>
        `;
        el.classList.add('visible');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ─── Salary Predictor ─────────────────────────────────────────
    async predictSalary() {
        const cgpa = parseFloat(document.getElementById('salary-cgpa')?.value) || 7;
        const branch = document.getElementById('salary-branch')?.value || 'Computer Science';
        const projects = parseInt(document.getElementById('salary-projects')?.value) || 0;
        const internships = parseInt(document.getElementById('salary-internships')?.value) || 0;
        const skillsStr = document.getElementById('salary-skills')?.value || '';
        const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

        this.showLoading('salary-result');

        try {
            const result = await API.predictSalary({ cgpa, branch, projects, internships, skills });
            this.renderSalaryResult(result);
        } catch (e) {
            document.getElementById('salary-result').innerHTML = '<p style="color:var(--accent-rose)">⚠ Error predicting salary.</p>';
        }
    },

    renderSalaryResult(r) {
        const el = document.getElementById('salary-result');
        el.innerHTML = `
            <div class="salary-range">
                <div class="range-label">Predicted Salary Range</div>
                <div class="amount">₹${r.predicted_min_lpa} - ${r.predicted_max_lpa} LPA</div>
                <div class="range-label">Average: ₹${r.predicted_avg_lpa} LPA | Confidence: ${r.confidence}</div>
            </div>
            <h4><i class="fas fa-chart-pie"></i> Impact Factors</h4>
            <ul class="result-list">
                ${(r.factors || []).map(f => `<li><i class="fas fa-${f.impact === 'positive' ? 'arrow-up' : f.impact === 'negative' ? 'arrow-down' : 'minus'}" style="color:${f.impact === 'positive' ? 'var(--accent-emerald)' : f.impact === 'negative' ? 'var(--accent-rose)' : 'var(--accent-amber)'}"></i> <strong>${f.factor}</strong>: ${f.detail}</li>`).join('')}
            </ul>
            <h4 style="color:var(--accent-teal)"><i class="fas fa-rocket"></i> How to Increase</h4>
            <ul class="result-list">${(r.recommendations_to_increase || []).map(rec => `<li><i class="fas fa-lightbulb"></i> ${rec}</li>`).join('')}</ul>
            ${r.market_insight ? `<div style="margin-top:1rem;padding:1rem;background:var(--bg-glass);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-muted);font-size:0.88rem"><i class="fas fa-info-circle" style="color:var(--accent-indigo)"></i> ${r.market_insight}</div>` : ''}
        `;
        el.classList.add('visible');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ─── Career Roadmap ───────────────────────────────────────────
    async generateRoadmap() {
        const studentId = document.getElementById('roadmap-student')?.value;
        const goal = document.getElementById('roadmap-goal')?.value || 'Software Engineer';
        const targetPkg = document.getElementById('roadmap-package')?.value;

        if (!studentId) { showNotification('Please select a student.', 'error'); return; }

        this.showLoading('roadmap-result');

        try {
            const result = await API.generateRoadmap({
                student_id: parseInt(studentId),
                career_goal: goal,
                target_package: targetPkg ? parseFloat(targetPkg) : null
            });
            this.renderRoadmapResult(result);
        } catch (e) {
            document.getElementById('roadmap-result').innerHTML = '<p style="color:var(--accent-rose)">⚠ Error generating roadmap.</p>';
        }
    },

    renderRoadmapResult(r) {
        const el = document.getElementById('roadmap-result');
        el.innerHTML = `
            <h4><i class="fas fa-flag-checkered"></i> Roadmap: ${r.career_goal}</h4>
            <div class="result-grid" style="margin-bottom:1.5rem">
                <div class="result-item">
                    <div class="label">Current Readiness</div>
                    <div class="value">${r.current_readiness}%</div>
                    <div class="score-meter"><div class="fill" style="width:${r.current_readiness}%"></div></div>
                </div>
            </div>
            <div class="roadmap-timeline">
                ${(r.months || []).map(m => `
                    <div class="roadmap-month">
                        <h5>Month ${m.month}: ${m.title}</h5>
                        ${m.focus_areas ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem"><strong>Focus:</strong> ${m.focus_areas.join(', ')}</p>` : ''}
                        ${m.skills_to_learn ? `<div style="margin-bottom:0.4rem">${m.skills_to_learn.map(s => `<span class="skill-tag">${s}</span>`).join(' ')}</div>` : ''}
                        ${m.projects && m.projects.length ? `<p style="font-size:0.85rem;color:var(--text-secondary)"><i class="fas fa-code" style="color:var(--accent-teal)"></i> ${m.projects.join(', ')}</p>` : ''}
                        ${m.milestones && m.milestones.length ? `<p style="font-size:0.85rem;color:var(--accent-emerald)"><i class="fas fa-check"></i> ${m.milestones.join(', ')}</p>` : ''}
                    </div>
                `).join('')}
            </div>
            ${r.tips && r.tips.length ? `
                <h4 style="margin-top:1.5rem;color:var(--accent-amber)"><i class="fas fa-star"></i> Pro Tips</h4>
                <ul class="result-list">${r.tips.map(t => `<li><i class="fas fa-lightbulb"></i> ${t}</li>`).join('')}</ul>
            ` : ''}
        `;
        el.classList.add('visible');
    },

    // ─── Job Recommendations ─────────────────────────────────────
    async getJobRecommendations() {
        const studentId = document.getElementById('jobmatch-student')?.value;
        if (!studentId) { showNotification('Please select a student.', 'error'); return; }

        this.showLoading('jobmatch-result');

        try {
            const results = await API.getJobRecommendations(studentId);
            this.renderJobMatches(results);
        } catch (e) {
            document.getElementById('jobmatch-result').innerHTML = '<p style="color:var(--accent-rose)">⚠ Error fetching job recommendations.</p>';
        }
    },

    renderJobMatches(results) {
        const el = document.getElementById('jobmatch-result');
        if (!results || !results.matches || results.matches.length === 0) {
            el.innerHTML = '<p>No specific matches found. Try updating the student profile skills.</p>';
            return;
        }

        el.innerHTML = `
            <h4><i class="fas fa-briefcase"></i> Top AI-Matched Opportunities</h4>
            <div class="job-matches-list">
                ${results.matches.map(m => `
                    <div class="job-match-card" style="margin-bottom:1rem; padding:1.2rem; background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md)">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem">
                            <div>
                                <h5 style="margin:0; font-size:1.1rem; color:var(--accent-teal)">${m.company}</h5>
                                <div style="font-size:0.85rem; color:var(--text-muted)">${m.role} • ${m.industry}</div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:1.2rem; font-weight:700; color:var(--accent-emerald)">${m.match_score}% Match</div>
                                <div style="font-size:0.8rem; color:var(--text-secondary)">Pkg: ₹${m.package} LPA</div>
                            </div>
                        </div>
                        <div style="margin-top:0.8rem">
                            <div style="font-size:0.85rem; font-weight:600; margin-bottom:0.3rem">Why you match:</div>
                            <p style="font-size:0.88rem; color:var(--text-secondary); margin:0">${m.reason}</p>
                        </div>
                        <div style="margin-top:0.8rem; display:flex; gap:0.5rem; flex-wrap:wrap">
                            ${(m.matched_skills || []).map(s => `<span class="skill-tag" style="font-size:0.7rem; padding:2px 8px">${s}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:1.5rem; padding:1rem; background:rgba(45,212,191,0.05); border-radius:var(--radius-sm); font-size:0.85rem; color:var(--text-muted)">
                <i class="fas fa-info-circle"></i> Matches are calculated based on your current skills compared to historical placement data and company requirements.
            </div>
        `;
        el.classList.add('visible');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.AIModule = AIModule;
