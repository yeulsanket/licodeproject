import { useState } from 'react';
import StudentManager from './StudentManager';
import CompanyManager from './CompanyManager';

export default function Management() {
    const [sub, setSub] = useState('students');
    return (
        <div>
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-users-cog" /> Management</h2>
                <p className="section-subtitle">Manage students and companies</p>
            </div>
            <div className="ai-tabs" style={{ marginBottom: '1.5rem' }}>
                <button className={`ai-tab ${sub === 'students' ? 'active' : ''}`} onClick={() => setSub('students')}>
                    <i className="fas fa-user-graduate" /> Students
                </button>
                <button className={`ai-tab ${sub === 'companies' ? 'active' : ''}`} onClick={() => setSub('companies')}>
                    <i className="fas fa-building" /> Companies
                </button>
            </div>
            {sub === 'students' ? <StudentManager /> : <CompanyManager />}
        </div>
    );
}
