const { Op } = require('sequelize');
const { Treatment } = require('../models');

const treatmentController = {
  getAll: async (req, res) => {
    try {
      const treatments = await Treatment.findAll({
        where: { is_active: true },
        order: [['treatment_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Trajtimet u morën me sukses.',
        data: treatments
      });
    } catch (error) {
      console.error('GET ALL TREATMENTS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së trajtimeve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const treatment = await Treatment.findOne({
        where: {
          treatment_id: id,
          is_active: true
        }
      });

      if (!treatment) {
        return res.status(404).json({
          message: 'Trajtimi nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Trajtimi u mor me sukses.',
        data: treatment
      });
    } catch (error) {
      console.error('GET TREATMENT BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së trajtimit.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const { treatment_name, description, cost, average_duration } = req.body;

      if (!treatment_name || cost === undefined || cost === null) {
        return res.status(400).json({
          message: 'treatment_name dhe cost janë të detyrueshme.'
        });
      }

      if (parseFloat(cost) < 0) {
        return res.status(400).json({
          message: 'cost nuk mund të jetë numër negativ.'
        });
      }

      if (average_duration !== undefined && average_duration !== null && average_duration <= 0) {
        return res.status(400).json({
          message: 'average_duration duhet të jetë më e madhe se 0.'
        });
      }

      const existingTreatment = await Treatment.findOne({
        where: {
          treatment_name,
          is_active: true
        }
      });

      if (existingTreatment) {
        return res.status(400).json({
          message: 'Trajtimi me këtë emër ekziston tashmë.'
        });
      }

      const newTreatment = await Treatment.create({
        treatment_name,
        description: description || null,
        cost,
        average_duration: average_duration || null,
        is_active: true
      });

      return res.status(201).json({
        message: 'Trajtimi u krijua me sukses.',
        data: newTreatment
      });
    } catch (error) {
      console.error('CREATE TREATMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të trajtimit.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { treatment_name, description, cost, average_duration } = req.body;

      const treatment = await Treatment.findOne({
        where: {
          treatment_id: id,
          is_active: true
        }
      });

      if (!treatment) {
        return res.status(404).json({
          message: 'Trajtimi nuk u gjet.'
        });
      }

      if (cost !== undefined && cost !== null && parseFloat(cost) < 0) {
        return res.status(400).json({
          message: 'cost nuk mund të jetë numër negativ.'
        });
      }

      if (average_duration !== undefined && average_duration !== null && average_duration <= 0) {
        return res.status(400).json({
          message: 'average_duration duhet të jetë më e madhe se 0.'
        });
      }

      if (treatment_name && treatment_name !== treatment.treatment_name) {
        const existingTreatment = await Treatment.findOne({
          where: {
            treatment_name,
            treatment_id: { [Op.ne]: id },
            is_active: true
          }
        });

        if (existingTreatment) {
          return res.status(400).json({
            message: 'Trajtimi me këtë emër ekziston tashmë.'
          });
        }
      }

      const updateData = {};
      if (treatment_name) updateData.treatment_name = treatment_name;
      if (description !== undefined) updateData.description = description;
      if (cost !== undefined && cost !== null) updateData.cost = cost;
      if (average_duration !== undefined) updateData.average_duration = average_duration;

      await treatment.update(updateData);

      return res.status(200).json({
        message: 'Trajtimi u përditësua me sukses.',
        data: treatment
      });
    } catch (error) {
      console.error('UPDATE TREATMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të trajtimit.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const treatment = await Treatment.findOne({
        where: {
          treatment_id: id,
          is_active: true
        }
      });

      if (!treatment) {
        return res.status(404).json({
          message: 'Trajtimi nuk u gjet.'
        });
      }

      await treatment.update({
        is_active: false
      });

      return res.status(200).json({
        message: 'Trajtimi u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE TREATMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë fshirjes së trajtimit.'
      });
    }
  }
};

module.exports = treatmentController;
