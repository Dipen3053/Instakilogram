// ======================================================
// Cloudfisk APP
// ======================================================


// ======================================================
// GET CURRENT USER
// ======================================================

function getCurrentUser() {

    return JSON.parse(
        localStorage.getItem("user")
    );

}


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const username =
                document.getElementById(
                    "loginUsername"
                ).value;


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    username:
                                        username,

                                    password:
                                        password

                                })

                        }
                    );


                const result =
                    await response.json();


                document.getElementById(
                    "loginMessage"
                ).textContent =
                    result.message;


                if (response.ok) {

                    localStorage.setItem(

                        "user",

                        JSON.stringify(
                            result.user
                        )

                    );


                    if (
                        result.user.role ===
                        "creator"
                    ) {

                        window.location.href =
                            "creator.html";

                    } else {

                        location.reload();

                    }

                }

            }

            catch (error) {

                console.error(error);

                document.getElementById(
                    "loginMessage"
                ).textContent =
                    "Login failed.";

            }

        }
    );

}


// ======================================================
// REGISTER
// ======================================================

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const username =
                document.getElementById(
                    "registerUsername"
                ).value;


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            try {

                const response =
                    await fetch(
                        "/api/register",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    username:
                                        username,

                                    password:
                                        password

                                })

                        }
                    );


                const result =
                    await response.json();


                document.getElementById(
                    "registerMessage"
                ).textContent =
                    result.message;


                if (response.ok) {

                    localStorage.setItem(

                        "user",

                        JSON.stringify(
                            result.user
                        )

                    );


                    location.reload();

                }

            }

            catch (error) {

                console.error(error);

            }

        }
    );

}


// ======================================================
// UPDATE USER INTERFACE
// ======================================================

function updateUserInterface() {

    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    const loginSection =
        document.getElementById(
            "loginSection"
        );


    const registerSection =
        document.getElementById(
            "registerSection"
        );


    const userSection =
        document.getElementById(
            "userSection"
        );


    const uploadSection =
        document.getElementById(
            "consumerUploadSection"
        );


    if (loginSection) {

        loginSection.style.display =
            "none";

    }


    if (registerSection) {

        registerSection.style.display =
            "none";

    }


    if (userSection) {

        userSection.style.display =
            "block";

    }


    if (uploadSection) {

        uploadSection.style.display =
            "block";

    }


    const welcome =
        document.getElementById(
            "welcomeText"
        );


    if (welcome) {

        welcome.textContent =
            "Welcome, " +
            user.username +
            "!";

    }


    const creatorButton =
        document.getElementById(
            "creatorDashboardButton"
        );


    if (
        creatorButton &&
        user.role === "creator"
    ) {

        creatorButton.style.display =
            "inline-block";

    }

}


// ======================================================
// LOGOUT
// ======================================================

function logout() {

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "index.html";

}


// ======================================================
// CREATOR DASHBOARD
// ======================================================

function goToCreatorDashboard() {

    window.location.href =
        "creator.html";

}


// ======================================================
// LOAD VIDEOS
// ======================================================

async function loadVideos() {

    try {

        const response =
            await fetch(
                "/api/videos"
            );


        const videos =
            await response.json();


        showVideos(videos);

    }

    catch (error) {

        console.error(error);

        const container =
            document.getElementById(
                "videos"
            );


        if (container) {

            container.innerHTML =
                "<p>Could not load videos.</p>";

        }

    }

}


// ======================================================
// SHOW VIDEOS
// ======================================================

