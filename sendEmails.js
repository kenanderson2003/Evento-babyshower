const axios = require('axios');
const nodemailer = require('nodemailer');

// Configuración de la API de Shopify
const SHOPIFY_API_URL = 'https://nua-baby.myshopify.com/admin/api/2024-07/customers.json';
const SHOPIFY_ACCESS_TOKEN = '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'; // Reemplaza con tu token real

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // O el servicio que uses (e.g., SMTP)
    auth: {
        user: 'kencansaya1332@gmail.com',
        pass: 'qkhz ryna bobr zxgs' // Reemplaza con tu contraseña de aplicación
    }
});

const getCustomerById = async (customerId) => {
    try {
        const response = await axios.get(`https://nua-baby.myshopify.com/admin/api/2024-07/customers/${customerId}.json`, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return response.data.customer;
    } catch (error) {
        console.error(`Error fetching customer ${customerId}:`, error);
        return null;
    }
};

const getCustomerMetafields = async (customerId) => {
    try {
        const response = await axios.get(`https://nua-baby.myshopify.com/admin/api/2024-07/customers/${customerId}/metafields.json`, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
            }
        });
        return response.data.metafields;
    } catch (error) {
        console.error(`Error fetching metafields for customer ${customerId}:`, error);
        return [];
    }
};

const sendEmail = async (email, eventDate) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Recordatorio de Evento',
        text: `Este es un recordatorio de que su evento está programado para el ${eventDate}.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado a ${email}`);
    } catch (error) {
        console.error(`Error enviando correo a ${email}:`, error);
    }
};

const run = async () => {
    const customerId = '6026098245805'; // ID del cliente específico
    const customer = await getCustomerById(customerId);

    if (customer) {
        const metafields = await getCustomerMetafields(customerId);
        const eventMetafield = metafields.find(mf => mf.key === 'fecha_del_evento');

        if (eventMetafield) {
            const today = new Date();
            const reminderDate = new Date(today);
            reminderDate.setDate(today.getDate() + 2);
            const eventDate = new Date(eventMetafield.value);

            if (eventDate.toDateString() === reminderDate.toDateString()) {
                await sendEmail(customer.email, eventMetafield.value);
            } else {
                console.log(`El evento no es en 2 días, es en: ${eventMetafield.value}`);
            }
        } else {
            console.log('El cliente no tiene el metafield fecha_del_evento');
        }
    } else {
        console.log('Cliente no encontrado');
    }
};

run();
