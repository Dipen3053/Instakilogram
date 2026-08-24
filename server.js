require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
    BlobServiceClient
} = require("@azure/storage-blob");
const app = express();
const AZURE_STORAGE_CONNECTION_STRING =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

const containerName = "videos";

const dataContainerName = "data";


const blobServiceClient =
    BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING
    );


const containerClient =
    blobServiceClient.getContainerClient(
        containerName
    );


const dataContainerClient =
    blobServiceClient.getContainerClient(
        dataContainerName
    );
const PORT = process.env.PORT || 3000;


// ======================================================
// FOLDERS
// ======================================================

const dataFolder = path.join(__dirname, "data");
const uploadsFolder = path.join(__dirname, "uploads");


// Create folders if they don't exist

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder);
}


// ======================================================
// JSON DATABASE FILES
// ======================================================

const usersFile =
    path.join(dataFolder, "users.json");

const videosFile =
    path.join(dataFolder, "videos.json");


if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

if (!fs.existsSync(videosFile)) {
    fs.writeFileSync(videosFile, "[]");
}


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// Serve frontend

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// Serve uploaded videos

app.use(
    "/uploads",
    express.static(uploadsFolder)
);


// ======================================================
// MULTER VIDEO UPLOAD
// ======================================================

// ======================================================
// MULTER VIDEO UPLOAD
// ======================================================

const upload =
    multer({

        storage: multer.memoryStorage(),

        limits: {

            fileSize:
                200 * 1024 * 1024

        },

        fileFilter:
            function(req, file, cb) {

                if (
                    file.mimetype &&
                    file.mimetype.startsWith(
                        "video/"
                    )
                ) {

                    cb(
                        null,
                        true
                    );

                }

                else {

                    cb(
                        new Error(
                            "Only video files are allowed."
                        )
                    );

                }

            }

    });

// ======================================================
// HELPER FUNCTIONS
// ======================================================

function getUsers() {

    return JSON.parse(
        fs.readFileSync(
            usersFile,
            "utf8"
        )
    );

}


function saveUsers(users) {

    fs.writeFileSync(

        usersFile,

        JSON.stringify(
            users,
            null,
            2
        )

    );


    uploadJsonToAzure(
        usersFile,
        "users.json"
    );

}

function getVideos() {

    return JSON.parse(
        fs.readFileSync(
            videosFile,
            "utf8"
        )
    );

}


function saveVideos(videos) {

    fs.writeFileSync(

        videosFile,

        JSON.stringify(
            videos,
            null,
            2
        )

    );


    uploadJsonToAzure(
        videosFile,
        "videos.json"
    );

}
// ======================================================
// AZURE DATA STORAGE
// ======================================================

async function uploadJsonToAzure(filePath, blobName) {

    try {

        const fileContent =
            fs.readFileSync(
                filePath,
                "utf8"
            );


        const blockBlobClient =
            dataContainerClient.getBlockBlobClient(
                blobName
            );


        await blockBlobClient.upload(
            fileContent,
            Buffer.byteLength(fileContent),
            {
                overwrite: true,
                blobHTTPHeaders: {
                    blobContentType:
                        "application/json"
                }
            }
        );


        console.log(
            `Azure: ${blobName} uploaded successfully.`
        );

    }

    catch (error) {

        console.error(
            `Azure upload failed for ${blobName}:`,
            error.message
        );

    }

}


async function downloadJsonFromAzure(
    blobName,
    filePath
) {

    try {

        const blockBlobClient =
            dataContainerClient.getBlockBlobClient(
                blobName
            );


        const exists =
            await blockBlobClient.exists();


        if (!exists) {

            return false;

        }


        const downloadResponse =
            await blockBlobClient.download();


        const downloaded =
            await streamToString(
                downloadResponse.readableStreamBody
            );


        fs.writeFileSync(
            filePath,
            downloaded
        );


        console.log(
            `Azure: ${blobName} downloaded successfully.`
        );


        return true;

    }

    catch (error) {

        console.error(
            `Azure download failed for ${blobName}:`,
            error.message
        );


        return false;

    }

}