function showVideos(videos) {

    const container =
        document.getElementById(
            "videos"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        videos.length === 0
    ) {

        container.innerHTML =
            "<p>No videos found.</p>";

        return;

    }


    videos.forEach(
        function(video) {


            // ==========================================
            // AVERAGE RATING
            // ==========================================

            let averageRating = 0;


            if (
                Array.isArray(
                    video.ratings
                ) &&
                video.ratings.length > 0
            ) {

                const total =
                    video.ratings.reduce(
                        function(sum, rating) {

                            return (
                                sum +
                                Number(
                                    rating.rating
                                )
                            );

                        },
                        0
                    );


                averageRating =
                    (
                        total /
                        video.ratings.length
                    ).toFixed(1);

            }


            // ==========================================
            // LIKES
            // ==========================================

            const likeCount =
                Array.isArray(
                    video.likes
                )
                    ? video.likes.length
                    : 0;


            // ==========================================
            // CREATE CARD
            // ==========================================

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "videoCard";


            card.innerHTML = `

    <div class="videoCardMedia">

        <video
            controls
            preload="metadata"
        >

            <source
                src="${video.videoUrl}"
                type="video/mp4"
            >

            Your browser does not
            support video playback.

        </video>

    </div>


    <div class="videoCardContent">

        <h3>
            ${escapeHtml(video.title)}
        </h3>


        <p class="videoCreator">

            👤
            <strong>
                ${escapeHtml(
                    video.uploadedByUsername ||
                    "Unknown"
                )}
            </strong>

        </p>


        <div class="videoMeta">

            <span>
                🎬 ${escapeHtml(video.genre)}
            </span>

            <span>
                🔞 ${escapeHtml(video.ageRating)}
            </span>

        </div>


        <div class="videoDetails">

            <p>
                <strong>
                    Publisher:
                </strong>

                ${escapeHtml(video.publisher)}
            </p>


            <p>
                <strong>
                    Producer:
                </strong>

                ${escapeHtml(video.producer)}
            </p>

        </div>


        <div class="videoStats">

            <span>
                ❤️ ${likeCount} Likes
            </span>

            <span>
                ⭐ ${averageRating} / 5
            </span>

        </div>


        <div class="actions">

            <button
                onclick="likeVideo(${video.id})"
            >
                ❤️ Like
            </button>

        </div>


        <div class="ratingBox">

            <p>
                <strong>
                    ⭐ Rate this video
                </strong>
            </p>


            <select
                id="rating-${video.id}"
            >

                <option value="1">
                    ⭐ 1
                </option>

                <option value="2">
                    ⭐⭐ 2
                </option>

                <option value="3">
                    ⭐⭐⭐ 3
                </option>

                <option value="4">
                    ⭐⭐⭐⭐ 4
                </option>

                <option value="5">
                    ⭐⭐⭐⭐⭐ 5
                </option>

            </select>


            <button
                onclick="rateVideo(${video.id})"
            >
                Submit Rating
            </button>

        </div>


        <div class="commentBox">

            <h3>
                💬 Comments
            </h3>


            <div
                id="comments-${video.id}"
            >
                Loading comments...
            </div>


            <div class="commentInput">

                <input
                    type="text"
                    id="comment-${video.id}"
                    placeholder="Write a comment..."
                >


                <button
                    onclick="commentVideo(${video.id})"
                >
                    Comment
                </button>

            </div>

        </div>

    </div>

`;

            container.appendChild(
                card
            );


            loadComments(
                video.id
            );

        }
    );

}


// ======================================================
// LIKE
// ======================================================

async function likeVideo(videoId) {

    const user =
        getCurrentUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;

    }


    try {

        const response =
            await fetch(

                `/api/videos/${videoId}/like`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            userId:
                                user.id

                        })

                }

            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message
            );

            return;

        }


        loadVideos();

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not like video."
        );

    }

}


// ======================================================
// RATE
// ======================================================

async function rateVideo(videoId) {

    const user =
        getCurrentUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;

    }


    const rating =
        document.getElementById(
            `rating-${videoId}`
        ).value;


    try {

        const response =
            await fetch(

                `/api/videos/${videoId}/rate`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            userId:
                                user.id,

                            rating:
                                rating

                        })

                }

            );


        const result =
            await response.json();


        alert(
            result.message
        );


        if (response.ok) {

            loadVideos();

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not rate video."
        );

    }

}


// ======================================================
// LOAD COMMENTS
// ======================================================

