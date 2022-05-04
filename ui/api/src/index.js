import http from 'http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { imageSize } from 'image-size';
import { Sequelize } from 'sequelize';
import { resolve, join } from 'path';
import { unlink } from 'fs';
import { rename, symlink, unlink as unlinkA} from 'fs/promises';

import PhotoModel from './photo.model.js';

// Disables caching in the image library `sharp` - needed to prevent
// image resizing/scaling not taking effect
sharp.cache(false);

// Configuration data for connecting to the database and
// location for uploaded images
const config = {
    port: 3001,
    uploadDir: `${resolve(__dirname, '..')}/uploads/`,
    symlinkDir: "/home/pi/Documents/pictureserver/img/img",
    database: {
        username: "pete",
        password: "password",
        host: "localhost",
        port: "3306",
        dialect: "mysql",
        database: "frame",
    },
    timeInterval: (3 * 60 * 60 * 1000), // 3 hours
};

let app = express();
app.server = http.createServer(app);

// Allow access to this server while browsing the frontend -
// otherwise the browser will block the request
app.use(cors());

// Connect to db
const database = new Sequelize(config.database);

// Initialize Photo model
const Photo = PhotoModel.init(database);

// Setup multer for uploading pictures
const uploadMiddleware = multer({
    dest: config.uploadDir,
    fileFilter: function (req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/))
            return callback(new Error("Only image files are allowed."));
        callback(null, true);
    }
}).single("photo");

let pictureChangeTimeout = null;

database.sync().then(() => {
    // Placeholder for root - does nothing
    app.get('/', (req, res) => {
        res.json({app: 'frame'});
    });

    // Returns the data of all photos
    app.get("/photo", async (req, res) => {
        const photos = await Photo.findAndCountAll();
        res.json({ success: true, photos });
    });

    // Returns the data of all photos
    app.get("/photo/:filename", (req, res) => {
        res.sendFile(join(config.uploadDir, `/${req.params.filename}`));
    });

    // Displays the photo on the photo frame, given the filename. This
    // function places a symlink to the photo in a folder being monitored
    // by the pic-display service. When the symlink is detected, the link's
    // destination is opened and displayed on the e-ink display.
    app.get("/photo/display/:filename", async (req, res) => {
        const photo = await Photo.findOne(
            { where: { filename: req.params.filename }});
        if (photo == null) {
            throw new Error("Could not find this photo");
        }

        const target = photo.path;
        const link = config.symlinkDir;

        try {
            await symlink(target, link);
            res.json({ success: true, photo: photo });
        } catch (err) {
            res.status(422).json({ success: false, message: err.message });
        }
    });

    // Deletes a photo from the database and the filesystem
    app.delete("/photo/:filename", async (req, res) => {
        try {
            const photo = await Photo.findOne(
                { where: { filename: req.params.filename }});
            if (photo == null) {
                throw new Error("Could not find this photo");
            }

            const path = photo.path;
            const path_thumb = photo.path_th;

            unlink(path, (err) => {
                if (err && err.code != 'ENOENT') {
                    console.log("Error deleting the file");
                }
            });
            unlink(path_thumb, (err) => {
                if (err && err.code != 'ENOENT') {
                    console.log("Error deleting the file");
                }
            });

            // Remove the entry in the database
            await Photo.destroy({ where: { id: photo.id }});

            res.json({ success: true, photo });
        } catch (err) {
            res.status(422).json({ success: false, message: err.message });
        }
    });

    // Uploads a new photo to the photo frame. This rotates the image if necessary
    // and creates a downscaled thumbnail of it to avoid slowdowns when displaying
    // the front-end.
    app.post("/photo", uploadMiddleware, async (req, res) => {
        try {
            const THUMB_SUFFIX = "_t";

            const path = req.file.path;
            const path_thumb = path + THUMB_SUFFIX;

            // Rotate the image automatically, if necessary and delete the
            // original
            const metadata = await sharp(path).metadata();
            if (metadata.orientation != 0) {
                await rename(path, path + "_unrot");
                await sharp(path + "_unrot").rotate().toFile(path);
                await unlinkA(path + "_unrot");
            }

            // Save the original dimensions
            const dimensions = imageSize(path);
            req.file.width = dimensions.width;
            req.file.height = dimensions.height;

            // If the width or the height of the original is greater than 900px,
            // shrink it down proportionally
            if (dimensions.width > 900) {
                await sharp(path).resize(900, null).toFile(path_thumb);
            } else if (dimensions.height > 900) {
                await sharp(path).resize(null, 900).toFile(path_thumb);
            } else {
                // Image is already small enough, create a symlink to the
                // thumbnail
                await symlink(path, path_thumb);
            }

            // Get the dimensions of the thumbnail
            const dimensions_thumb = imageSize(path_thumb);

            // Set all the properties of the thumbmail
            req.file.filename_th = req.file.filename + THUMB_SUFFIX;
            req.file.path_th = path_thumb;
            req.file.width_th = dimensions_thumb.width;
            req.file.height_th = dimensions_thumb.height;

            // Create the entry in the database
            const photo = await Photo.create(req.file);

            res.json({ success: true, photo });
        } catch (err) {
            console.log(err);
            res.status(422).json({ success: false, message: err.message });
        }
    });

    app.server.listen(config.port, () => {
        console.log(`Started on port ${app.server.address().port}`);
    });

    // Automatically display a new picture every so often,
    // currently set to 10,000 seconds (2.77 hours)
    const pictureChange = async () => {
        console.log('Changing picture randomly');
        const photos = await Photo.findAndCountAll();
        const randIndex = Math.floor(Math.random() * photos.count);
        const photo = photos.rows[randIndex];

        const target = photo.path;
        const link = config.symlinkDir;

        await symlink(target, link);

        // Run this function again after a configured interval
        pictureChangeTimeout = setTimeout(pictureChange, config.timeInterval);
    };

    pictureChangeTimeout = setTimeout(pictureChange, config.timeInterval);
});

export default app;
