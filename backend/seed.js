const { exec } = require('child_process');
const path = require('path');

// Get the command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Define available seeders
const seeders = {
  users: path.join(__dirname, 'src', 'seeders', 'users.seed.js'),
  games: path.join(__dirname, 'src', 'seeders', 'games.seed.js'),
  all: 'all'
};

// Help message
const showHelp = () => {
  console.log(`
  Usage: node seed.js [command]

  Commands:
    --users         Seed users only
    --games         Seed games only
    --all           Seed all data (default)
    --help          Show this help message
  `);
};

// Run a seeder
const runSeeder = (seeder) => {
  return new Promise((resolve, reject) => {
    const seedProcess = exec(`node ${seeder} --import`);
    
    seedProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    seedProcess.stderr.on('data', (data) => {
      console.error(`Error: ${data}`.red);
    });
    
    seedProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Seeder ${seeder} failed with code ${code}`));
      }
    });
  });
};

// Main function
const seed = async () => {
  try {
    console.log('Starting database seeding...'.cyan.underline.bold);
    
    if (command === '--help' || command === '-h') {
      showHelp();
      process.exit(0);
    } else if (command === '--users') {
      await runSeeder(seeders.users);
    } else if (command === '--games') {
      await runSeeder(seeders.games);
    } else if (command === '--all' || !command) {
      // Default: seed all
      await runSeeder(seeders.users);
      await runSeeder(seeders.games);
    } else {
      console.error(`Unknown command: ${command}`.red);
      showHelp();
      process.exit(1);
    }
    
    console.log('\nDatabase seeding completed successfully!'.green.bold);
    process.exit(0);
  } catch (error) {
    console.error(`\nError during seeding: ${error.message}`.red);
    process.exit(1);
  }
};

// Run the seeder
seed();
