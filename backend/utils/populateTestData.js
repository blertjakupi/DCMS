// PER ME BO QITA RUN, E NALNI BACKEND EDHE E BONI PASTE QIT KOMANDE:
// node -e "require('./utils/populateTestData')()"
// mos harro mu kon ne /backend :)

const bcrypt = require('bcrypt');
const { sequelize, User, Role, Patient, Dentist, Treatment, Appointment, DentalRecord } = require('../models');

const PLAYERS = {
  admins: [
    { first_name: 'Cristiano', last_name: 'Ronaldo', email: 'cristiano.ronaldo@example.com' },
    { first_name: 'Lionel', last_name: 'Messi', email: 'lionel.messi@example.com' },
    { first_name: 'Neymar', last_name: 'Jr', email: 'neymar.jr@example.com' },
    { first_name: 'Luis', last_name: 'Suarez', email: 'luis.suarez@example.com' },
    { first_name: 'Sergio', last_name: 'Ramos', email: 'sergio.ramos@example.com' },
  ],
  dentists: [
    { first_name: 'Manuel', last_name: 'Neuer', email: 'manuel.neuer@example.com', specialization: 'Orthodontics' },
    { first_name: 'Philipp', last_name: 'Lahm', email: 'philipp.lahm@example.com', specialization: 'Periodontics' },
    { first_name: 'Thomas', last_name: 'Muller', email: 'thomas.muller@example.com', specialization: 'Endodontics' },
    { first_name: 'Toni', last_name: 'Kroos', email: 'toni.kroos@example.com', specialization: 'Prosthodontics' },
    { first_name: 'Mats', last_name: 'Hummels', email: 'mats.hummels@example.com', specialization: 'Oral Surgery' },
    { first_name: 'Bastian', last_name: 'Schweinsteiger', email: 'bastian.schweinsteiger@example.com', specialization: 'Pediatric Dentistry' },
    { first_name: 'Lukas', last_name: 'Podolski', email: 'lukas.podolski@example.com', specialization: 'General Dentistry' },
    { first_name: 'Miroslav', last_name: 'Klose', email: 'miroslav.klose@example.com', specialization: 'Orthodontics' },
    { first_name: 'Jerome', last_name: 'Boateng', email: 'jerome.boateng@example.com', specialization: 'Periodontics' },
    { first_name: 'Mesut', last_name: 'Ozil', email: 'mesut.ozil@example.com', specialization: 'Endodontics' },
  ],
  patients: [
    { first_name: 'Andres', last_name: 'Iniesta', email: 'andres.iniesta@example.com' },
    { first_name: 'Xavi', last_name: 'Hernandez', email: 'xavi.hernandez@example.com' },
    { first_name: 'Carles', last_name: 'Puyol', email: 'carles.puyol@example.com' },
    { first_name: 'Gerard', last_name: 'Pique', email: 'gerard.pique@example.com' },
    { first_name: 'Sergio', last_name: 'Busquets', email: 'sergio.busquets@example.com' },
    { first_name: 'Jordi', last_name: 'Alba', email: 'jordi.alba@example.com' },
    { first_name: 'Cesc', last_name: 'Fabregas', email: 'cesc.fabregas@example.com' },
    { first_name: 'David', last_name: 'Villa', email: 'david.villa@example.com' },
    { first_name: 'Fernando', last_name: 'Torres', email: 'fernando.torres@example.com' },
    { first_name: 'Sergio', last_name: 'Aguero', email: 'sergio.aguero@example.com' },
    { first_name: 'James', last_name: 'Rodriguez', email: 'james.rodriguez@example.com' },
    { first_name: 'Radamel', last_name: 'Falcao', email: 'radamel.falcao@example.com' },
    { first_name: 'Edinson', last_name: 'Cavani', email: 'edinson.cavani@example.com' },
    { first_name: 'Luis', last_name: 'Figo', email: 'luis.figo@example.com' },
    { first_name: 'Zlatan', last_name: 'Ibrahimovic', email: 'zlatan.ibrahimovic@example.com' },
  ],
};

const TREATMENTS = [
  { treatment_name: 'Routine Checkup', description: 'Standard oral examination', price: 50.00, average_duration: 30 },
  { treatment_name: 'Teeth Cleaning', description: 'Professional cleaning', price: 80.00, average_duration: 45 },
  { treatment_name: 'Cavity Filling', description: 'Composite resin filling', price: 150.00, average_duration: 60 },
  { treatment_name: 'Root Canal', description: 'Endodontic treatment', price: 800.00, average_duration: 90 },
  { treatment_name: 'Crown Placement', description: 'Dental crown fitting', price: 1200.00, average_duration: 60 },
  { treatment_name: 'Tooth Extraction', description: 'Simple extraction', price: 200.00, average_duration: 30 },
  { treatment_name: 'Orthodontic Consultation', description: 'Braces assessment', price: 100.00, average_duration: 45 },
  { treatment_name: 'Whitening', description: 'Teeth whitening procedure', price: 350.00, average_duration: 60 },
];

const PASSWORD = 'Test123!';
const SALT_ROUNDS = 10;

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDate = (date) => date.toISOString().slice(0, 10);
const formatTime = (date) => date.toTimeString().slice(0, 5);

