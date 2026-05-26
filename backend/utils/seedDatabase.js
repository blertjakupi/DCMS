const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

const DEFAULT_ROLES = [
  { role_name: 'Patient', normalized_name: 'PATIENT', description: 'Regular patient role' },
  { role_name: 'Dentist', normalized_name: 'DENTIST', description: 'Dentist role' },
  { role_name: 'Admin', normalized_name: 'ADMIN', description: 'Administrator role' },
  { role_name: 'Receptionist', normalized_name: 'RECEPTIONIST', description: 'Receptionist role' },
];

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_FIRST_NAME = 'System';
const ADMIN_LAST_NAME = 'Administrator';

const seedDatabase = async () => {
  try {
    const roleCount = await Role.count();
    if (roleCount === 0) {
      console.log('Seeding default roles...');
      await Role.bulkCreate(DEFAULT_ROLES);
    }

    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Seeding default admin user...');
      const adminRole = await Role.findOne({ where: { normalized_name: 'ADMIN' } });
      if (!adminRole) throw new Error('Admin role not found after seeding roles');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
      await User.create({
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        email: ADMIN_EMAIL,
        password_hash,
        phone_number: null,
        email_confirmed: true,
        lockout_enabled: false,
        access_failed_count: 0,
        status: 'Active',
        is_deleted: false,
        role_id: adminRole.role_id,
      });
      console.log(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedDatabase;