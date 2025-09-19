// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch(err => console.error('Could not connect to MongoDB Atlas...', err));

// --- Mongoose Schemas (Blueprints for our data) ---
const MediaSchema = new mongoose.Schema({ path: String, originalName: String });
const StorySchema = new mongoose.Schema({ title: String, content: String, id: Number });
const SettingsSchema = new mongoose.Schema({
    username: { type: String, default: 'Your Name' },
    profilePicture: { type: String, default: 'placeholder-profile.jpg' },
    banner: { type: String, default: '' },
    youtubeUrl: { type: String, default: 'https://www.youtube.com' }
});

// --- Mongoose Models (Tools to work with our data) ---
const GalleryImage = mongoose.model('GalleryImage', MediaSchema);
const Gif = mongoose.model('Gif', MediaSchema);
const Homework = mongoose.model('Homework', MediaSchema);
const Story = mongoose.model('Story', StorySchema);
const Settings = mongoose.model('Settings', SettingsSchema);

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- File Upload Logic ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- API Endpoints ---

// Universal upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const filePath = `/uploads/${req.file.filename}`;
    const { type } = req.body;

    try {
        const fileData = { path: filePath, originalName: req.file.originalname };
        if (type === 'gallery') await GalleryImage.create(fileData);
        else if (type === 'gif') await Gif.create(fileData);
        else if (type === 'homework') await Homework.create(fileData);
        else if (type === 'profile') await Settings.updateOne({}, { profilePicture: filePath }, { upsert: true });
        else if (type === 'banner') await Settings.updateOne({}, { banner: filePath }, { upsert: true });

        res.json({ path: filePath, originalName: req.file.originalname });
    } catch (error) {
        res.status(500).json({ error: 'Error saving to database' });
    }
});

// Universal media deletion
app.delete('/api/media', async (req, res) => {
    const { filePath, type } = req.body;
    if (!filePath) return res.status(400).send('Invalid file path.');
    
    try {
        const physicalPath = path.join(__dirname, 'public', filePath);
        if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);

        const models = { galleryImages: GalleryImage, gifs: Gif, homework: Homework };
        if (models[type]) {
            await models[type].deleteOne({ path: filePath });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting from database' });
    }
});

// Single endpoint to get all data
app.get('/api/data', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({}); // Create default settings if they don't exist

        res.json({
            galleryImages: await GalleryImage.find(),
            gifs: await Gif.find(),
            stories: await Story.find().sort({id: -1}), // Sort by newest first
            homework: await Homework.find(),
            settings: settings
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});

// NEW: Endpoint to scan and return the music library
app.get('/api/music', (req, res) => {
    const musicPath = path.join(__dirname, 'public/assets/music');
    fs.readdir(musicPath, (err, files) => {
        if (err) {
            console.error("Could not list the music directory.", err);
            return res.status(500).json({ error: "Could not read music directory. Make sure /public/assets/music exists." });
        }
        
        const musicLibrary = files
            .filter(file => file.endsWith('.mp3'))
            .map(file => {
                const songName = path.parse(file).name;
                const coverFile = files.find(img => img.startsWith(songName) && (img.endsWith('.jpg') || img.endsWith('.png')));
                return {
                    title: songName.replace(/_/g, ' ').replace(/-/g, ' '),
                    src: `/assets/music/${file}`,
                    cover: coverFile ? `/assets/music/${coverFile}` : 'placeholder-album-art.jpg'
                };
            });
        res.json(musicLibrary);
    });
});


// Other endpoints
app.post('/api/stories', async (req, res) => {
    const newStory = await Story.create({ id: Date.now(), ...req.body });
    res.status(201).json(newStory);
});
app.delete('/api/stories/:id', async (req, res) => {
    await Story.deleteOne({ id: req.params.id });
    res.json({ success: true });
});
app.post('/api/settings', async (req, res) => {
    const { username, youtubeUrl } = req.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (youtubeUrl) updateData.youtubeUrl = youtubeUrl;
    const updatedSettings = await Settings.findOneAndUpdate({}, updateData, { new: true, upsert: true });
    res.json(updatedSettings);
});

// --- Socket.IO for Live Chat ---
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => io.emit('chat message', msg));
});

// --- Final Setup ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));