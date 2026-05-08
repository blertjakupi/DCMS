const {
  Dentist,
  WorkSchedule
} = require('../models');

const workScheduleController = {
  getAll: async (req, res) => {
    try {
      const schedules = await WorkSchedule.findAll({
        include: [
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name', 'specialization']
          }
        ],
        order: [['schedule_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Oraret u morën me sukses.',
        data: schedules
      });
    } catch (error) {
      console.error('GET ALL WORK SCHEDULES ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së orareve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const schedule = await WorkSchedule.findOne({
        where: { schedule_id: id },
        include: [
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name', 'specialization']
          }
        ]
      });

      if (!schedule) {
        return res.status(404).json({
          message: 'Orari nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Orari u mor me sukses.',
        data: schedule
      });
    } catch (error) {
      console.error('GET WORK SCHEDULE BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së orarit.'
      });
    }
  },

  getScheduleByDentist: async (req, res) => {
    try {
      const { dentistId } = req.params;

      const dentist = await Dentist.findOne({
        where: {
          dentist_id: dentistId,
          is_deleted: false
        }
      });

      if (!dentist) {
        return res.status(404).json({
          message: 'Dentisti nuk u gjet.'
        });
      }

      const schedules = await WorkSchedule.findAll({
        where: { dentist_id: dentistId },
        include: [
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name', 'specialization']
          }
        ],
        order: [['schedule_id', 'ASC']]
      });

      return res.status(200).json({
        message: 'Oraret e dentistit u morën me sukses.',
        data: schedules
      });
    } catch (error) {
      console.error('GET SCHEDULE BY DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së orareve të dentistit.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const { dentist_id, day, start_time, end_time } = req.body;

      if (!dentist_id || !day || !start_time || !end_time) {
        return res.status(400).json({
          message: 'dentist_id, day, start_time dhe end_time janë të detyrueshme.'
        });
      }

      if (end_time <= start_time) {
        return res.status(400).json({
          message: 'end_time duhet të jetë pas start_time.'
        });
      }

      const dentist = await Dentist.findOne({
        where: {
          dentist_id,
          is_deleted: false,
          status: 'Active'
        }
      });

      if (!dentist) {
        return res.status(404).json({
          message: 'Dentisti nuk u gjet ose nuk është aktiv.'
        });
      }

      const newSchedule = await WorkSchedule.create({
        dentist_id,
        day,
        start_time,
        end_time
      });

      const createdSchedule = await WorkSchedule.findOne({
        where: { schedule_id: newSchedule.schedule_id },
        include: [
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name', 'specialization']
          }
        ]
      });

      return res.status(201).json({
        message: 'Orari u krijua me sukses.',
        data: createdSchedule
      });
    } catch (error) {
      console.error('CREATE WORK SCHEDULE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të orarit.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { dentist_id, day, start_time, end_time } = req.body;

      const schedule = await WorkSchedule.findOne({
        where: { schedule_id: id }
      });

      if (!schedule) {
        return res.status(404).json({
          message: 'Orari nuk u gjet.'
        });
      }

      const effectiveStartTime = start_time || schedule.start_time;
      const effectiveEndTime = end_time || schedule.end_time;

      if (effectiveEndTime <= effectiveStartTime) {
        return res.status(400).json({
          message: 'end_time duhet të jetë pas start_time.'
        });
      }

      if (dentist_id) {
        const dentist = await Dentist.findOne({
          where: {
            dentist_id,
            is_deleted: false,
            status: 'Active'
          }
        });

        if (!dentist) {
          return res.status(404).json({
            message: 'Dentisti nuk u gjet ose nuk është aktiv.'
          });
        }
      }

      const updateData = {};
      if (dentist_id) updateData.dentist_id = dentist_id;
      if (day) updateData.day = day;
      if (start_time) updateData.start_time = start_time;
      if (end_time) updateData.end_time = end_time;

      await schedule.update(updateData);

      const updatedSchedule = await WorkSchedule.findOne({
        where: { schedule_id: id },
        include: [
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name', 'specialization']
          }
        ]
      });

      return res.status(200).json({
        message: 'Orari u përditësua me sukses.',
        data: updatedSchedule
      });
    } catch (error) {
      console.error('UPDATE WORK SCHEDULE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të orarit.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const schedule = await WorkSchedule.findOne({
        where: { schedule_id: id }
      });

      if (!schedule) {
        return res.status(404).json({
          message: 'Orari nuk u gjet.'
        });
      }

      await schedule.destroy();

      return res.status(200).json({
        message: 'Orari u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE WORK SCHEDULE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë fshirjes së orarit.'
      });
    }
  }
};

module.exports = workScheduleController;
