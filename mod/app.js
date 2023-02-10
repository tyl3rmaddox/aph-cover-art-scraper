// Written by Tyler Maddox, tmaddox@aph.org

// declarations
const fs = require('fs');
const request = require('request');
const express = require('express');
const app = express();
const bookcovers = require("bookcovers");
const webp = require('webp-converter');
const util = require('util');
const unlinkP = util.promisify(fs.unlink);


// serve files from the public directory
app.use(express.static('public'));
app.use(express.json())

// start the express web server listening on 8080
app.listen(8080, () => {
    console.log('listening on 8080');
});

// serve the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// post request
app.post('/', (req, res) => {

    const {
        parcel
    } = req.body
    res.status(200).send({
        status: 'received'
    })

    console.log("Download manifest: " + req.body.parcel)

    let downloadManifest = req.body.parcel
    downloadCovers(downloadManifest);

    function downloadCovers(isbnNumbers) {
        for (i in isbnNumbers) {
            let isbnNumber = isbnNumbers[i]
            const getCover = async (isbnNumber) => {
                try {
                    const images = []
                    await bookcovers.withIsbn(isbnNumber).then(results => {
                        for (let [key, value] of Object.entries(results.amazon)) {
                            images.push(`${value}`)
                        }
                    })
                    let bestImage = await images[images.length - 1].toString();
                    return bestImage
                } catch (err) {
                    console.log(err)
                }
            }

            getCover(isbnNumber)
                .then(res => {
                    var download = function (uri, filename, callback) {
                        request.head(uri, function (err, res, body) {
                            console.log('content-type:', res.headers['content-type']);
                            console.log('content-length:', res.headers['content-length']);

                            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
                        });
                    };

                    download(res, 'C:/CoverImages/' + isbnNumber + '.webp', function () {
                        console.log('done');
                        convertToJpg();
                    });
                })

            const convertToJpg = () => {
                const result = webp.dwebp('C:/CoverImages/' + isbnNumber + '.webp', "C:/CoverImages/" + isbnNumber + ".png", "-o", logging = "-v");
                result.then((response) => {
                    console.log(response);
                    cleanUp()
                });
            }

            const cleanUp = () => {
                unlinkP('C:/CoverImages/' + isbnNumber + '.webp')
            }
        }
    }
});