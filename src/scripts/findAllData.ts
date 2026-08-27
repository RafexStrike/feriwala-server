import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { logger } from '../config/logger';

interface CollectionInfo {
  name: string;
  documentCount: number;
  sampleDocuments: any[];
  fields: string[];
}

async function findAllData() {
  try {
    await connectDB();
    logger.info('🔍 Starting database inspection...');
    console.log('\n' + '='.repeat(80));
    console.log('DATABASE INSPECTION REPORT');
    console.log('='.repeat(80) + '\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Total Collections Found: ${collections.length}\n`);

    const allCollectionsInfo: CollectionInfo[] = [];

    // Process each collection
    for (const col of collections) {
      const collectionName = col.name;
      const collection = db.collection(collectionName);

      // Get document count
      const documentCount = await collection.countDocuments();

      // Get sample documents (first 5)
      const sampleDocuments = await collection.find({}).limit(5).toArray();

      // Get field names from first document
      let fields: string[] = [];
      if (sampleDocuments.length > 0) {
        fields = Object.keys(sampleDocuments[0]);
      }

      allCollectionsInfo.push({
        name: collectionName,
        documentCount,
        sampleDocuments,
        fields,
      });

      // Print collection summary
      console.log(`\n📁 Collection: ${collectionName}`);
      console.log(`   └─ Documents: ${documentCount}`);
      if (fields.length > 0) {
        console.log(`   └─ Fields: ${fields.join(', ')}`);
      }
    }

    // Detailed view of each collection
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED COLLECTION INFORMATION');
    console.log('='.repeat(80));

    for (const collInfo of allCollectionsInfo) {
      console.log(`\n📋 ${collInfo.name.toUpperCase()}`);
      console.log('-'.repeat(80));
      console.log(`Total Documents: ${collInfo.documentCount}`);
      console.log(`Fields: ${collInfo.fields.length > 0 ? collInfo.fields.join(', ') : 'N/A'}`);

      if (collInfo.sampleDocuments.length > 0) {
        console.log(`\nSample Documents (showing ${Math.min(5, collInfo.sampleDocuments.length)}):`);
        collInfo.sampleDocuments.forEach((doc, index) => {
          console.log(`\n  ${index + 1}. ID: ${doc._id}`);
          console.log(`     ${JSON.stringify(doc, null, 4)}`);
        });
      } else {
        console.log('No documents found');
      }
    }

    // Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY STATISTICS');
    console.log('='.repeat(80));
    const totalDocuments = allCollectionsInfo.reduce((sum, col) => sum + col.documentCount, 0);
    console.log(`Total Collections: ${allCollectionsInfo.length}`);
    console.log(`Total Documents: ${totalDocuments}`);
    console.log(`Empty Collections: ${allCollectionsInfo.filter(col => col.documentCount === 0).length}`);

    // Export to JSON file for easy inspection
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCollections: allCollectionsInfo.length,
        totalDocuments,
        emptyCollections: allCollectionsInfo.filter(col => col.documentCount === 0).length,
      },
      collections: allCollectionsInfo,
    };

    console.log('\n✅ Database inspection completed successfully!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    logger.error({ error }, 'Database inspection failed');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

findAllData();
