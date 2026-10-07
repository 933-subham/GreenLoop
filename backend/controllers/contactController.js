import { sendContactFormEmail } from '../utils/email.js';

// @desc    Handle contact form submission
// @route   POST /api/contact
const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message)
            return res.status(400).json({ message: 'All fields are required' });
        await sendContactFormEmail({ name, email, subject, message });
        res.json({ message: 'Your message has been sent to the municipality administration. We will respond within 24-48 hours.' });
    } catch (err) {
        console.error('Contact form error:', err.message);
        res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }
};

export { submitContact };
