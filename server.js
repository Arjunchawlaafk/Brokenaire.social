const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Your API key for NewsData.io
const API_KEY = 'pub_609739ae556aa822b09d4537f6eb657ac633a';
const BASE_URL = 'https://newsdata.io/api/1/news';

// The query parameters for fetching negative business or finance news
const query = 'scam OR scandal OR fraud OR "stock all time low" OR "market crash" OR "business loss" OR "financial crisis"';

// Initialize Express app
const app = express();
const port = 10000;

// Serve static files (like CSS, JS, and images) from the root directory
app.use(express.static(path.join(__dirname)));

// Function to fetch news articles with pagination support
const fetchNews = async (page = null) => {
    try {
        const params = {
            q: query,
            apiKey: API_KEY,
            language: 'en',
            category: 'business',
        };

        // Add page parameter if available
        if (page) {
            params.page = page;
        }

        const response = await axios.get(BASE_URL, { params });
        return response.data || {};
    } catch (error) {
        console.error('Error fetching news:', error.response?.data || error.message);
        return {};
    }
};

// Function to add a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch multiple batches of news articles
const fetchMultipleNewsBatches = async (totalArticles = 100) => {
    const allArticles = [];
    let currentPage = null;

    while (allArticles.length < totalArticles) {
        const newsData = await fetchNews(currentPage);

        // Check if the results are valid
        if (!newsData.results || newsData.results.length === 0) {
            console.log('No more articles available.');
            break;
        }

        console.log(`Fetched ${newsData.results.length} articles in this batch.`);

        // Append new articles to the list
        allArticles.push(...newsData.results);

        // Limit to the required number of articles
        if (allArticles.length >= totalArticles) {
            allArticles.length = totalArticles;
        }

        // Update the current page
        currentPage = newsData.nextPage || null;

        // If no next page is available, stop fetching
        if (!currentPage) {
            console.log('No more pages available.');
            break;
        }

        console.log(`Fetched ${allArticles.length} articles so far...`);

        // Delay before the next API call to avoid rate limits
        await delay(2000);
    }

    console.log(`Total articles fetched: ${allArticles.length}`);

    // Process and filter unique articles
    const uniqueTitles = new Set();
    const processedArticles = allArticles.map((item, index) => ({
        title: item.title,
        url: item.link,
        date: item.pubDate,
        sentiment: item.sentiment || 'N/A',
        source: item.source_id,
        duplicate: item.duplicate || false,
        Serial: index + 1,
    })).filter(article => {
        if (uniqueTitles.has(article.title)) return false;
        uniqueTitles.add(article.title);
        return true;
    });

    console.log(`Total unique articles: ${processedArticles.length}`);

    // Split articles into pages of 20
    const pageSize = 20;
    const pagesData = {};
    const totalPages = Math.ceil(processedArticles.length / pageSize);

    for (let i = 0; i < totalPages; i++) {
        pagesData[`page${i + 1}`] = processedArticles.slice(i * pageSize, (i + 1) * pageSize);
    }

    console.log(`Pages created: ${Object.keys(pagesData).length}`);

    // Save to JSON file
    fs.writeFileSync('newsdata.json', JSON.stringify(pagesData, null, 2), 'utf-8');
    console.log('Data saved to newsdata.json');
};

// Immediately fetch news when the server starts
fetchMultipleNewsBatches(100);

// Fetch articles every 3 hours (10800000 ms)
setInterval(() => {
    fetchMultipleNewsBatches(100);
}, 10800000); // 3 hours in milliseconds

// Serve other static HTML pages
app.get('/Home', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/Contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/About-us', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/Privacy-Policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacypolicy.html'));
});

app.get('/Terms-and-Conditions', (req, res) => {
    res.sendFile(path.join(__dirname, 'termsandconditions.html'));
});

app.get('/page-2', (req, res) => {
    res.sendFile(path.join(__dirname, 'page2.html'));
});

app.get('/page-3', (req, res) => {
    res.sendFile(path.join(__dirname, 'page3.html'));
});

app.get('/page-4', (req, res) => {
    res.sendFile(path.join(__dirname, 'page4.html'));
});

app.get('/page-5', (req, res) => {
    res.sendFile(path.join(__dirname, 'page5.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
