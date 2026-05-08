const sequelize = require('../config/database');

const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const UserClaim = require('./UserClaim');
const UserToken = require('./UserToken');
const RefreshToken = require('./RefreshToken');
const Dentist = require('./Dentist');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const Treatment = require('./Treatment');
const PatientTreatment = require('./PatientTreatment');
const DentalRecord = require('./DentalRecord');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const InvoiceItem = require('./InvoiceItem');
const WorkSchedule = require('./WorkSchedule');
const Reminder = require('./Reminder');
const InventoryItem = require('./InventoryItem');
const InventoryTransaction = require('./InventoryTransaction');
const DentistAvailability = require('./DentistAvailability');

//Users - Roles (M:N)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id'
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id'
});
UserRole.belongsTo(User, { foreignKey: 'user_id' });
UserRole.belongsTo(Role, { foreignKey: 'role_id' });

//UserClaim, UserToken, RefreshToken
User.hasMany(UserClaim, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
UserClaim.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserToken, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
UserToken.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id'
});

//1-1
User.hasOne(Dentist, {
  foreignKey: 'user_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Dentist.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Patient, {
  foreignKey: 'user_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Patient.belongsTo(User, { foreignKey: 'user_id' });

//1:M
Patient.hasMany(Appointment, {
  foreignKey: 'patient_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

Dentist.hasMany(Appointment, {
  foreignKey: 'dentist_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Appointment.belongsTo(Dentist, { foreignKey: 'dentist_id' });

Appointment.hasMany(PatientTreatment, {
  foreignKey: 'appointment_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
PatientTreatment.belongsTo(Appointment, { foreignKey: 'appointment_id' });

Treatment.hasMany(PatientTreatment, {
  foreignKey: 'treatment_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
PatientTreatment.belongsTo(Treatment, { foreignKey: 'treatment_id' });

Patient.hasMany(PatientTreatment, {
  foreignKey: 'patient_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
PatientTreatment.belongsTo(Patient, { foreignKey: 'patient_id' });

Dentist.hasMany(PatientTreatment, {
  foreignKey: 'dentist_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
PatientTreatment.belongsTo(Dentist, { foreignKey: 'dentist_id' });

Patient.hasMany(DentalRecord, {
  foreignKey: 'patient_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
DentalRecord.belongsTo(Patient, { foreignKey: 'patient_id' });

Dentist.hasMany(DentalRecord, {
  foreignKey: 'dentist_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
DentalRecord.belongsTo(Dentist, { foreignKey: 'dentist_id' });

Appointment.hasMany(DentalRecord, {
  foreignKey: 'appointment_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
DentalRecord.belongsTo(Appointment, { foreignKey: 'appointment_id' });

Patient.hasMany(Invoice, {
  foreignKey: 'patient_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Invoice.belongsTo(Patient, { foreignKey: 'patient_id' });

Appointment.hasMany(Invoice, {
  foreignKey: 'appointment_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Invoice.belongsTo(Appointment, { foreignKey: 'appointment_id' });

Invoice.hasMany(Payment, {
  foreignKey: 'invoice_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Invoice.hasMany(InvoiceItem, {
  foreignKey: 'invoice_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Treatment.hasMany(InvoiceItem, {
  foreignKey: 'treatment_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
InvoiceItem.belongsTo(Treatment, { foreignKey: 'treatment_id' });

Dentist.hasMany(WorkSchedule, {
  foreignKey: 'dentist_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
WorkSchedule.belongsTo(Dentist, { foreignKey: 'dentist_id' });

Appointment.hasMany(Reminder, {
  foreignKey: 'appointment_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Reminder.belongsTo(Appointment, { foreignKey: 'appointment_id' });

InventoryItem.hasMany(InventoryTransaction, {
  foreignKey: 'item_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
InventoryTransaction.belongsTo(InventoryItem, { foreignKey: 'item_id' });

Dentist.hasMany(DentistAvailability, {
   foreignKey: 'dentist_id'
});
DentistAvailability.belongsTo(Dentist, {
   foreignKey: 'dentist_id'
});

Treatment.hasMany(Appointment, {
   foreignKey: 'treatment_id'
});
Appointment.belongsTo(Treatment, {
   foreignKey: 'treatment_id'
});

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  UserClaim,
  UserToken,
  RefreshToken,
  Dentist,
  Patient,
  Appointment,
  Treatment,
  PatientTreatment,
  DentalRecord,
  Invoice,
  Payment,
  InvoiceItem,
  WorkSchedule,
  Reminder,
  InventoryItem,
  InventoryTransaction,
  DentistAvailability
};