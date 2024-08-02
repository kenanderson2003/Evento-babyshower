const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const SHOPIFY_API_URL = 'https://nua-baby.myshopify.com/admin/api/2024-07/customers.json';
const SHOPIFY_ACCESS_TOKEN = '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'; // Reemplaza con tu token real

// Función para obtener clientes desde Shopify con paginado
const getAllCustomers = async () => {
    let customers = [];
    let pageInfo = '';
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await axios.get(SHOPIFY_API_URL, {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
                },
                params: {
                    limit: 250,
                    page_info: pageInfo
                }
            });

            customers = customers.concat(response.data.customers);

            const linkHeader = response.headers.link;
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const nextPageUrl = linkHeader.split(',').find(part => part.includes('rel="next"')).split(';')[0].trim();
                pageInfo = new URL(nextPageUrl).searchParams.get('page_info');
            } else {
                hasMore = false;
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            hasMore = false;
        }
    }

    return customers;
};

// Endpoint para obtener todos los clientes
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching customers' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
