import express from 'express';
import read, {add, write} from './jsonFileStorage.js';
import fs from 'fs';
// import methodOverride from 'method-override';

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
    // put in an object so can use the key-value
    res.render(`listing`, {data}); 

    // const numOfRecords = {index : data.length};
    // res.render(`listing`, numOfRecords); // put in a object so u can use the key-value
    });
});

app.delete('/sighting/:index/delete', (request, response) => {
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    data['sightings'].splice(index, 1);
    write('data.json', data, (err) => {
      const numOfRecords = {index : data.length};
      response.render('listing',numOfRecords);
    });
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

// Display the sighting selected from listing page
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

// Display the sighting to edit
app.get('/sighting/:index/edit', (req,res) =>{

 read(`data.json`, (error, jsonObjContent) => {
  if (error) {
   console.error(`read error`, error);
   return;
   }
  const {index} = req.params // req.params is an object..destructuring
  console.log(`type of req.params`, typeof req.params)
  console.log(req.params)
  console.log(`type of index`, typeof index)
  console.log(index)
  const oneSighting = jsonObjContent.sightings[index];
  oneSighting.index = index
  const details = {oneSighting}
  console.log(`details`, details);
  res.render(`editForm`, details);
  });
});

// BLOCKER_2!! Thunderclient is ok. Cannot route to ("/sighting/:index/")
app.put('/sighting/:index/edit', (req,res) =>{
    const {index} = req.params.index;
    read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error(`read error`, error);
      return;
    };

    jsonObjContent.sightings[index] = req.body;
    const details = jsonObjContent.sightings[index];
    write('data.json', jsonObjContent, (err) => {
    //   // res.send('Done!');
      res.render(`single_sighting`, {details});
    //   console.log(`request.body`, req.body)
    //   // console.log(`index`, index)  
    });
    
  });  
//     // await fs.promises.writeFile("data.json", JSON.stringify(jsonObjContent),{encoding: 'utf8' })
//     res.render(`single_sighting`, {details} )
  
})


// Not relevant as display vs edit form is different in res.render portion
// const displaySighting = (req, res) => {
//    console.log(`request came in`)
//      read(`data.json`, (error, jsonObjContent) => {
//     if (error) {
//       console.error(`read error`, error);
//       return;
//     }
//     const details = jsonObjContent.sightings[req.params.index];
//     console.log(`details`, details);
//     res.render(`editForm`, {details});
//   });
// }

// app.get('/sighting/:index', displaySighting)
// app.get('/sighting/:index/edit', displaySighting)

// BLOCKERS 1a= couldnt get the shapesObj to render in shapes.ejs when manipulation were done there 
// BLOCKERS 1b = shapeObject not found
// thinking of a counter and object tally
app.get(`/shapes`, (req, res) => {
  
  read(`data.json`, (error, jsonObjContent)=>{
    // let shapeCounterArray = []
    // let keyValueCounter = {}
    // let shapeCounterObject = {}
    if (error){
    // res.send(404).json(`data does not exist`)
    res.status(404).send("Data does not exist")
    // res.send("error in data")
    }
    let data = jsonObjContent.sightings
    // console.log(`contents`, data)

    // do the tally in .js instead of shapes.ejs
    let shapesArray = []
    for (let i=0; i< data.length; i +=1 ){
      // console.log(`type`, typeof shapesArray[0])
      let shape = String(data[i].SHAPE)
      shape = shape.replace(/ /g, "_");
      shape = shape.toUpperCase();
      shapesArray.push(shape)
    }
    shapesArray.sort()
    console.log(`shape array caps`, shapesArray)
    let shapeCounterObject = shapesArray.reduce(function (acc, curr) {
      return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
        }, {});
    console.log(shapeCounterObject)
    res.render(`shapes`, {shapeCounterObject})
  })
})

const getShape = (request, response) =>{
  console.log(`request came in`, request.body)
  read(`data.json`, (readErr, jsonContentObj) => {
    if(readErr){
      console.error(`ReadError`, readErr)
      response.send('ERROR')
    } else {
      console.log(request.params)
      let shape = request.params.shape
      console.log(`index`, typeof shape, shape)
      const sightingsMatchingShape = jsonContentObj.sightings.filter(element => (element.SHAPE.replace(/ /g, "_")).toUpperCase() === shape )
      // response.send(sightingsMatchingShape)
      console.log(sightingsMatchingShape)
      // response.send(`getting there`)
      response.render(`sightings_shape`,{sightingsMatchingShape})
    }
  })
}
app.get(`/shapes/:shape`, getShape)

app.listen(port)