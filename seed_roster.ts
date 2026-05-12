import "reflect-metadata";
import { DataSource } from "typeorm";
import { 
    TeamService, PlayerService, GameStatsService, 
    Team, Player, User, ILogger, 
    PlayerTeamHistory, Game, GameEvent, 
    GameTeamStats, GamePlayerStats, VideoAnalysisJob, Chunk 
} from "@statvision/common";

const logger: ILogger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    debug: (msg) => console.debug(`[DEBUG] ${msg}`),
};

const TestDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "statsvision",
    password: "statsvision_password",
    database: "statsvision_db",
    synchronize: false,
    entities: [User, Team, Player, PlayerTeamHistory, Game, GameEvent, GameTeamStats, GamePlayerStats, VideoAnalysisJob, Chunk],
});

const roster = [
    { number: 5, name: "Danica Kuntz", height: "160 cm", position: "Point Guard" },
    { number: 10, name: "Macie Hensley", height: "163 cm", position: "Guard" },
    { number: 12, name: "Jocelynn Faulkner", height: "165 cm", position: "Guard" },
    { number: 15, name: "Chloe Smith", height: "168 cm", position: "Forward" },
    { number: 22, name: "Jenna Bules", height: "165 cm", position: "Guard" },
    { number: 30, name: "Ava Brown", height: "170 cm", position: "Forward" },
    { number: 34, name: "Addyson Viers", height: "178 cm", position: "Center" },
    { number: 52, name: "Mia Davis", height: "173 cm", position: "Forward" }
];

async function seedRoster() {
    try {
        console.log("🚀 Seeding Roster to Local DB...");
        await TestDataSource.initialize();

        // 1. Get or Create Test User
        const userRepo = TestDataSource.getRepository(User);
        let testUser = await userRepo.findOne({ where: { providerUid: "test-user-123" } });
        if (!testUser) {
            testUser = userRepo.create({
                email: "test@statvision.ai",
                providerUid: "test-user-123"
            });
            await userRepo.save(testUser);
            console.log("👤 Test User created.");
        }

        // 2. Setup Services
        const gameStatsService = new GameStatsService(null as any, null as any, null as any, logger);
        const teamService = new TeamService(TestDataSource, logger);
        const playerService = new PlayerService(TestDataSource, gameStatsService, logger);

        // 3. Create Team
        const teamName = "StatVision Elite";
        const newTeam = await teamService.createTeam(teamName, testUser);
        console.log(`🏀 Team "${teamName}" created (ID: ${newTeam.id})`);

        // 4. Add Players
        for (const p of roster) {
            await playerService.createPlayerAndAssignToTeam(
                p.name,
                newTeam.id,
                p.number,
                `${p.position} | ${p.height}`
            );
            console.log(` ✅ Added: #${p.number} ${p.name}`);
        }

        console.log("\n⭐ SUCCESS: Roster seeded successfully!");
        await TestDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
}

seedRoster();
