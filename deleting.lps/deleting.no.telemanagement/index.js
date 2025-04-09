const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');

// MongoDB connection settings
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017';
const dbName = 'admin'; // Assuming default database
const collectionName = 'lightingpointmodels';
const tenantId = '836a4e40-b93a-4071-b02f-247920516914';

// CSV file path
const csvFilePath = path.join(__dirname, 'input.csv');

// Counter variables
let totalRecords = 0;
let successCount = 0;
let failCount = 0;
let notFoundCount = 0;

async function main() {
    // Read CSV file and extract lp_name values
    const lpNames = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.lp_name) {
                    lpNames.push(row.lp_name);
                    totalRecords++;
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Read ${totalRecords} records from CSV file`);

    // Connect to MongoDB
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        // Process each lp_name
        for (let i = 0; i < lpNames.length; i++) {
            const lpName = lpNames[i];

            try {
                console.log(`Processing ${i + 1}/${totalRecords}: lp_name = ${lpName}`);

                // Delete the record matching lp_name and lp_tenantId
                const result = await collection.deleteOne({
                    lp_name: lpName,
                    lp_tenantId: tenantId
                });

                if (result.deletedCount === 1) {
                    successCount++;
                    console.log(`✅ SUCCESS (${successCount}/${totalRecords}): Deleted lighting point ${lpName}`);
                } else {
                    notFoundCount++;
                    console.log(`⚠️ NOT FOUND (${notFoundCount}/${totalRecords}): No matching lighting point for ${lpName}`);
                }
            } catch (error) {
                failCount++;
                console.error(`❌ ERROR (${failCount}/${totalRecords}): Failed to delete ${lpName}:`, error.message);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Print summary
        console.log('\n---- DELETION SUMMARY ----');
        console.log(`Total records processed: ${totalRecords}`);
        console.log(`Successful deletions: ${successCount}`);
        console.log(`Records not found: ${notFoundCount}`);
        console.log(`Failed operations: ${failCount}`);

        await client.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
main().catch(console.error);