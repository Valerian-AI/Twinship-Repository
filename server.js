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
const MediaSchema = new mongoose.Schema({ 
    path: String, 
    originalName: String,
    category: { type: String, enum: ['sfw', 'nsfw'], default: 'sfw' } // Added category for galleries
});
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

// Universal upload endpoint (updated to handle categories)
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const filePath = `/uploads/${req.file.filename}`;
    const { type, category } = req.body;
    
    try {
        const fileData = { 
            path: filePath, 
            originalName: req.file.originalname,
            ...(category && { category }) // Add category if provided
        };
        
        if (type === 'gallery') {
            await GalleryImage.create(fileData);
        } else if (type === 'gif') {
            await Gif.create(fileData);
        } else if (type === 'homework') {
            await Homework.create(fileData);
        } else if (type === 'profile') {
            await Settings.updateOne({}, { profilePicture: filePath }, { upsert: true });
        } else if (type === 'banner') {
            await Settings.updateOne({}, { banner: filePath }, { upsert: true });
        }
        
        res.json({ 
            path: filePath, 
            originalName: req.file.originalname,
            ...(category && { category })
        });
    } catch (error) {
        console.error('Database save error:', error);
        res.status(500).json({ error: 'Error saving to database' });
    }
});

// Universal media deletion (updated to handle categories)
app.delete('/api/media', async (req, res) => {
    const { filePath, type, category } = req.body;
    if (!filePath || typeof filePath !== 'string') return res.status(400).send('Invalid file path provided.');
    
    // Delete physical file
    const physicalPath = path.join(__dirname, 'public', filePath);
    if (fs.existsSync(physicalPath)) {
        try {
            fs.unlinkSync(physicalPath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }
    
    // Delete from database
    try {
        const models = { galleryImages: GalleryImage, gifs: Gif, homework: Homework };
        if (models[type]) {
            const query = { path: filePath };
            if (category && type === 'galleryImages') {
                query.category = category;
            }
            await models[type].deleteOne(query);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Database deletion error:', error);
        res.status(500).json({ error: 'Error deleting from database' });
    }
});

// Single endpoint to get all data
app.get('/api/data', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        
        // Get gallery images and add category info for backward compatibility
        const galleryImages = await GalleryImage.find();
        
        res.json({
            galleryImages: galleryImages.map(img => ({
                path: img.path,
                originalName: img.originalName,
                category: img.category || 'sfw' // Default to sfw if no category
            })),
            gifs: await Gif.find(),
            stories: await Story.find().sort({id: -1}),
            homework: await Homework.find(),
            settings: settings
        });
    } catch (error) {
        console.error('Data fetch error:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

// Endpoint to get gallery images by category
app.get('/api/gallery/:category', async (req, res) => {
    try {
        const category = req.params.category;
        if (!['sfw', 'nsfw'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category. Must be sfw or nsfw.' });
        }
        
        const images = await GalleryImage.find({ category });
        res.json(images);
    } catch (error) {
        console.error('Gallery fetch error:', error);
        res.status(500).json({ error: 'Error fetching gallery images' });
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
                    title: songName.replace(/[_-]/g, ' '),
                    src: `/assets/music/${file}`,
                    cover: coverFile ? `/assets/music/${coverFile}` : 'placeholder-album-art.jpg'
                };
            });
        res.json(musicLibrary);
    });
});

// Other endpoints
app.post('/api/gallery/reorder', async (req, res) => { 
    // For now, just return success. You could implement reordering logic here if needed
    res.json({ success: true }); 
});

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

app.post('/api/sync-database', (req, res) => { 
    // This function was for lowdb, can be enhanced later for MongoDB cleanup
    res.json({ success: true, cleanedCount: 0 }); 
});

// --- Socket.IO for Live Chat ---
io.on('connection', (socket) => {
    console.log('User connected to chat');
    socket.on('chat message', (msg) => io.emit('chat message', msg));
    socket.on('disconnect', () => {
        console.log('User disconnected from chat');
    });
});

// --- Final Setup ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));

// --- Helper function to ensure directories exist ---
const ensureDirectoriesExist = () => {
    const directories = [
        'public/uploads',
        'public/assets/music',
        'public/assets/gallery-covers'
    ];
    
    directories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
    
    // Create placeholder cover images if they don't exist
    const placeholderCovers = [
        'public/assets/gallery-covers/sfw-cover.jpg',
        'public/assets/gallery-covers/nsfw-cover.jpg'
    ];
    
    placeholderCovers.forEach(coverPath => {
        const fullPath = path.join(__dirname, coverPath);
        if (!fs.existsSync(fullPath)) {
            console.log(`Note: ${coverPath} not found. You should add cover images for your gallery widgets.`);
        }
    });
};

// Initialize directories on startup
ensureDirectoriesExist();