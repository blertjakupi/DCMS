const { Op } = require('sequelize');
const { Appointment } = require('../models');
const { WorkSchedule } = require('../models');
const { DentistAvailability } = require('../models');
const { Treatment } = require('../models');
const { createReminderForAppointment } = require('./reminderService');

const addMinutesToTime = (time, minutesToAdd) => {

   const [hours, minutes, seconds] = time.split(':').map(Number);

   const date = new Date();

   date.setHours(hours);
   date.setMinutes(minutes + minutesToAdd);
   date.setSeconds(seconds || 0);

   return date.toTimeString().slice(0, 8);
};

const validateOverlappingAppointment = async (
   dentist_id,
   appointment_date,
   appointment_time,
   duration
) => {

   const newEndTime = addMinutesToTime(
      appointment_time,
      duration
   );

   const existingAppointments = await Appointment.findAll({
      where: {
         dentist_id,
         appointment_date,
         status: {
            [Op.notIn]: ['Cancelled', 'Completed']
         }
      }
   });

   for (const appointment of existingAppointments) {

      const existingStart = appointment.appointment_time;

      const existingEnd = addMinutesToTime(
         appointment.appointment_time,
         appointment.duration
      );

      const hasOverlap =
         existingStart < newEndTime &&
         existingEnd > appointment_time;

      if (hasOverlap) {
         throw new Error(
            'Dentisti ka një termin tjetër në këtë orar.'
         );
      }
   }
};

const validateWorkingHours = async (
   dentist_id,
   appointment_date,
   appointment_time,
   duration
) => {

   const appointmentDay =
      new Date(appointment_date)
         .toLocaleDateString('en-US', {
            weekday: 'long'
         });

   const schedule = await WorkSchedule.findOne({
      where: {
         dentist_id,
         day: appointmentDay
      }
   });

   if (!schedule) {
      throw new Error(
         `Dentisti nuk punon ditën ${appointmentDay}.`
      );
   }

   const appointmentEndTime =
      addMinutesToTime(
         appointment_time,
         duration
      );

   const startsBeforeWork =
      appointment_time < schedule.start_time;

   const endsAfterWork =
      appointmentEndTime > schedule.end_time;

   if (startsBeforeWork || endsAfterWork) {
      throw new Error(
         `Termini është jashtë orarit të punës (${schedule.start_time} - ${schedule.end_time}).`
      );
   }
};

const validateDentistAvailability = async (
   dentist_id,
   appointment_date,
   appointment_time,
   duration
) => {

   const appointmentEndTime =
      addMinutesToTime(
         appointment_time,
         duration
      );

   const unavailableRecords =
      await DentistAvailability.findAll({
         where: {
            dentist_id,
            unavailable_date: appointment_date
         }
      });

   for (const record of unavailableRecords) {

      if (record.is_full_day) {

         throw new Error(
            'Dentisti nuk është i disponueshëm në këtë datë.'
         );
      }

      const overlap =
         record.start_time < appointmentEndTime &&
         record.end_time > appointment_time;

      if (overlap) {

         throw new Error(
            `Dentisti nuk është i disponueshëm nga ${record.start_time} deri ${record.end_time}.`
         );
      }
   }
};

const getTreatmentDuration = async (
   treatment_id
) => {
   const treatment = await Treatment.findOne({
      where: {
         treatment_id,
         is_deleted: false,
         status: 'Active'
      }
   });

   if (!treatment) {
      throw new Error(
         'Trajtimi nuk u gjet ose nuk është aktiv.'
      );
   }

   if (!treatment.average_duration) {
      throw new Error(
         'Trajtimi nuk ka average_duration.'
      );
   }
   return treatment.average_duration;
};

const validateAppointment = async (
   dentist_id,
   appointment_date,
   appointment_time,
   duration
) => {

   await validateDentistAvailability(
      dentist_id,
      appointment_date,
      appointment_time,
      duration
   );

   await validateWorkingHours(
      dentist_id,
      appointment_date,
      appointment_time,
      duration
   );

   await validateOverlappingAppointment(
      dentist_id,
      appointment_date,
      appointment_time,
      duration
   );
   return true;

};

const createAppointment = async (data) => {
   const t = await sequelize.transaction();

   try {
      const {
         patient_id,
         dentist_id,
         appointment_date,
         appointment_time,
         treatment_id,
         notes,
         status
      } = data;

      const duration = await getTreatmentDuration(treatment_id);

      await validateAppointment(
         dentist_id,
         appointment_date,
         appointment_time,
         duration
      );

      const newAppointment = await Appointment.create({
         patient_id,
         dentist_id,
         appointment_date,
         appointment_time,
         treatment_id,
         duration,
         notes: notes || null,
         status: status || 'Scheduled'
      }, { transaction: t });

      await createReminderForAppointment(newAppointment);

      await t.commit();
      return newAppointment;

   } catch (err) {
      await t.rollback();
      throw err;
   }
};

module.exports = {
   validateOverlappingAppointment,
   validateWorkingHours,
   validateDentistAvailability,
   getTreatmentDuration,
   addMinutesToTime,
   validateAppointment,
   createAppointment
};