async function loadComments(videoId) {

    try {

        const response =
            await fetch(
                `/api/videos/${videoId}/comments`
            );


        const comments =
            await response.json();


        const container =
            document.getElementById(
                `comments-${videoId}`
            );


        if (!container) {

            return;

        }


        if (
            comments.length === 0
        ) {

            container.innerHTML =
                "<p>No comments yet.</p>";

            return;

        }


        container.innerHTML = "";


        comments.forEach(
            function(comment) {

                const item =
                    document.createElement(
                        "p"
                    );


                item.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            comment.username
                        )}
                    </strong>

                    :
                    ${escapeHtml(
                        comment.text
                    )}

                `;


                container.appendChild(
                    item
                );

            }
        );

    }

    catch (error) {

        console.error(error);

    }

}


// ======================================================
// COMMENT
// ======================================================

async function commentVideo(videoId) {

    const user =
        getCurrentUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;

    }


    const input =
        document.getElementById(
            `comment-${videoId}`
        );


    const text =
        input.value.trim();


    if (!text) {

        alert(
            "Please write a comment."
        );

        return;

    }


    try {

        const response =
            await fetch(

                `/api/videos/${videoId}/comments`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            userId:
                                user.id,

                            username:
                                user.username,

                            text:
                                text

                        })

                }

            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message
            );

            return;

        }


        input.value = "";


        loadComments(
            videoId
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not add comment."
        );

    }

}


// ======================================================
// SEARCH
// ======================================================

async function searchVideos() {

    const search =
        document.getElementById(
            "searchInput"
        )
        .value
        .trim()
        .toLowerCase();


    if (!search) {

        loadVideos();

        return;

    }


    try {

        const response =
            await fetch(
                "/api/videos"
            );


        const videos =
            await response.json();


        const results =
            videos.filter(
                function(video) {

                    return (

                        String(
                            video.title
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            video.publisher
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            video.producer
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            video.genre
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            video.ageRating
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            video.uploadedByUsername
                        )
                        .toLowerCase()
                        .includes(search)

                    );

                }
            );


        showVideos(
            results
        );

    }

    catch (error) {

        console.error(error);

    }

}


// ======================================================
// CONSUMER VIDEO UPLOAD
// ======================================================

const consumerUploadForm =
    document.getElementById("consumerUploadForm");

if (consumerUploadForm) {

    consumerUploadForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const message =
                document.getElementById(
                    "consumerUploadMessage"
                );

            message.textContent =
                "Uploading video to Azure...";

            message.className = "";

            const user =
                getCurrentUser();

            if (!user) {

                message.textContent =
                    "Please login first.";

                message.className =
                    "error";

                return;
            }


            // --------------------------------------------------
            // GET VIDEO FILE
            // --------------------------------------------------

            const fileInput =
                document.getElementById(
                    "consumerVideo"
                );

            const file =
                fileInput.files[0];


            if (!file) {

                message.textContent =
                    "Please select a video.";

                message.className =
                    "error";

                return;
            }


            // --------------------------------------------------
            // CHECK FILE TYPE
            // --------------------------------------------------

            if (
                !file.type.startsWith("video/")
            ) {

                message.textContent =
                    "Please select a valid video file.";

                message.className =
                    "error";

                return;
            }


            // --------------------------------------------------
            // CHECK FILE SIZE
            // --------------------------------------------------

            const maxSize =
                200 * 1024 * 1024;


            if (file.size > maxSize) {

                message.textContent =
                    "Video is too large. Maximum size is 200 MB.";

                message.className =
                    "error";

                return;
            }


            console.log(
                "Video selected:",
                file.name
            );

            console.log(
                "Video type:",
                file.type
            );

            console.log(
                "Video size:",
                file.size,
                "bytes"
            );


            // --------------------------------------------------
            // CREATE FORM DATA
            // --------------------------------------------------

            const formData =
                new FormData();


            formData.append(
                "video",
                file
            );


            formData.append(
                "title",
                document.getElementById(
                    "consumerTitle"
                ).value.trim()
            );


            formData.append(
                "publisher",
                document.getElementById(
                    "consumerPublisher"
                ).value.trim()
            );


            formData.append(
                "producer",
                document.getElementById(
                    "consumerProducer"
                ).value.trim()
            );


            formData.append(
                "genre",
                document.getElementById(
                    "consumerGenre"
                ).value
            );


            formData.append(
                "ageRating",
                document.getElementById(
                    "consumerAgeRating"
                ).value
            );


            formData.append(
                "uploadedBy",
                user.id
            );


            formData.append(
                "uploadedByUsername",
                user.username
            );


            formData.append(
                "uploadedByRole",
                user.role
            );


            // --------------------------------------------------
            // UPLOAD TO BACKEND
            // --------------------------------------------------

            try {

                console.log(
                    "Sending video to /api/videos/upload..."
                );


                const response =
                    await fetch(
                        "/api/videos/upload",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                console.log(
                    "Server response:",
                    response.status
                );


                // --------------------------------------------------
                // READ RESPONSE SAFELY
                // --------------------------------------------------

                const responseText =
                    await response.text();


                console.log(
                    "Server response body:",
                    responseText
                );


                let result;


                try {

                    result =
                        JSON.parse(
                            responseText
                        );

                }

                catch {

                    result = {
                        message:
                            responseText ||
                            "Server returned an invalid response."
                    };

                }


                // --------------------------------------------------
                // HANDLE ERROR
                // --------------------------------------------------

                if (!response.ok) {

                    console.error(
                        "UPLOAD ERROR:",
                        result
                    );


                    message.textContent =
                        result.message ||
                        result.error ||
                        `Upload failed. Server returned ${response.status}.`;


                    message.className =
                        "error";


                    return;

                }


                // --------------------------------------------------
                // SUCCESS
                // --------------------------------------------------

                console.log(
                    "UPLOAD SUCCESS:",
                    result
                );


                message.textContent =
                    "Video uploaded successfully to Azure!";


                message.className =
                    "success";


                consumerUploadForm.reset();


                // Refresh videos

                await loadVideos();


            }

            catch (error) {

                console.error(
                    "UPLOAD REQUEST ERROR:",
                    error
                );


                message.textContent =
                    "Could not connect to the server. Check the browser console and Azure App Service logs.";


                message.className =
                    "error";

            }

        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(
        value || ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// ======================================================
// START
// ======================================================
// ======================================================
// GENRE FILTER
// ======================================================

// ======================================================
// UPLOAD VIDEO TO AZURE BLOB STORAGE
// ======================================================

app.post(
    "/api/videos/upload",
    upload.single("video"),
    async (req, res) => {

        console.log("=================================");
        console.log("VIDEO UPLOAD STARTED");
        console.log("=================================");

        try {

            // --------------------------------------------------
            // CHECK FILE
            // --------------------------------------------------

            if (!req.file) {

                console.log("ERROR: No video file received.");

                return res.status(400).json({
                    message: "Please select a video."
                });

            }

            console.log("File received:");
            console.log("Original name:", req.file.originalname);
            console.log("MIME type:", req.file.mimetype);
            console.log("File size:", req.file.size);


            // --------------------------------------------------
            // CHECK AZURE CONNECTION
            // --------------------------------------------------

            if (!AZURE_STORAGE_CONNECTION_STRING) {

                console.error(
                    "ERROR: AZURE_STORAGE_CONNECTION_STRING is missing."
                );

                return res.status(500).json({
                    message:
                        "Azure Storage connection string is not configured."
                });

            }

            console.log(
                "Azure Storage connection string detected."
            );


            // --------------------------------------------------
            // CREATE CONTAINER IF NEEDED
            // --------------------------------------------------

            console.log(
                "Checking Azure videos container..."
            );

            await containerClient.createIfNotExists();

            console.log(
                "Azure videos container ready."
            );


            // --------------------------------------------------
            // CREATE SAFE FILE NAME
            // --------------------------------------------------

            const safeName =
                req.file.originalname.replace(
                    /[^a-zA-Z0-9.-]/g,
                    "_"
                );


            const blobName =
                Date.now() +
                "-" +
                safeName;


            console.log(
                "Blob name:",
                blobName
            );


            // --------------------------------------------------
            // CREATE BLOB CLIENT
            // --------------------------------------------------

            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            console.log(
                "Uploading video to Azure Blob Storage..."
            );


            // --------------------------------------------------
            // UPLOAD VIDEO
            // --------------------------------------------------

            await blockBlobClient.uploadData(
                req.file.buffer,
                {
                    blobHTTPHeaders: {
                        blobContentType:
                            req.file.mimetype
                    }
                }
            );


            console.log(
                "VIDEO SUCCESSFULLY UPLOADED TO AZURE!"
            );


            console.log(
                "Blob URL:",
                blockBlobClient.url
            );


            // --------------------------------------------------
            // GET EXISTING VIDEOS
            // --------------------------------------------------

            const videos =
                getVideos();


            // --------------------------------------------------
            // CREATE DATABASE RECORD
            // --------------------------------------------------

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
                    req.body.uploadedByUsername ||
                    "",

                uploadedByRole:
                    req.body.uploadedByRole ||
                    "",

                likes:
                    [],

                ratings:
                    [],

                comments:
                    [],

                uploadedAt:
                    new Date().toISOString()

            };


            // --------------------------------------------------
            // SAVE VIDEO RECORD
            // --------------------------------------------------

            videos.push(
                newVideo
            );

            saveVideos(
                videos
            );


            console.log(
                "Video record saved."
            );


            // --------------------------------------------------
            // SEND SUCCESS RESPONSE
            // --------------------------------------------------

            console.log(
                "================================="
            );

            console.log(
                "UPLOAD COMPLETE"
            );

            console.log(
                "================================="
            );


            return res.status(200).json({

                message:
                    "Video uploaded successfully.",

                video:
                    newVideo

            });

        }

        catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "AZURE VIDEO UPLOAD FAILED"
            );

            console.error(
                "================================="
            );

            console.error(
                "Error name:",
                error.name
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Full error:",
                error
            );


            return res.status(500).json({

                message:
                    "Upload failed.",

                error:
                    error.message || "Unknown Azure error."

            });

        }

    }
);
async function filterByGenre(genre) {

    try {

        const response =
            await fetch("/api/videos");

        const videos =
            await response.json();


        if (genre === "All") {

            showVideos(videos);

            return;

        }


        const filteredVideos =
            videos.filter(
                function(video) {

                    return String(
                        video.genre
                    ).toLowerCase() ===
                    genre.toLowerCase();

                }
            );


        showVideos(filteredVideos);

    }

    catch (error) {

        console.error(error);

        const container =
            document.getElementById(
                "videos"
            );

        if (container) {

            container.innerHTML =
                "<p>Could not filter videos.</p>";

        }

    }

}
updateUserInterface();

loadVideos();