function streamToString(stream) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const chunks = [];


            stream.on(
                "data",
                chunk => chunks.push(chunk)
            );


            stream.on(
                "end",
                () =>
                    resolve(
                        Buffer.concat(
                            chunks
                        ).toString("utf8")
                    )
            );


            stream.on(
                "error",
                reject
            );

        }
    );

}


async function initialiseAzureData() {

    try {

        // Make sure the data container exists.

        await dataContainerClient.createIfNotExists();


        // Try to download the existing cloud data.

        const usersDownloaded =
            await downloadJsonFromAzure(
                "users.json",
                usersFile
            );


        const videosDownloaded =
            await downloadJsonFromAzure(
                "videos.json",
                videosFile
            );


        // If the cloud files don't exist yet,
        // upload the existing local files.

        if (!usersDownloaded) {

            await uploadJsonToAzure(
                usersFile,
                "users.json"
            );

        }


        if (!videosDownloaded) {

            await uploadJsonToAzure(
                videosFile,
                "videos.json"
            );

        }


        console.log(
            "Azure data storage initialised successfully."
        );

    }

    catch (error) {

        console.error(
            "Azure data initialisation failed:",
            error.message
        );

    }

}


// ======================================================
// REGISTER CONSUMER
// ======================================================

app.post(
    "/api/register",
    (req, res) => {

        const username =
            String(
                req.body.username || ""
            ).trim();


        const password =
            String(
                req.body.password || ""
            );


        if (
            !username ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "Username and password are required."

            });

        }


        const users =
            getUsers();


        const existing =
            users.find(
                user =>
                    user.username.toLowerCase() ===
                    username.toLowerCase()
            );


        if (existing) {

            return res.status(400).json({

                message:
                    "Username already exists."

            });

        }


        const newUser = {

            id:
                Date.now(),

            username:
                username,

            password:
                password,

            role:
                "consumer"

        };


        users.push(
            newUser
        );


        saveUsers(
            users
        );


        res.json({

            message:
                "Account created successfully.",

            user: {

                id:
                    newUser.id,

                username:
                    newUser.username,

                role:
                    newUser.role

            }

        });

    }
);


// ======================================================
// LOGIN
// ======================================================

app.post(
    "/api/login",
    (req, res) => {

        const username =
            String(
                req.body.username || ""
            ).trim();


        const password =
            String(
                req.body.password || ""
            );


        const users =
            getUsers();


        const user =
            users.find(
                user =>
                    user.username ===
                    username &&
                    user.password ===
                    password
            );


        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid username or password."

            });

        }


        res.json({

            message:
                "Login successful.",

            user: {

                id:
                    user.id,

                username:
                    user.username,

                role:
                    user.role

            }

        });

    }
);


// ======================================================
// GET ALL VIDEOS
// ======================================================

app.get(
    "/api/videos",
    (req, res) => {

        const videos =
            getVideos();


        videos.sort(
            (a, b) =>
                b.id - a.id
        );


        res.json(
            videos
        );

    }
);


// ======================================================
// UPLOAD VIDEO
// ======================================================

// ======================================================
// UPLOAD VIDEO TO AZURE BLOB STORAGE
// ======================================================

app.post(
    "/api/videos/upload",
    upload.single("video"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please select a video."

                });

            }


            // Make sure the Azure container exists

            await containerClient.createIfNotExists();


            // Create a unique filename

            const safeName =
                req.file.originalname.replace(
                    /[^a-zA-Z0-9.-]/g,
                    "_"
                );


            const blobName =
                Date.now() +
                "-" +
                safeName;


            // Create a Blob client

            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            // Upload video to Azure Blob Storage

            await blockBlobClient.uploadData(
                req.file.buffer,
                {

                    blobHTTPHeaders: {

                        blobContentType:
                            req.file.mimetype

                    }

                }
            );


            // Get videos from JSON database

            const videos =
                getVideos();


            // Create video record

            const newVideo = {

                id:
                    Date.now(),

                title:
                    req.body.title ||
                    "Untitled",

                publisher:
                    req.body.publisher ||
                    "Unknown",

                producer:
                    req.body.producer ||
                    "Unknown",

                genre:
                    req.body.genre ||
                    "Other",

                ageRating:
                    req.body.ageRating ||
                    "U",

                videoUrl:
                    blockBlobClient.url,

                uploadedBy:
                    Number(
                        req.body.uploadedBy
                    ),

                uploadedByUsername:
                    req.body.uploadedByUsername,

                uploadedByRole:
                    req.body.uploadedByRole,

                likes:
                    [],

                ratings:
                    [],

                comments:
                    [],

                uploadedAt:
                    new Date().toISOString()

            };


            // Save video information

            videos.push(
                newVideo
            );


            saveVideos(
                videos
            );


            res.json({

                message:
                    "Video uploaded successfully.",

                video:
                    newVideo

            });

        }

        catch (error) {

            console.error(
                "Azure upload error:",
                error
            );


            res.status(500).json({

                message:
                    "Upload failed."

            });

        }

    }
);
// ======================================================
// LIKE / UNLIKE
// ======================================================

