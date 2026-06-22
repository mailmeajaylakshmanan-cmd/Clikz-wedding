const mongoose = require('mongoose');
require('dotenv').config();

const EventCategory = require('./models/EventCategory');
const Service = require('./models/Service');
const Customer = require('./models/Customer');
const Employee = require('./models/Employee');

const MONGODB_URI = process.env.MONGODB_URI;

const seedTamilNaduData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    const studioId = 'default_studio';

    // --- 1. Event Categories (Tamil Nadu Tradition) ---
    console.log('Seeding Event Categories...');
    const eventCategories = [
      { name: 'Nichayathartham (Engagement)', showTerms: true, termsAndConditions: '50% advance required for engagement events.', studioId },
      { name: 'Janavasam (Mapillai Azhaippu)', showTerms: true, termsAndConditions: 'Includes vehicle tracking and drone setup time.', studioId },
      { name: 'Vratham & Nalangu', showTerms: true, termsAndConditions: 'Early morning coverage starts at 6:00 AM.', studioId },
      { name: 'Muhurtham (Wedding)', showTerms: true, termsAndConditions: 'Full payment must be settled before album delivery. Overtime charges apply after 4 hours of continuous shooting.', studioId },
      { name: 'Reception (Varraverpu)', showTerms: true, termsAndConditions: 'LED screens and live streaming setup requires 2 hours prior access to the venue.', studioId },
      { name: 'Post-Wedding Shoot', showTerms: true, termsAndConditions: 'Travel and accommodation for outdoor shoots (e.g., Mahabalipuram/ECR) must be borne by the client.', studioId },
    ];

    const categoryMap = {};
    for (const cat of eventCategories) {
      const existing = await EventCategory.findOne({ name: cat.name, studioId });
      if (!existing) {
        const doc = await EventCategory.create(cat);
        categoryMap[cat.name] = doc._id;
      } else {
        categoryMap[cat.name] = existing._id;
      }
    }

    // --- 2. Services ---
    console.log('Seeding Services...');
    const services = [
      { 
        name: 'Traditional Photography', 
        descriptions: ['Full event coverage', 'Unlimited clicks', 'Color corrected soft copies'], 
        eventCategory: categoryMap['Muhurtham (Wedding)'],
        studioId 
      },
      { 
        name: 'Candid Photography', 
        descriptions: ['1 Senior Candid Photographer', 'Premium editing style', 'Focus on emotions and rituals'], 
        eventCategory: categoryMap['Muhurtham (Wedding)'],
        studioId 
      },
      { 
        name: 'Cinematic Wedding Film', 
        descriptions: ['3-5 Mins Highlight Teaser', '20-30 Mins Traditional Film', '4K Drone Coverage', 'Licensed Music'], 
        eventCategory: categoryMap['Reception (Varraverpu)'],
        studioId 
      },
      { 
        name: 'Traditional Videography', 
        descriptions: ['Full length HD Video', 'Basic Title Graphics', 'Pen Drive Delivery'], 
        eventCategory: categoryMap['Nichayathartham (Engagement)'],
        studioId 
      },
      { 
        name: 'Live Streaming & LED Wall', 
        descriptions: ['Youtube Private Link', 'Multiple camera switching', '8x12 LED Screen'], 
        eventCategory: categoryMap['Reception (Varraverpu)'],
        studioId 
      },
      { 
        name: 'Premium Canvera Album', 
        descriptions: ['12x18 size', '40 sheets (80 pages)', 'Matte / Glossy Finish', 'Custom Leather Bag'], 
        eventCategory: categoryMap['Muhurtham (Wedding)'],
        studioId 
      },
      { 
        name: 'Outdoor Couple Shoot', 
        descriptions: ['4 hours shoot', '2 dress changes', '15 Retouched Portraits'], 
        eventCategory: categoryMap['Post-Wedding Shoot'],
        studioId 
      }
    ];

    for (const srv of services) {
      const existing = await Service.findOne({ name: srv.name, studioId });
      if (!existing) {
        await Service.create(srv);
      }
    }

    // --- 3. Customers ---
    console.log('Seeding Customers...');
    const customers = [
      { name: 'Karthik & Priya', phone: '9876543210', email: 'karthik.priya@gmail.com', address: 'Anna Nagar, Chennai', studioId },
      { name: 'Arun & Divya', phone: '9988776655', email: 'arundivya2026@gmail.com', address: 'R.S. Puram, Coimbatore', studioId },
      { name: 'Vignesh & Swathi', phone: '9123456789', email: 'vignesh.wed.swathi@yahoo.com', address: 'KK Nagar, Madurai', studioId },
      { name: 'Ashwin & Nithya', phone: '8877665544', email: 'ashwin.nithya@outlook.com', address: 'Thillai Nagar, Trichy', studioId },
    ];

    for (const cust of customers) {
      const existing = await Customer.findOne({ phone: cust.phone, studioId });
      if (!existing) {
        await Customer.create(cust);
      }
    }

    // --- 4. Crew (Employees) ---
    console.log('Seeding Crew (Employees)...');
    const employees = [
      { name: 'Muthu', role: 'Lead Photographer', phone: '9840112233', contact: '9840112233', status: 'Active', studioId },
      { name: 'Ramesh', role: 'Cinematographer', phone: '9840223344', contact: '9840223344', status: 'Active', studioId },
      { name: 'Senthil', role: 'Drone Operator', phone: '9840334455', contact: '9840334455', status: 'Active', studioId },
      { name: 'Karthikeyan', role: 'Traditional Videographer', phone: '9840445566', contact: '9840445566', status: 'Active', studioId },
      { name: 'Velu', role: 'Lighting & Assistant', phone: '9840556677', contact: '9840556677', status: 'Active', studioId },
      { name: 'Kumar', role: 'Senior Video Editor', phone: '9840667788', contact: '9840667788', status: 'Active', studioId },
    ];

    for (const emp of employees) {
      const existing = await Employee.findOne({ phone: emp.phone, studioId });
      if (!existing) {
        await Employee.create(emp);
      }
    }

    console.log('✅ Tamil Nadu Tradition Seed Data injected successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

seedTamilNaduData();
