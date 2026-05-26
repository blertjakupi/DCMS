const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const defaultSettings = {
  clinic_name: 'DentaCare Pro',
  clinic_address: '',
  clinic_phone: '',
  clinic_email: '',
  email_reminders_enabled: 'true',
  sms_reminders_enabled: 'false',
  reminder_lead_time_hours: '24',
  default_appointment_duration: '30',
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  working_days: 'Mon,Tue,Wed,Thu,Fri'
};

const Setting = sequelize.define('Setting', {
  setting_key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'settings',
  timestamps: false
});

Setting.defaultSettings = defaultSettings;

Setting.seedDefaults = async () => {
  await Promise.all(
    Object.entries(defaultSettings).map(([setting_key, setting_value]) =>
      Setting.findOrCreate({
        where: { setting_key },
        defaults: { setting_key, setting_value }
      })
    )
  );
};

module.exports = Setting;
