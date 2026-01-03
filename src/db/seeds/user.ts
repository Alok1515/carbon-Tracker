import { connectToDatabase } from '@/db/mongodb';
import { User } from '@/db/models';

async function main() {
    await connectToDatabase();

    const sampleUsers = [
        {
            _id: '68f77a82db5213724399a62c',
            id: '68f77a82db5213724399a62c',
            name: 'Emma Green',
            email: 'emma.green@carbontrack.com',
            emailVerified: true,
            image: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            _id: '68f77f93db5213724399a699',
            id: '68f77f93db5213724399a699',
            name: 'John Smith',
            email: 'john.smith@carbontrack.com',
            emailVerified: true,
            image: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            _id: '68f8e3cb846fbbf364f9515a',
            id: '68f8e3cb846fbbf364f9515a',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@carbontrack.com',
            emailVerified: true,
            image: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            _id: 'test_user_123',
            id: 'test_user_123',
            name: 'Test User',
            email: 'test.user@carbontrack.com',
            emailVerified: true,
            image: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await User.insertMany(sampleUsers);

    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});