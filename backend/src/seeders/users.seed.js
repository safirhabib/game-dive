const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: '../config/config.env' });

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: '123456',
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: '123456',
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB...'.cyan.underline.bold);

    // Clear existing users
    await User.deleteMany();
    console.log('Cleared users collection'.yellow);

    // Hash passwords and create users
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    // Add users to database
    const usersList = await User.create(createdUsers);
    console.log(`Added ${usersList.length} users`.green);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB'.red.underline.bold);
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

// Run the seeder
if (process.argv[2] === '--import') {
  seedUsers();
} else {
  console.log('Please use --import to seed the database');
  process.exit(1);
}
