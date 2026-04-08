const { pool, sql } = require("../../config/db");

function getAcademicImpactScore(finalMark) {
    if (finalMark === undefined || finalMark === null) return 0;

    const boundaries = [45, 55, 65, 75];
    let score = 0;

    for (const boundary of boundaries) {
        const diff = boundary - finalMark;

        if (diff > 0 && diff <= 5) {
            score = Math.max(score, 40 - (diff * 5));
        }
    }

    return score;
}

function getStudentRiskScore(academic_year, concern_history_count) {
    let score = 0;

    const yearWeights = {
        'Y1S1': 0, 'Y1S2': 0,
        'Y2S1': 5, 'Y2S2': 5,
        'Y3S1': 15, 'Y3S2': 15,
        'Y4S1': 25, 'Y4S2': 30 
    };
    score += yearWeights[academic_year] ?? 0;

    if (concern_history_count === 0) score += 30; 
    if (concern_history_count >= 3)  score += 15; 

    return score;
}

function isNegated(message, keyword) {
    const negationPattern = new RegExp(
        `(no|not|without|never|don't have)\\s+.{0,20}${keyword}`, 'i'
    );
    return negationPattern.test(message);
}

async function priorityDetector(student_id, academic_year, concern_message, submission_id) {
    try {
        let score = 0;
        const lowerMsg = concern_message.toLowerCase();

        const markResult = await pool.request()
            .input('student_id', sql.BigInt, student_id)
            .input('submission_id', sql.BigInt, submission_id)
            .query(`SELECT total_marks_awarded FROM final_mark
                    WHERE student_id = @student_id AND submission_id = @submission_id`);

        const historyResult = await pool.request()
            .input('student_id', sql.BigInt, student_id)
            .query(`SELECT COUNT(*) as concern_count FROM mark_concern
                    WHERE student_id = @student_id`);

        const finalMark = markResult.recordset[0]?.total_marks_awarded;
        const concernCount = historyResult.recordset[0]?.concern_count ?? 0;

        const urgencySignals = {
            critical: { patterns: [/medical\s*(emergency|condition|issue)/i, /hospitali[sz]ed/i, /mental\s*health/i], weight: 40 },
            high:     { patterns: [/urgent/i, /emergency/i, /appeal/i], weight: 25 },
            medium:   { patterns: [/calculation\s*error/i, /wrong\s*mark/i, /incorrect/i], weight: 15 },
            low:      { patterns: [/review/i, /clarif/i, /question/i], weight: 5 }
        };

        for (const level of Object.values(urgencySignals)) {
            for (const pattern of level.patterns) {
                if (pattern.test(lowerMsg) && !isNegated(lowerMsg, pattern.source)) {
                    score += level.weight;
                    break;
                }
            }
        }

        const sentimentSignals = {
            distressed: {
                patterns: [/stress/i, /anxious/i, /worried/i, /panic/i, /unfair/i, /desperate/i],
                weight: 20
            },
            frustrated: {
                patterns: [/frustrated/i, /disappointed/i, /upset/i, /cannot believe/i],
                weight: 10
            }
        }
        
        for (const level of Object.values(sentimentSignals)) {
            for (const pattern of level.patterns) {
                if (pattern.test(lowerMsg)) {
                    score += level.weight;
                    break;
                }
            }
        }
        
        score += getAcademicImpactScore(finalMark);
        score += getStudentRiskScore(academic_year, concernCount);

        const MAX_SCORE = 120;
        const normalized = Math.min((score / MAX_SCORE) * 100, 100);

        console.log(`[Priority] Student: ${student_id} | Raw: ${score} | Normalized: ${normalized.toFixed(1)}`);

        if (normalized >= 70) return 'High';
        if (normalized >= 45) return 'Medium';
        return 'Low';

    } catch (err) {
        console.error('priorityDetector error:', err);
        return 'Low';
    }
}

module.exports = priorityDetector;