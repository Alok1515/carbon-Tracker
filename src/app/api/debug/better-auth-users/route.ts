import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const connection = await connectToDatabase();
    const db = connection.connection.db;
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Define patterns that might indicate user/auth collections
    const userCollectionPatterns = [
      'user', 'users', 'betterAuthUser', 'betterauth_user',
      'better_auth_user', 'account', 'accounts', 'session', 'sessions',
      'verification', 'verifications', 'authenticator', 'authenticators'
    ];
    
    // Find collections that match user/auth patterns
    const potentialUserCollections = collectionNames.filter(name => 
      userCollectionPatterns.some(pattern => 
        name.toLowerCase().includes(pattern.toLowerCase())
      )
    );
    
    // Also include all collections for comprehensive debugging
    const allCollectionData: Record<string, any[]> = {};
    
    // Query all collections to find user data
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).limit(20).toArray();
        
        // Check if documents have user-like fields
        const hasUserFields = documents.some(doc => 
          doc.email || doc.username || doc.emailVerified || 
          doc.userId || doc.user_id || doc.provider || doc.passwordHash
        );
        
        if (documents.length > 0) {
          allCollectionData[collectionName] = {
            count: documents.length,
            hasUserFields,
            isPotentialUserCollection: potentialUserCollections.includes(collectionName),
            sampleDocuments: documents.map(doc => ({
              ...doc,
              _id: doc._id.toString(),
              // Mask sensitive data
              passwordHash: doc.passwordHash ? '[REDACTED]' : undefined,
              password: doc.password ? '[REDACTED]' : undefined
            }))
          };
        }
      } catch (collectionError) {
        console.error(`Error querying collection ${collectionName}:`, collectionError);
        allCollectionData[collectionName] = {
          error: collectionError instanceof Error ? collectionError.message : 'Unknown error'
        };
      }
    }
    
    // Find collections with most likely user data
    const likelyUserCollections = Object.entries(allCollectionData)
      .filter(([_, data]: [string, any]) => data.hasUserFields || data.isPotentialUserCollection)
      .map(([name, data]) => ({
        name,
        ...data
      }));
    
    return NextResponse.json({
      success: true,
      summary: {
        totalCollections: collectionNames.length,
        potentialUserCollections: potentialUserCollections.length,
        likelyUserCollections: likelyUserCollections.length
      },
      allCollections: collectionNames,
      potentialUserCollections,
      likelyUserCollections,
      allCollectionData,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to query database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}