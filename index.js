import express from 'express';
import read, {add} from './jsonFileStorage.js';

const app = express();
app.use(express.static('public'));
// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));

const port = 3004

// Set view engine
app.set('view engine', 'ejs');

// listing of all UFO
app.get(`/`, (req, res) => {
  read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error (`read error` , error)
      return;
    } 
    const data = jsonObjContent.sightings;

    const numOfRecords = {index : data.length};
    res.render(`listing`, numOfRecords); // put in a object so u can use the key-value
    });
});

// COMFORTABLE - redirect to http://localhost:3004/sighting/<INDEX>
// Render the form to input new sightings
app.get('/sighting', (request, response) => {
  response.render('sighting');
});
// Save new sighting data sent via POST request from our form
app.post('/sighting', (request, response) => {
  // Add new sighting data in request.body to sightings array in data.json.
  console.log('before added sighting')
  add('data.json', 'sightings', request.body, (err) => {
    console.log('added sighting')
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }
  });
    // Acknowledge sighting saved.
    // return response.send('Saved bigfoot sighting!');
  // Redirect to new recording
  read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error(`read error`, error);
      return;
    }
    const data = jsonObjContent.sightings;
    // console.log(`data`,data)
    // const total = data.length
    let index = data.length
    console.log(`last index`, index);
    response.redirect(`/sighting/${index}`);
    });
})


app.get('/sighting/:index', (req,res) =>{
  read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error(`read error`, error);
      return;
    }
    // const data = jsonObjContent.sightings;
    // console.log(`data`,data)
    // const total = data.length
    const details = jsonObjContent.sightings[req.params.index];
    console.log(`details`, details);
    res.render(`single_sighting`, {details});
  });
  });


app.listen(port)