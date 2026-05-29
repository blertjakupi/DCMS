const { Op } = require('sequelize');
const { Reminder, Appointment, Patient, Dentist, Treatment } = require('../models');

const APPOINTMENT_REMINDER_TYPE = 'APPOINTMENT_24H';

const combineAppointmentDateTime = (appointment) => {
  return new Date(`${appointment.appointment_date}T${String(appointment.appointment_time).slice(0, 8)}`);
};

const getAppointmentReminderTime = (appointment) => {
  const appointmentDateTime = combineAppointmentDateTime(appointment);
  const sendAt = new Date(appointmentDateTime);
  sendAt.setHours(sendAt.getHours() - 24);
  return sendAt;
};

const createReminderForAppointment = async (appointment) => {
  try {
    const sendAt = getAppointmentReminderTime(appointment);

    const [reminder] = await Reminder.findOrCreate({
      where: {
        appointment_id: appointment.appointment_id,
        type: APPOINTMENT_REMINDER_TYPE
      },
      defaults: {
        type: APPOINTMENT_REMINDER_TYPE,
        send_at: sendAt,
        status: 'Pending',
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id
      }
    });

    await reminder.update({
      send_at: sendAt,
      sent_date: null,
      status: 'Pending',
      patient_id: appointment.patient_id
    });

    return reminder;
  } catch (error) {
    console.error('CREATE REMINDER ERROR:', error);
    throw new Error('Failed to create reminder');
  }
};

const syncReminderForAppointment = async (appointment) => {
  if (!appointment || appointment.status !== 'Scheduled') {
    return null;
  }

  return createReminderForAppointment(appointment);
};

const syncRemindersForAppointments = async (where = {}) => {
  const appointments = await Appointment.findAll({
    where: {
      status: 'Scheduled',
      ...where
    }
  });

  for (const appointment of appointments) {
    await syncReminderForAppointment(appointment);
  }

  return appointments.length;
};

const getDueReminders = async () => {
  const now = new Date();

  return await Reminder.findAll({
    where: {
      status: 'Pending',
      send_at: {
        [Op.lte]: now
      }
    },
    include: [
      {
        model: Appointment,
        include: [
          { model: Patient, attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Dentist, attributes: ['dentist_id', 'first_name', 'last_name'] },
          { model: Treatment, attributes: ['treatment_id', 'treatment_name'] }
        ]
      }
    ]
  });
};

const sendReminder = async (reminder) => {
  try {
    const appointment = reminder.Appointment;

    if (!appointment) {
      throw new Error('Appointment not found for reminder');
    }

    console.log(`📩 Sending reminder:
      Appointment ID: ${appointment.appointment_id}
      Date: ${appointment.appointment_date}
      Time: ${appointment.appointment_time}
      Patient ID: ${reminder.patient_id}
    `);

    return true;
  } catch (error) {
    console.error('SEND REMINDER ERROR:', error);
    return false;
  }
};

const markAsSent = async (reminderId) => {
  await Reminder.update(
    {
      status: 'Sent',
      sent_date: new Date()
    },
    {
      where: { reminder_id: reminderId }
    }
  );
};

const processDueReminders = async () => {
  try {
    const reminders = await getDueReminders();

    for (const reminder of reminders) {
      const sent = await sendReminder(reminder);

      if (sent) {
        await markAsSent(reminder.reminder_id);
      }
    }

    return {
      processed: reminders.length
    };
  } catch (error) {
    console.error('PROCESS REMINDERS ERROR:', error);
    throw new Error('Failed to process reminders');
  }
};

module.exports = {
  APPOINTMENT_REMINDER_TYPE,
  getAppointmentReminderTime,
  createReminderForAppointment,
  syncReminderForAppointment,
  syncRemindersForAppointments,
  getDueReminders,
  sendReminder,
  markAsSent,
  processDueReminders
};
