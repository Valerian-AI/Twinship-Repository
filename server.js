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

// --- Mongoose Schemas & Models ---
const MediaSchema = new mongoose.Schema({ path: String, originalName: String });
const StorySchema = new mongoose.Schema({ title: String, content: String, id: Number });
const SettingsSchema = new mongoose.Schema({
    username: { type: String, default: 'Your Name' },
    profilePicture: { type: String, default: 'placeholder-profile.jpg' },
    banner: { type: String, default: '' },
    youtubeUrl: { type: String, default: 'https://www.youtube.com' }
});
const GalleryImage = mongoose.model('GalleryImage', MediaSchema);
const Gif = mongoose.model('Gif', MediaSchema);
const Homework = mongoose.model('Homework', MediaSchema);
const Story = mongoose.model('Story', StorySchema);
const Settings = mongoose.model('Settings', SettingsSchema);

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Serve music from a separate path for cleanliness
app.use('/music-files', express.static(path.join(__dirname, 'public/uploads/music')));

// --- File Upload Logic ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // UPDATED: All uploads go to a subfolder within /uploads
        const { type } = req.body;
        let dir = 'public/uploads/';
        if (type === 'music') {
            dir = 'public/uploads/music';
        }
        // Ensure the directory exists
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- API Endpoints ---

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const { type } = req.body;

    // Correctly form the public-facing path
    let filePath = `/uploads/${req.file.filename}`;
    if (type === 'music') {
        filePath = `/music-files/${req.file.filename}`;
    }

    try {
        const fileData = { path: filePath, originalName: req.file.originalname };
        if (type === 'gallery') await GalleryImage.create(fileData);
        else if (type === 'gif') await Gif.create(fileData);
        else if (type === 'homework') await Homework.create(fileData);
        else if (type === 'profile') await Settings.updateOne({}, { profilePicture: filePath }, { upsert: true });
        else if (type === 'banner') await Settings.updateOne({}, { banner: filePath }, { upsert: true });
        // Music files don't need a database entry, the /api/music endpoint finds them
        res.json({ path: filePath, originalName: req.file.originalname });
    } catch (error) { 
        console.error("Error during upload DB operation:", error);
        res.status(500).json({ error: 'Error saving to database' }); 
    }
});

app.get('/api/music', (req, res) => {
    const musicPath = path.join(__dirname, 'public/uploads/music');
    if (!fs.existsSync(musicPath)) {
        return res.json([]); // Return empty array if directory doesn't exist
    }
    fs.readdir(musicPath, (err, files) => {
        if (err) { return res.status(500).json({ error: "Could not read music directory." }); }
        const musicLibrary = files.filter(f => f.endsWith('.mp3')).map(f => {
            const songName = path.parse(f).name.split('-').slice(1).join('-'); // Remove timestamp
            const coverFile = files.find(img => img.includes(songName) && (img.endsWith('.jpg') || img.endsWith('.png')));
            return {
                title: songName.replace(/[_-]/g, ' '),
                src: `/music-files/${f}`,
                cover: coverFile ? `/music-files/${coverFile}` : 'placeholder-album-art.jpg'
            };
        });
        res.json(musicLibrary);
    });
});

app.delete('/api/media', async (req, res) => {
    const { filePath, type } = req.body;
    if (!filePath) return res.status(400).send('Invalid file path.');
    const physicalPath = path.join(__dirname, 'public', filePath);
    if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);
    const models = { galleryImages: GalleryImage, gifs: Gif, homework: Homework };
    if (models[type]) await models[type].deleteOne({ path: filePath });
    res.json({ success: true });
});

app.get('/api/data', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        res.json({
            galleryImages: await GalleryImage.find(), gifs: await Gif.find(),
            stories: await Story.find().sort({id: -1}), homework: await Homework.find(),
            settings: settings
        });
    } catch (error) { res.status(500).json({ error: 'Error fetching data' }); }
});

// (Other endpoints are unchanged)

// --- Socket.IO & Final Setup ---
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => io.emit('chat message', msg));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));