const { ContactMessage } = require('../models');

const normalizeText = (value) => String(value || '').trim();

const contactMessageController = {
  getAll: async (req, res) => {
    try {
      const messages = await ContactMessage.findAll({
        order: [['created_at', 'DESC'], ['contact_message_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Contact messages loaded successfully.',
        data: messages
      });
    } catch (error) {
      console.error('GET CONTACT MESSAGES ERROR:', error);
      return res.status(500).json({ message: 'Could not load contact messages.' });
    }
  },

  markRead: async (req, res) => {
    try {
      const message = await ContactMessage.findByPk(req.params.id);
      if (!message) return res.status(404).json({ message: 'Contact message not found.' });

      await message.update({ status: 'Read' });

      return res.status(200).json({
        message: 'Contact message marked as read.',
        data: message
      });
    } catch (error) {
      console.error('MARK CONTACT MESSAGE READ ERROR:', error);
      return res.status(500).json({ message: 'Could not update contact message.' });
    }
  },

  createPublic: async (req, res) => {
    try {
      const firstName = normalizeText(req.body.first_name);
      const lastName = normalizeText(req.body.last_name);
      const phoneNumber = normalizeText(req.body.phone_number);
      const message = normalizeText(req.body.message);

      if (!firstName || !lastName || !phoneNumber || !message) {
        return res.status(400).json({
          message: 'First name, last name, phone number and message are required.'
        });
      }

      if (message.length < 5) {
        return res.status(400).json({ message: 'Message is too short.' });
      }

      const contactMessage = await ContactMessage.create({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        message,
        status: 'Unread'
      });

      return res.status(201).json({
        message: 'Mesazhi u dergua me sukses.',
        data: {
          contact_message_id: contactMessage.contact_message_id
        }
      });
    } catch (error) {
      console.error('CREATE PUBLIC CONTACT MESSAGE ERROR:', error);
      return res.status(500).json({ message: 'Mesazhi nuk mund te dergohej.' });
    }
  }
};

module.exports = contactMessageController;
