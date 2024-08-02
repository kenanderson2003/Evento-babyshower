const axios = require('axios');
const nodemailer = require('nodemailer');

const SHOPIFY_API_URL = 'https://nua-baby.myshopify.com/admin/api/2024-07';
const SHOPIFY_ACCESS_TOKEN = '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'; 
const EMAIL_USER = 'kencansaya1332@gmail.com'; 
const EMAIL_PASS = 'KEN200308'; 

const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});


//respuesta de la api

const getCustomersByPage = async (page_info = "") => {
    try {
        const response = await axios.get(
            `${SHOPIFY_API_URL}/customers.json?fields=id,email`,
            {
                headers: {
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                params: {
                    limit: 250,
                    page_info,
                },
            }
        );
        return response;
    } catch (error) {
        console.error('Error fetching customers by page:', error);
        return null;
    }
};


//paginado
const getAllCustomers = async (page_info = "") => {
    let customers = [];
    let cache = page_info;
    let chunk = 1;

    while (true) {
        const response = await getCustomersByPage(page_info);
        if (!response) break;

        customers = customers.concat(response.data.customers);

        if (!response.headers.link) break;

        const cursor = response.headers.link.split(",");
        let nextPageInfo = null;
        cursor.forEach((e) => {
            if (e.includes("next")) {
                nextPageInfo = e
                    .split(";")[0]
                    .trim()
                    .substring(1)
                    .split("page_info=")[1]
                    .split(">")[0]; // Extrae solo el valor del cursor
            }
        });

        if (cache === nextPageInfo) break;
        page_info = nextPageInfo;
        cache = nextPageInfo;

        console.log(`Customers chunk : ${chunk}`);
        chunk++;
    }

    return customers;
};

//Devuelve los metafields de un cliente en especifico

async function getCustomerMetafields(customerId) {
    try {
      const response = await axios.get(`${SHOPIFY_API_URL}/customers/${customerId}/metafields.json`, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
        },
        params: {
          metafields_namespace: 'all' 
        }
      });
      return response.data.metafields;
    } catch (error) {
      console.error(`Error fetching metafields for customer ${customerId}:`, error);
      return [];
    }
  }


//Verificamos si la fecha es la actual

function isEventToday(eventDate) {
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
}

//se manda un mail

async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: EMAIL_USER,
            to,
            subject,
            text
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
}


//verifica si hay un metafield donde diga el dia del evento y si es asi envia un correo electronico

async function processCustomers() {
    const customers = await getAllCustomers();
    const metafieldsPromises = customers.map(customer => getCustomerMetafields(customer.id));
    const metafieldsResults = await Promise.all(metafieldsPromises);
  
    for (const [index, metafields] of metafieldsResults.entries()) {
      const customer = customers[index];
      const eventMetafield = metafields.find(metafield => metafield.key === 'fecha_del_evento');
  
      if (eventMetafield && isEventToday(eventMetafield.value)) {
        await sendEmail(customer.email, 'Recordatorio de Evento', 'Hoy es el día de tu evento.');
      }
    }
  }

const schedule = require('node-schedule');
const job = schedule.scheduleJob('0 0 * * *', function() {
    processCustomers();
});