app.post(
    "/api/videos/:id/like",
    (req, res) => {

        const videos =
            getVideos();


        const video =
            videos.find(
                video =>
                    video.id ===
                    Number(
                        req.params.id
                    )
            );


        if (!video) {

            return res.status(404).json({

                message:
                    "Video not found."

            });

        }


        const userId =
            Number(
                req.body.userId
            );


        if (
            !Array.isArray(
                video.likes
            )
        ) {

            video.likes = [];

        }


        const alreadyLiked =
            video.likes.includes(
                userId
            );


        if (alreadyLiked) {

            video.likes =
                video.likes.filter(
                    id =>
                        id !== userId
                );


            saveVideos(
                videos
            );


            return res.json({

                message:
                    "Like removed.",

                likes:
                    video.likes.length

            });

        }


        video.likes.push(
            userId
        );


        saveVideos(
            videos
        );


        res.json({

            message:
                "Video liked.",

            likes:
                video.likes.length

        });

    }
);


// ======================================================
// RATE VIDEO
// ======================================================

app.post(
    "/api/videos/:id/rate",
    (req, res) => {

        const videos =
            getVideos();


        const video =
            videos.find(
                video =>
                    video.id ===
                    Number(
                        req.params.id
                    )
            );


        if (!video) {

            return res.status(404).json({

                message:
                    "Video not found."

            });

        }


        const userId =
            Number(
                req.body.userId
            );


        const rating =
            Number(
                req.body.rating
            );


        if (
            rating < 1 ||
            rating > 5
        ) {

            return res.status(400).json({

                message:
                    "Rating must be between 1 and 5."

            });

        }


        if (
            !Array.isArray(
                video.ratings
            )
        ) {

            video.ratings = [];

        }


        const existing =
            video.ratings.find(
                item =>
                    item.userId ===
                    userId
            );


        if (existing) {

            existing.rating =
                rating;

        }

        else {

            video.ratings.push({

                userId:
                    userId,

                rating:
                    rating

            });

        }


        saveVideos(
            videos
        );


        res.json({

            message:
                "Rating saved."

        });

    }
);


// ======================================================
// ADD COMMENT
// ======================================================

app.post(
    "/api/videos/:id/comments",
    (req, res) => {

        const videos =
            getVideos();


        const video =
            videos.find(
                video =>
                    video.id ===
                    Number(
                        req.params.id
                    )
            );


        if (!video) {

            return res.status(404).json({

                message:
                    "Video not found."

            });

        }


        const text =
            String(
                req.body.text || ""
            ).trim();


        if (!text) {

            return res.status(400).json({

                message:
                    "Comment cannot be empty."

            });

        }


        if (
            !Array.isArray(
                video.comments
            )
        ) {

            video.comments = [];

        }


        video.comments.push({

            id:
                Date.now(),

            userId:
                Number(
                    req.body.userId
                ),

            username:
                req.body.username,

            text:
                text,

            date:
                new Date().toISOString()

        });


        saveVideos(
            videos
        );


        res.json({

            message:
                "Comment added."

        });

    }
);


// ======================================================
// GET COMMENTS
// ======================================================

app.get(
    "/api/videos/:id/comments",
    (req, res) => {

        const videos =
            getVideos();


        const video =
            videos.find(
                video =>
                    video.id ===
                    Number(
                        req.params.id
                    )
            );


        if (!video) {

            return res.status(404).json({

                message:
                    "Video not found."

            });

        }


        res.json(
            video.comments || []
        );

    }
);


