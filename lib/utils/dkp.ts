/**
 * Calculates the maximum DKP (Dragon Kill Points) a player can earn,
 * based on their power using tiered multipliers.
 */
export function getDKPMax(power: number): number {
    if (power <= 25_000_000) return 30 * power;
    if (power <= 35_000_000) return 35 * power;
    if (power <= 45_000_000) return 40 * power;
    if (power <= 55_000_000) return 45 * power;
    if (power <= 65_000_000) return 50 * power;
    if (power <= 75_000_000) return 55 * power;
    if (power <= 85_000_000) return 60 * power;
    if (power <= 95_000_000) return 65 * power;
    return 70 * power;
}

/**
 * Calculates the DKP percentage reached by a player based on current DKP and max possible.
 * Returns a rounded percentage.
 */
export function getDKPPercentage(dkp: number, power: number): number {
    const max = getDKPMax(power);
    return max ? Math.round((dkp / max) * 100) : 0;
}
