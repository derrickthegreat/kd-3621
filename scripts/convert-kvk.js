const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

// Caminhos
const baseDir = path.resolve(__dirname, "..");
const publicDataDir = path.join(baseDir, "public", "data");

const playersCsvPath = path.join(baseDir, "data", "KvK3621 - kvk_june_21.csv");
const alliancesCsvPath = path.join(baseDir, "data", "KvK3621 - alliances_june_14.csv");

// Helpers
function parseCsv(filePath) {
    const csv = fs.readFileSync(filePath, "utf8");
    return Papa.parse(csv, { header: true }).data;
}

// Convert string para número ou zero
function parseNumber(val) {
    return Number(val?.toString().replace(/[^0-9.-]+/g, '')) || 0;
}

// Process players
function processPlayers(rows) {
    return rows.map((row, index) => ({
        "#": index + 1,
        ID: row.ID,
        Name: row.Name,
        Power: parseNumber(row.Power),
        Killpoints: parseNumber(row.Killpoints),
        Deads: parseNumber(row.Deads),
        "T1 Kills": parseNumber(row["T1 Kills"]),
        "T2 Kills": parseNumber(row["T2 Kills"]),
        "T3 Kills": parseNumber(row["T3 Kills"]),
        "T4 Kills": parseNumber(row["T4 Kills"]),
        "T5 Kills": parseNumber(row["T5 Kills"]),
        "Total Kills": parseNumber(row["Total Kills"]),
        "T45 Kills": parseNumber(row["T45 Kills"]),
        Ranged: parseNumber(row.Ranged),
        "Rss Gathered": parseNumber(row["Rss Gathered"]),
        "Rss Assistance": parseNumber(row["Rss Assistance"]),
        Helps: parseNumber(row.Helps),
        Alliance: row.Alliance || ""
    }));
}

// Process alliances
function processAlliances(rows) {
    return rows.map((row, index) => {
        const tagMatch = row.Name.match(/\[([^\]]+)\]/);
        const tag = tagMatch ? tagMatch[1] : "";
        const name = row.Name.replace(/\[[^\]]+\]\s*/, "");
        return {
            "#": index + 1,
            Tag: tag,
            Name: name,
            Score: parseNumber(row.Score)
        };
    });
}

// Exec
function main() {
    if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

    const players = processPlayers(parseCsv(playersCsvPath));
    const alliances = processAlliances(parseCsv(alliancesCsvPath));

    fs.writeFileSync(path.join(publicDataDir, "playersFinal.json"), JSON.stringify(players, null, 2));
    fs.writeFileSync(path.join(publicDataDir, "alliances.json"), JSON.stringify(alliances, null, 2));

    console.log("✅ Converted CSVs to JSON in /public/data/");
}

main();
