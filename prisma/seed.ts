import { PrismaClient } from "@prisma/client"; 
import { parse } from "csv-parse";
import { promises as fs } from "fs";
import fg from "fast-glob";
import path from "path";

// Instantiate the Prisma client
const prisma = new PrismaClient();

// Helper function to extract tag and name from alliance string
function parseAllianceString(allianceStr: string): { tag: string; name: string } {
  const regex = /^\[(.*?)\]\s*(.*)$/;
  const match = allianceStr.match(regex);

  if (match) {
    return {
      tag: match[1].trim(),
      name: match[2].trim(),
    };
  } else {
    // If no bracketed tag is found, use the full string as both tag and name
    // This handles cases like "Corral" which might not have a tag in the player CSV.
    const trimmedStr = allianceStr.trim();
    return {
      tag: trimmedStr,
      name: trimmedStr,
    };
  }
}

async function seed() {
  console.log("🚀 Starting database seeding process...");

  // --- Step 1: Seed Alliance Data -----------------------------------------
  // This map will store alliance tags/names to their IDs for quick lookup
  const allianceMap = new Map<string, string>();

  console.log("⚙️ Seeding Alliance data...");
  const allianceCsvPaths = await fg("data/KvK3621 - alliances_*.csv");

  for (const filePath of allianceCsvPaths) {
    const content = await fs.readFile(filePath, "utf-8");

    await new Promise<void>((resolve, reject) => {
      parse(content, { columns: true, skip_empty_lines: true }, async (err, records: any[]) => {
        if (err) return reject(err);

        for (const row of records) {
          const { Name: originalName, Score, Members } = row; // Alliance CSV has 'Name' and 'Score'

          if (!originalName) {
            console.warn(`Skipping alliance row due to missing Name: ${JSON.stringify(row)}`);
            continue;
          }

          const { tag: allianceTag, name: allianceName } = parseAllianceString(originalName);

          try {
            const alliance = await prisma.alliance.upsert({
              where: { tag: allianceTag }, // Use the extracted tag for unique lookup
              update: { name: allianceName },
              create: {
                tag: allianceTag,
                name: allianceName,
              },
            });
            allianceMap.set(allianceTag, alliance.id); // Store tag -> ID mapping
            if (allianceName) { // Also store name -> ID if name is distinct from tag
                allianceMap.set(allianceName, alliance.id);
            }


            // Optionally, create AllianceStats here if your alliance CSV contains snapshot data
            // Assuming 'Score' from alliance CSV maps to 'totalPower' and 'Members' to 'totalPlayers'
            if (Score && Members) {
                await prisma.allianceStats.create({
                    data: {
                        allianceId: alliance.id,
                        totalPower: parseInt(Score, 10),
                        totalPlayers: parseInt(Members, 10),
                        snapshot: new Date(), // Using current timestamp for the snapshot
                    }
                });
            }

          } catch (e) {
            console.error(`Error upserting alliance (Tag: ${allianceTag}, Name: ${allianceName}):`, e);
          }
        }
        resolve();
      });
    });
    console.log(`✅ Seeded alliance data from ${path.basename(filePath)}`);
  }

  // --- Step 2: Seed Player Data and link to Alliances --------------------
  console.log("⚙️ Seeding Player and PlayerStats data...");
  const playerCsvPaths = await fg("data/KvK3621 - kvk_*.csv");

  for (const filePath of playerCsvPaths) {
    const content = await fs.readFile(filePath, "utf-8");

    // Extract snapshot date from filename (e.g., "kvk_june_24.csv" -> June 24th)
    const fileName = path.basename(filePath);
    const dateMatch = fileName.match(/kvk_(\w+_\d+)\.csv/i);
    let snapshotDate = new Date(); // Default to current date if parsing fails

    if (dateMatch && dateMatch[1]) {
      const dateString = dateMatch[1].replace(/_/g, ' '); // e.g., "june 24"
      const currentYear = new Date().getFullYear();
      const parsedDate = new Date(`${dateString}, ${currentYear}`);
      if (!isNaN(parsedDate.getTime())) { // Check if date parsing was successful
        snapshotDate = parsedDate;
      } else {
        console.warn(`Could not parse date "${dateString}" from filename "${fileName}". Using current date for snapshot.`);
      }
    } else {
      console.warn(`Could not extract date from filename "${fileName}". Using current date for snapshot.`);
    }

    await new Promise<void>((resolve, reject) => {
      parse(content, { columns: true, skip_empty_lines: true }, async (err, records: any[]) => {
        if (err) return reject(err);

        for (const row of records) {
          const {
            ID,          // ROK ID
            Name,        // Player Name
            Power,
            Killpoints,
            Deads,
            "T1 Kills": t1,
            "T2 Kills": t2,
            "T3 Kills": t3,
            "T4 Kills": t4,
            "T5 Kills": t5,
            "T45 Kills": t45,
            Alliance: allianceRawString, // The column in player CSV that holds alliance name/tag (e.g., "[LV21] Lords of Valinor")
            // ...add any other columns you need from the player CSV
          } = row;

          if (!ID || !Name || !Power || !Killpoints || !Deads || !t4 || !t5 || !t45) {
             console.warn(`Skipping player row due to missing essential data: ${JSON.stringify(row)}`);
             continue;
          }

          let allianceId: string | undefined;
          if (allianceRawString) {
            const { tag: playerAllianceTag, name: playerAllianceName } = parseAllianceString(allianceRawString);

            // Attempt to find alliance by tag first, then by name
            allianceId = allianceMap.get(playerAllianceTag);
            if (!allianceId && playerAllianceName) {
                allianceId = allianceMap.get(playerAllianceName);
            }

            if (!allianceId) {
              console.warn(`Alliance "${allianceRawString}" (parsed: Tag='${playerAllianceTag}', Name='${playerAllianceName}') not found for player ${Name}. Player will be unlinked.`);
            }
          }

          try {
            // Upsert the Player
            const player = await prisma.player.upsert({
              where: { rokId: ID },
              update: {
                name: Name,
                // Only update alliance if a valid ID was found
                alliance: allianceId ? { connect: { id: allianceId } } : undefined,
              },
              create: {
                rokId: ID,
                name: Name,
                // Connect to alliance if found during creation
                alliance: allianceId ? { connect: { id: allianceId } } : undefined,
              },
            });

            // Create a player stats snapshot
            await prisma.playerStats.create({
              data: {
                playerId: player.id,
                power: parseInt(Power, 10),
                killPoints: parseInt(Killpoints, 10),
                deaths: parseInt(Deads, 10),
                t4Kills: parseInt(t4 || '0', 10), // Use '0' as fallback for potentially empty or missing values
                t5Kills: parseInt(t5 || '0', 10),
                t45Kills: parseInt(t45 || '0', 10),
                // Use the extracted snapshot date
                snapshot: snapshotDate,
                // dkp: row.DKP ? parseInt(row.DKP, 10) : undefined, // Example for optional DKP
              },
            });
          } catch (e) {
            console.error(`Error upserting player ${Name} (ID: ${ID}):`, e);
          }
        }
        resolve();
      });
    });
    console.log(`✅ Seeded player data from ${path.basename(filePath)}`);
  }

  console.log("🌱 Seeding complete!");
}

// Execute the seeding function
seed()
  .catch(e => {
    console.error("❌ An error occurred during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect from the database when done or on error
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database.");
  });