const { Setting } = require('../models');

const stringifySettingValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
};

const settingsController = {
  getAll: async (req, res) => {
    try {
      const settings = await Setting.findAll({
        order: [['setting_key', 'ASC']]
      });

      const data = settings.reduce((result, setting) => {
        result[setting.setting_key] = setting.setting_value;
        return result;
      }, {});

      return res.status(200).json(data);
    } catch (error) {
      console.error('GET SETTINGS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së konfigurimeve.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const settings = req.body;

      if (!settings || Array.isArray(settings) || typeof settings !== 'object') {
        return res.status(400).json({
          message: 'Trupi i kërkesës duhet të jetë objekt me çelësa dhe vlera.'
        });
      }

      const entries = Object.entries(settings);

      if (entries.length === 0) {
        return res.status(400).json({
          message: 'Së paku një konfigurim duhet të dërgohet.'
        });
      }

      await Promise.all(
        entries.map(([setting_key, value]) =>
          Setting.upsert({
            setting_key,
            setting_value: stringifySettingValue(value)
          })
        )
      );

      const updatedSettings = await Setting.findAll({
        where: {
          setting_key: entries.map(([setting_key]) => setting_key)
        },
        order: [['setting_key', 'ASC']]
      });

      const data = updatedSettings.reduce((result, setting) => {
        result[setting.setting_key] = setting.setting_value;
        return result;
      }, {});

      return res.status(200).json({
        message: 'Konfigurimet u përditësuan me sukses.',
        data
      });
    } catch (error) {
      console.error('UPDATE SETTINGS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të konfigurimeve.'
      });
    }
  }
};

module.exports = settingsController;