const populateTestData = async () => {
  const transaction = await sequelize.transaction();
  try {
    const adminRole = await Role.findOne({ where: { normalized_name: 'ADMIN' }, transaction });
    const dentistRole = await Role.findOne({ where: { normalized_name: 'DENTIST' }, transaction });
    const patientRole = await Role.findOne({ where: { normalized_name: 'PATIENT' }, transaction });

    if (!adminRole || !dentistRole || !patientRole) {
      throw new Error('Roles not seeded yet. Run seedDatabase first.');
    }

    const password_hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    for (const player of PLAYERS.admins) {
      await User.create({
        first_name: player.first_name,
        last_name: player.last_name,
        email: player.email,
        password_hash,
        phone_number: null,
        email_confirmed: true,
        lockout_enabled: false,
        access_failed_count: 0,
        status: 'Active',
        is_deleted: false,
        role_id: adminRole.role_id,
      }, { transaction });
    }

    const dentistUsers = [];
    for (const player of PLAYERS.dentists) {
      const user = await User.create({
        first_name: player.first_name,
        last_name: player.last_name,
        email: player.email,
        password_hash,
        phone_number: null,
        email_confirmed: true,
        lockout_enabled: false,
        access_failed_count: 0,
        status: 'Active',
        is_deleted: false,
        role_id: dentistRole.role_id,
      }, { transaction });

      const dentist = await Dentist.create({
        user_id: user.user_id,
        first_name: player.first_name,
        last_name: player.last_name,
        birth_date: null,
        phone: null,
        email: player.email,
        specialization: player.specialization,
        status: 'Active',
        is_deleted: false,
      }, { transaction });
      dentistUsers.push(dentist);
    }

    const patientUsers = [];
    for (const player of PLAYERS.patients) {
      const user = await User.create({
        first_name: player.first_name,
        last_name: player.last_name,
        email: player.email,
        password_hash,
        phone_number: null,
        email_confirmed: true,
        lockout_enabled: false,
        access_failed_count: 0,
        status: 'Active',
        is_deleted: false,
        role_id: patientRole.role_id,
      }, { transaction });

      const patient = await Patient.create({
        user_id: user.user_id,
        first_name: player.first_name,
        last_name: player.last_name,
        birth_date: null,
        phone: null,
        email: player.email,
        address: null,
        allergies: null,
        status: 'Active',
        is_deleted: false,
      }, { transaction });
      patientUsers.push(patient);
    }

    // Seed treatments
    const treatmentInstances = [];
    for (const t of TREATMENTS) {
      const [treatment, created] = await Treatment.findOrCreate({
        where: { treatment_name: t.treatment_name },
        defaults: {
          description: t.description,
          price: t.price,
          average_duration: t.average_duration,
          status: 'Active',
          is_deleted: false,
        },
        transaction,
      });
      treatmentInstances.push(treatment);
    }

    // Create appointments from May 25, 2026 to June 15, 2026
    const startDate = new Date('2026-05-25');
    const endDate = new Date('2026-06-15');
    const appointments = [];
    const usedSlots = new Set();

    for (let i = 0; i < 80; i++) {
      const patient = patientUsers[Math.floor(Math.random() * patientUsers.length)];
      const dentist = dentistUsers[Math.floor(Math.random() * dentistUsers.length)];
      const treatment = treatmentInstances[Math.floor(Math.random() * treatmentInstances.length)];
      const date = randomDate(startDate, endDate);
      const dateStr = formatDate(date);
      // Random hour between 9 AM and 5 PM
      const hour = 9 + Math.floor(Math.random() * 8);
      const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotKey = `${dentist.dentist_id}-${dateStr}-${timeStr}`;
      if (usedSlots.has(slotKey)) continue;
      usedSlots.add(slotKey);
      const statusOptions = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const duration = treatment.average_duration || 30;
      const appointment = await Appointment.create({
        patient_id: patient.patient_id,
        dentist_id: dentist.dentist_id,
        treatment_id: treatment.treatment_id,
        appointment_date: dateStr,
        appointment_time: timeStr,
        duration,
        notes: `Appointment for ${treatment.treatment_name}`,
        status: status,
      }, { transaction });
      appointments.push(appointment);
    }

    // Create dental records for completed appointments (or some appointments)
    for (const appt of appointments) {
      if (appt.status === 'Completed') {
        const conditions = ['Cavity', 'Gingivitis', 'Healthy', 'Crown needed', 'Tooth sensitivity', 'Plaque buildup', 'Staining'];
        const teeth = ['11', '16', '24', '31', '36', '44', '48', 'General'];
        await DentalRecord.create({
          tooth: teeth[Math.floor(Math.random() * teeth.length)],
          condition: conditions[Math.floor(Math.random() * conditions.length)],
          notes: `Dental record for appointment #${appt.appointment_id}`,
          record_date: appt.appointment_date,
          dentist_id: appt.dentist_id,
          patient_id: appt.patient_id,
          appointment_id: appt.appointment_id,
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log('Test data populated successfully!');
    console.log(`Created: ${PLAYERS.admins.length} admins, ${dentistUsers.length} dentists, ${patientUsers.length} patients`);
    console.log(`Created ${treatmentInstances.length} treatments, ${appointments.length} appointments, and related dental records.`);
    console.log(`All users have password: ${PASSWORD}`);
  } catch (error) {
    await transaction.rollback();
    console.error('Error populating test data:', error);
  }
};

module.exports = populateTestData;
