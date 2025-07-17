const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Papa = require("papaparse");

// Paths
const baseDir = path.resolve(__dirname, "..");
const publicDataDir = path.join(baseDir, "public", "data");

// Helpers
function parseCsv(filePath) {
    const csv = fs.readFileSync(filePath, "utf8");
    const parsed = Papa.parse(csv, { header: true }).data;

    return parsed.filter(row => Object.values(row).some(value => value?.toString().trim() !== ""));
}


function parseNumber(val) {
    return Number(val?.toString().replace(/[^0-9.-]+/g, '')) || 0;
}

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

// Prompt helpers
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, answer => resolve(answer.trim())));
}

// Exec
async function main() {
    if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

    const convertPlayers = (await askQuestion("Do you want to convert players? (yes/no): ")).toLowerCase().startsWith("y");
    const convertAlliances = (await askQuestion("Do you want to convert alliances? (yes/no): ")).toLowerCase().startsWith("y");

    if (!convertPlayers && !convertAlliances) {
        console.log("❌ No conversion selected. Exiting.");
        rl.close();
        return;
    }

    if (convertPlayers) {
        const playersFile = await askQuestion("Enter the players CSV filename (e.g., KvK3621 - kvk_month_DD.csv, where DD is the day): ");
        const playersCsvPath = path.join(baseDir, "data", playersFile);
        if (!fs.existsSync(playersCsvPath)) {
            console.error("❌ File not found:", playersCsvPath);
        } else {
            const players = processPlayers(parseCsv(playersCsvPath));
            fs.writeFileSync(path.join(publicDataDir, "playersFinal.json"), JSON.stringify(players, null, 2));
            console.log("✅ Players converted successfully.");
        }
    }

    if (convertAlliances) {
        const alliancesFile = await askQuestion("Enter the alliances CSV filename (e.g., KvK3621 - alliances_month_DD.csv, where DD is the day): ");
        const alliancesCsvPath = path.join(baseDir, "data", alliancesFile);
        if (!fs.existsSync(alliancesCsvPath)) {
            console.error("❌ File not found:", alliancesCsvPath);
        } else {
            const alliances = processAlliances(parseCsv(alliancesCsvPath));
            fs.writeFileSync(path.join(publicDataDir, "alliancesFinal.json"), JSON.stringify(alliances, null, 2));
            console.log("✅ Alliances converted successfully.");
        }
    }

    rl.close();
}

main();
