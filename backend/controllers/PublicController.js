const { Dentist, Patient, User } = require('../models');

const publicController = {
  getClinicOverview: async (req, res) => {
    try {
      const [patientsCount, dentistsCount, dentists] = await Promise.all([
        Patient.count({ where: { is_deleted: false } }),
        Dentist.count({ where: { is_deleted: false } }),
        Dentist.findAll({
          where: { is_deleted: false },
          attributes: ['dentist_id', 'first_name', 'last_name', 'specialization'],
          include: [
            {
              model: User,
              attributes: ['email', 'phone_number', 'status'],
              required: false
            }
          ],
          order: [['last_name', 'ASC'], ['first_name', 'ASC']]
        })
      ]);

      return res.status(200).json({
        stats: {
          patients: patientsCount,
          dentists: dentistsCount,
          years: 12,
          services: 8
        },
        dentists: dentists.map((dentist) => ({
          dentist_id: dentist.dentist_id,
          first_name: dentist.first_name,
          last_name: dentist.last_name,
          specialization: dentist.specialization || 'General Dentistry',
          email: dentist.User?.email || null,
          phone_number: dentist.User?.phone_number || null
        }))
      });
    } catch (error) {
      console.error('GET PUBLIC CLINIC OVERVIEW ERROR:', error);
      return res.status(500).json({ message: 'Could not load clinic overview.' });
    }
  }
};

module.exports = publicController;
