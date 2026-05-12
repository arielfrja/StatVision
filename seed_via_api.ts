import axios from 'axios';

const API_URL = 'http://localhost:3000';
const AUTH_HEADER = { Authorization: 'Bearer mock-token' };

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

async function seedViaApi() {
    try {
        console.log("🚀 Seeding Roster via API...");

        // 1. Create the Team
        console.log("🏀 Creating Team...");
        const teamResponse = await axios.post(`${API_URL}/teams`, 
            { name: "StatVision Elite (API)" }, 
            { headers: AUTH_HEADER }
        );
        
        const teamId = teamResponse.data.id;
        console.log(`✅ Team Created! ID: ${teamId}`);

        // 2. Add Players
        for (const p of roster) {
            console.log(`👤 Adding Player: ${p.name}...`);
            await axios.post(`${API_URL}/teams/${teamId}/players`, 
                { 
                    name: p.name, 
                    jerseyNumber: p.number, 
                    description: `${p.position} | ${p.height}` 
                }, 
                { headers: AUTH_HEADER }
            );
            console.log(`   ✅ Added #${p.number}`);
        }

        console.log("\n⭐ SUCCESS: Roster seeded successfully via API!");
        process.exit(0);
    } catch (error: any) {
        console.error("❌ Seeding Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

seedViaApi();
