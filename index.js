const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Patient Schema
const patientSchema = new mongoose.Schema({
  name: String,
  insurance: String,
  message: String,
  paid: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const Patient = mongoose.model('Patient', patientSchema);

// Registration route
app.post('/api/register', async (req, res) => {
  try {
    const { token, name, insurance, message } = req.body;

    // Charge $18 using Stripe
    const charge = await stripe.charges.create({
      amount: 1800,
      currency: 'usd',
      source: token,
      description: `Telemedicine registration fee for ${name}`,
    });

    if (!charge) return res.status(400).json({ success: false, error: 'Charge failed' });

    // Save patient info
    const patient = new Patient({ name, insurance, message, paid: true });
    await patient.save();

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
