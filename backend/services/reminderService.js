const { Op } = require('sequelize');
const { Reminder, Appointment, Patient, User } = require('../models');

const createReminderForAppointment = async (appointment) => {
  try {
    const appointmentDateTime = new Date(
      `${appointment.appointment_date}T${appointment.appointment_time}`
    );

    const sendAt = new Date(appointmentDateTime);
    sendAt.setHours(sendAt.getHours() - 24);

    const reminder = await Reminder.create({
      type: 'APPOINTMENT_REMINDER',
      send_at: sendAt,
      status: 'Pending',
      appointment_id: appointment.appointment_id,
      patient_id: appointment.patient_id
    });

    return reminder;
  } catch (error) {
    console.error('CREATE REMINDER ERROR:', error);
    throw new Error('Failed to create reminder');
  }
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
        model: Appointment
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
  createReminderForAppointment,
  getDueReminders,
  sendReminder,
  markAsSent,
  processDueReminders
};