// https://nlm-api.nouvenn.com/nlm/disassociate/B4:35:22:FF:FE:23:59:90
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Indlc2xleS5iYXJib3NhQG5vdXZlbm4uY29tIiwic2Vzc2lvbklkIjoiZmZjZDYyMmMtOTZkNS00NjRhLTgxY2MtNjY5NzFlNzI1NWZkIiwiaWF0IjoxNzQ0MjA1NDM1fQ.upy4_2A5XNw9x5JzMmuhlzlZ8g3mfwIaS0lN9fuBjBA

const { MongoClient } = require('mongodb');
const axios = require('axios');

// MongoDB connection settings
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017';
const dbName = 'admin'; // Assuming default database, adjust if needed
const collectionName = 'devicenlmmodels';
const tenantId = '86090976-819b-4895-a5ef-1f7e6d86f50a';

// API settings
const apiBaseUrl = 'https://nlm-api.nouvenn.com/nlm/disassociate';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Indlc2xleS5iYXJib3NhQG5vdXZlbm4uY29tIiwic2Vzc2lvbklkIjoiZmZjZDYyMmMtOTZkNS00NjRhLTgxY2MtNjY5NzFlNzI1NWZkIiwiaWF0IjoxNzQ0MjA1NDM1fQ.upy4_2A5XNw9x5JzMmuhlzlZ8g3mfwIaS0lN9fuBjBA';

async function main() {
    const client = new MongoClient(uri);
    let successCount = 0;
    let failCount = 0;
    let totalCount = 0;

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        // Find devices with matching tenant ID where dvc_lp is not empty or null
        const query = {
            dvc_tenantId: tenantId,
            dvc_lp: {
                $exists: true,
                $ne: null,
                $ne: ""
            }
        };

        const devices = await collection.find(query).toArray();

        totalCount = devices.length;
        console.log(`Found ${totalCount} devices to process (with non-empty dvc_lp)`);


        const deviceIds = devices.map(device => device.dvc_identification);

        // Process each device ID
        for (let i = 0; i < deviceIds.length; i++) {
            const deviceId = deviceIds[i];
            try {
                console.log(`Processing device ${i + 1}/${totalCount}: ${deviceId}`);

                const response = await axios({
                    method: 'put',
                    url: `${apiBaseUrl}/${deviceId}`,
                    headers: {
                        'Cookie': `token=${token}`
                    }
                });

                if (response.status === 200) {
                    successCount++;
                    console.log(`Success (${successCount}/${totalCount}): ${deviceId}`);
                } else {
                    failCount++;
                    console.log(`Failed with status ${response.status} (${failCount}/${totalCount}): ${deviceId}`);
                }
            } catch (error) {
                failCount++;
                console.error(`Error processing ${deviceId} (${failCount}/${totalCount}):`, error.message);
            }

            // Brief pause between requests to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log('\n---- SUMMARY ----');
        console.log(`Total devices: ${totalCount}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        await client.close();
        console.log('MongoDB connection closed');
    }
}

main().catch(console.error);