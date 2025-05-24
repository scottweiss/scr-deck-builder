import { BatchResult } from './matchSimulator';
import { ConsistencyReport } from './deckTestTypes';

/**
 * Analyze result consistency
 */
export function analyzeConsistency(result: BatchResult): ConsistencyReport {
    // Calculate win rate variance
    const winRates = result.detailedResults.map(r => r.winner === 'player1' ? 1 : 0);
    const variance = calculateVariance(winRates);
    
    const turnVariance = calculateVariance(result.detailedResults.map(r => r.turns));
    
    return {
        winRateVariance: variance,
        turnVariance,
        consistencyScore: Math.max(0, 1 - (variance * 2)), // Higher is more consistent
        recommendations: generateConsistencyRecommendations(variance, turnVariance)
    };
}

/**
 * Calculate statistical variance of a set of values
 */
export function calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return variance;
}

/**
 * Generate recommendations for improving deck consistency
 */
export function generateConsistencyRecommendations(winVariance: number, turnVariance: number): string[] {
    const recommendations: string[] = [];

    if (winVariance > 0.3) {
        recommendations.push('High win rate variance - consider more consistent cards');
    }

    if (turnVariance > 25) {
        recommendations.push('Game length varies significantly - review win conditions');
    }

    return recommendations;
}