// ======================================================
// GET CREATOR VIDEOS
// ======================================================

app.get(
    "/api/creator/:id/videos",
    (req, res) => {

        const videos =
            getVideos();


        const creatorVideos =
            videos.filter(
                video =>
                    video.uploadedBy ===
                    Number(
                        req.params.id
                    )
            );


        res.json(
            creatorVideos
        );

    }
);


// ======================================================
// EDIT CREATOR VIDEO
// ======================================================

app.put(
    "/api/videos/:id",
    (req, res) => {

        try {

            const videos =
                getVideos();


            const videoId =
                Number(
                    req.params.id
                );


            const video =
                videos.find(
                    video =>
                        video.id ===
                        videoId
                );


            if (!video) {

                return res.status(404).json({

                    message:
                        "Video not found."

                });

            }


            const userId =
                Number(
                    req.body.userId
                );


            // Only the creator who uploaded
            // the video can edit it.

            if (
                video.uploadedBy !==
                userId
            ) {

                return res.status(403).json({

                    message:
                        "You can only edit your own videos."

                });

            }


            const title =
                String(
                    req.body.title || ""
                ).trim();


            const publisher =
                String(
                    req.body.publisher || ""
                ).trim();


            const producer =
                String(
                    req.body.producer || ""
                ).trim();


            const genre =
                String(
                    req.body.genre || "Other"
                );


            const ageRating =
                String(
                    req.body.ageRating || "U"
                );


            if (!title) {

                return res.status(400).json({

                    message:
                        "Video title is required."

                });

            }


            if (!publisher) {

                return res.status(400).json({

                    message:
                        "Publisher is required."

                });

            }


            if (!producer) {

                return res.status(400).json({

                    message:
                        "Producer is required."

                });

            }


            video.title =
                title;


            video.publisher =
                publisher;


            video.producer =
                producer;


            video.genre =
                genre;


            video.ageRating =
                ageRating;


            saveVideos(
                videos
            );


            res.json({

                message:
                    "Video updated successfully.",

                video:
                    video

            });

        }

        catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Could not update video."

            });

        }

    }
);


// ======================================================
// DELETE CREATOR VIDEO
// ======================================================

app.delete(
    "/api/videos/:id",
    (req, res) => {

        try {

            const videos =
                getVideos();


            const videoId =
                Number(
                    req.params.id
                );


            const videoIndex =
                videos.findIndex(
                    video =>
                        video.id ===
                        videoId
                );


            if (
                videoIndex === -1
            ) {

                return res.status(404).json({

                    message:
                        "Video not found."

                });

            }


            const video =
                videos[videoIndex];


            const userId =
                Number(
                    req.body.userId
                );


            // Only the creator who uploaded
            // the video can delete it.

            if (
                video.uploadedBy !==
                userId
            ) {

                return res.status(403).json({

                    message:
                        "You can only delete your own videos."

                });

            }


            // Remove from JSON database

            videos.splice(
                videoIndex,
                1
            );


            saveVideos(
                videos
            );


            // Remove physical video file

            if (
                video.videoUrl
            ) {

                const filename =
                    path.basename(
                        video.videoUrl
                    );


                const filePath =
                    path.join(
                        uploadsFolder,
                        filename
                    );


                if (
                    fs.existsSync(
                        filePath
                    )
                ) {

                    fs.unlinkSync(
                        filePath
                    );

                }

            }


            res.json({

                message:
                    "Video deleted successfully."

            });

        }

        catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Could not delete video."

            });

        }

    }
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
    function(error, req, res, next) {

        console.error(
            error
        );


        res.status(500).json({

            message:
                error.message ||
                "Server error."

        });

    }
);


// ======================================================
// START SERVER
// ======================================================

initialiseAzureData()
    .then(
        () => {

            app.listen(
                PORT,
                () => {

                    console.log(
                        "================================="
                    );

                    console.log(
                        "Instakilogram is running!"
                    );

                    console.log(
                        `http://localhost:${PORT}`
                    );

                    console.log(
                        "Azure data storage is connected."
                    );

                    console.log(
                        "================================="
                    );

                }
            );

        }
    )
    .catch(
        error => {

            console.error(
                "Could not initialise Azure data storage:",
                error
            );

        }
    );