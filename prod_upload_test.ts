import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://statvision-api-prod-chsbu3g4oa-uc.a.run.app';
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik05RjhGamc0aXpFSFQ4TGpTdEphaiJ9.eyJpc3MiOiJodHRwczovL2Rldi0zb3M4bTB6eWZ4bXg2MG5uLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2YTE3ZWEzOWM2NGUzYTc3YmZhODUzMGYiLCJhdWQiOlsiYmFzZXRiYWxsLWFuYWx5emVyIiwiaHR0cHM6Ly9kZXYtM29zOG0wenlmeG14NjBubi51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzc5OTUyOTUyLCJleHAiOjE3ODAwMzkzNTIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhenAiOiJFd3puUER2cmdJbWl1SFJQNDVIYmFwQXdHVG9jNHRxTSJ9.j1dT9l237Gku_YQJYLhI7W8V-6cmOrnqdYxpIfGTOzNl0Fc4vT1AwsaVf-5haMXpKFXdRVzWL5QPrpabDwSd6BWb0FQKjS9wWVuYIoRvgNGAm1PHjkVD6ouQT6lDy9BuwK-9D2_qllB6x--JRlgX7xUwEA_VNZXdHiVw6opjmdOag22Qm9cVkf4uy8MLwZXvexhnuEjfEqdjpdc269dPRzhO3wWBMQhwpF0YFsnJvF_vhdqxLnV2PxQwASQ5cOYY9RSKUTVxEnpJjtxVyPKIxp1F7vfRLP2LN19dG5IIYd6SJFlufFETurIbbArMJge2hOGce6vS4QHPYGc6sj6MLA';

const filePath = path.resolve(__dirname, 'docs/assets/demo.webm');
const stats = fs.statSync(filePath);

async function runTest() {
    try {
        console.log("🚀 Starting Production Upload Test...");

        // 1. Create a Game
        console.log("🏀 Creating new game...");
        const gameResponse = await axios.post(`${API_URL}/games`, {
            name: `Prod Test - ${new Date().toISOString()}`,
            gameDate: new Date(),
            location: "Production Cloud",
            gameType: "FULL_COURT",
            identityMode: "JERSEY_COLORS",
            visualContext: {
                homeTeamColor: "#FF0000",
                awayTeamColor: "#0000FF"
            },
            ruleset: {
                pointValue: "2_AND_3",
                halfCourt: false
            }
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const gameId = gameResponse.data.id;
        console.log(`✅ Game Created! ID: ${gameId}`);

        // 2. Get Upload URL
        console.log("📡 Getting resumable upload URL...");
        const urlResponse = await axios.get(`${API_URL}/games/${gameId}/upload-url`, {
            params: {
                fileName: 'demo.webm',
                contentType: 'video/webm'
            },
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const { uploadUrl, gcsUri } = urlResponse.data;
        console.log(`✅ Received Upload URL!`);
        console.log(`🔗 GCS URI: ${gcsUri}`);

        // 3. Upload to GCS
        console.log("📤 Uploading file to GCS...");
        const fileBuffer = fs.readFileSync(filePath);
        await axios.put(uploadUrl, fileBuffer, {
            headers: {
                'Content-Type': 'video/webm'
            }
        });
        console.log("✅ File uploaded successfully!");

        // 4. Confirm Upload
        console.log("🏁 Confirming upload to trigger analysis...");
        const confirmResponse = await axios.post(`${API_URL}/games/${gameId}/upload-complete`, {
            gcsUri
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        console.log(`✅ Upload Confirmed! Response:`, confirmResponse.data);
        console.log("\n⭐ SUCCESS: Production upload test triggered!");
        console.log(`Check logs for Game ID: ${gameId}`);

    } catch (error: any) {
        console.error("❌ Test Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runTest();
